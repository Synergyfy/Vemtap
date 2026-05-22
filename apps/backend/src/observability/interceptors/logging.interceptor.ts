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

    // Extract rich request details for live dashboard
    const requestBody = request.body;
    const queryParams = request.query;
    const requestHeaders = request.headers;
    const ip = request.ip || request.headers['x-forwarded-for'] || request.socket.remoteAddress;
    const userAgent = request.headers['user-agent'];
    const userId = (request as any).user?.id;
    const userEmail = (request as any).user?.email;

    // Base log object
    const logBase = {
      requestId,
      method,
      route,
      traceId,
    };

    return next.handle().pipe(
      tap((data) => {
        const statusCode = response.statusCode;
        const responseTime = Date.now() - now;
        const responseHeaders = response.getHeaders ? response.getHeaders() : {};

        // Structured success log
        logger.info({
          ...logBase,
          statusCode,
          responseTime,
          msg: `HTTP ${method} ${url}`,
        });

        // Push to Observability Store Service
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
            requestBody,
            responseHeaders,
            responseBody: data,
          });
        }
      }),
      catchError((error: any) => {
        const statusCode = (error?.status as number) || (error?.statusCode as number) || 500;
        const responseTime = Date.now() - now;
        const responseHeaders = response.getHeaders ? response.getHeaders() : {};

        // Structured error log
        logger.error({
          ...logBase,
          statusCode,
          responseTime,
          error: error?.message || 'Internal Server Error',
          stack: error?.stack,
          msg: `HTTP ${method} ${url} Error`,
        });

        // Push error log to Observability Store Service
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
            requestBody,
            responseHeaders,
            responseBody: undefined,
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

