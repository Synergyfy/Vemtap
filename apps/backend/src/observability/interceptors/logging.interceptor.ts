import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { logger } from '../logger.config';
import { trace, context as otelContext } from '@opentelemetry/api';
import { ObservabilityStoreService } from '../observability-store.service';

/** Maximum characters stored for request body preview (keeps RAM low). */
const BODY_PREVIEW_MAX = 512;

/**
 * Converts an arbitrary request body to a compact string preview.
 * Avoids storing large payloads (file uploads, large JSON arrays) in RAM.
 */
function bodyPreview(body: unknown): string | undefined {
  if (body === undefined || body === null) return undefined;
  try {
    const str = typeof body === 'string' ? body : JSON.stringify(body);
    if (str.length <= BODY_PREVIEW_MAX) return str;
    return str.slice(0, BODY_PREVIEW_MAX) + '…';
  } catch {
    return '[unserializable]';
  }
}

/**
 * Extracts a minimal, safe subset of request headers.
 * Storing the full headers map would include auth tokens, cookies, and large values.
 */
function safeHeaders(headers: Request['headers']): Record<string, string> {
  const safe: Record<string, string> = {};
  const allow = ['content-type', 'x-forwarded-for', 'origin'] as const;
  for (const key of allow) {
    const val = headers[key];
    if (val) safe[key] = Array.isArray(val) ? val.join(', ') : val;
  }
  return safe;
}

@Injectable()
export class ObservabilityLoggingInterceptor implements NestInterceptor {
  constructor(private readonly storeService?: ObservabilityStoreService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const method = request.method;
    const url = request.url;
    // NestJS routes pattern like `/users/:id`
    const route = request.route?.path || request.path;

    const requestId = (request as any).requestId || 'unknown-request-id';

    // Attempt to get OpenTelemetry Trace ID
    const activeSpan = trace.getSpan(otelContext.active());
    const traceId = activeSpan ? activeSpan.spanContext().traceId : undefined;

    const now = Date.now();

    // Capture cheap scalar fields eagerly; defer expensive serialisation to the response phase
    const ip = request.ip || request.headers['x-forwarded-for'] || request.socket.remoteAddress;
    const userAgent = request.headers['user-agent'];
    const userId = (request as any).user?.id;
    const userEmail = (request as any).user?.email;

    // Capture request data once at intercept time (before body may be mutated by pipes)
    const requestBodyPreview = bodyPreview(request.body);
    const queryParams = request.query;
    const requestHeaders = safeHeaders(request.headers);

    // Base log object (cheap, no serialisation)
    const logBase = {
      requestId,
      method,
      route,
      traceId,
    };

    return next.handle().pipe(
      tap(() => {
        const statusCode = response.statusCode;
        const responseTime = Date.now() - now;

        // Structured success log (stdout only — pino handles this efficiently)
        logger.info({
          ...logBase,
          statusCode,
          responseTime,
          msg: `HTTP ${method} ${url}`,
        });

        // Push compact log entry to in-memory store
        // NOTE: responseBody is intentionally omitted — storing full response payloads
        // is the largest single source of RAM growth in the observability store.
        if (this.storeService) {
          this.storeService.addLog({
            id: requestId,
            traceId,
            timestamp: new Date().toISOString(),
            method,
            url: request.originalUrl || request.url,
            route,
            statusCode,
            responseTime,
            ip: Array.isArray(ip) ? ip.join(', ') : String(ip || ''),
            userAgent,
            userId,
            userEmail,
            requestHeaders,
            queryParams,
            requestBody: requestBodyPreview,
          });
        }
      }),
      catchError((error: any) => {
        const statusCode = (error?.status as number) || (error?.statusCode as number) || 500;
        const responseTime = Date.now() - now;

        // Structured error log
        logger.error({
          ...logBase,
          statusCode,
          responseTime,
          error: error?.message || 'Internal Server Error',
          stack: error?.stack,
          msg: `HTTP ${method} ${url} Error`,
        });

        // Push compact error log to in-memory store
        if (this.storeService) {
          this.storeService.addLog({
            id: requestId,
            traceId,
            timestamp: new Date().toISOString(),
            method,
            url: request.originalUrl || request.url,
            route,
            statusCode,
            responseTime,
            ip: Array.isArray(ip) ? ip.join(', ') : String(ip || ''),
            userAgent,
            userId,
            userEmail,
            requestHeaders,
            queryParams,
            requestBody: requestBodyPreview,
            error: {
              message: error?.message || 'Internal Server Error',
              name: error?.name || 'Error',
              stack: error?.stack,
            },
          });
        }

        return throwError(() => error);
      }),
    );
  }
}

