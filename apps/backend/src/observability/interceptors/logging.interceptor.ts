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

@Injectable()
export class ObservabilityLoggingInterceptor implements NestInterceptor {
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

    // Base log object
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

        // Structured success log
        logger.info({
          ...logBase,
          statusCode,
          responseTime,
          msg: `HTTP ${method} ${url}`,
        });
      }),
      catchError((error: any) => {
        const statusCode = (error?.status as number) || 500;
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

        return throwError(() => error);
      }),
    );
  }
}
