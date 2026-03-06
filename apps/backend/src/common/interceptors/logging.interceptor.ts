import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, body, query } = request;
    const now = Date.now();

    this.logger.log(`Incoming Request: ${method} ${url}`);

    if (query && Object.keys(query).length > 0) {
      this.logger.debug(`Query Params: ${JSON.stringify(query, null, 2)}`);
    }

    if (body && Object.keys(body as Record<string, any>).length > 0) {
      this.logger.debug(`Request Body: ${JSON.stringify(body, null, 2)}`);
    }

    return next.handle().pipe(
      tap((responseBody: unknown) => {
        const response = context.switchToHttp().getResponse<Response>();
        const statusCode = response.statusCode;
        const duration = Date.now() - now;

        this.logger.log(
          `Response: ${method} ${url} - Status: ${statusCode} - Duration: ${duration}ms`,
        );

        // Truncate response body if it's too large for logs
        const responseString = JSON.stringify(responseBody);
        const loggableResponse =
          responseString.length > 500
            ? `${responseString.substring(0, 500)}... [TRUNCATED]`
            : responseString;

        this.logger.debug(`Response Body: ${loggableResponse}`);
      }),
      catchError((error: any) => {
        const duration = Date.now() - now;
        const statusCode = (error?.status as number) || 500;

        this.logger.error(
          `Error: ${method} ${url} - Status: ${statusCode} - Duration: ${duration}ms - Message: ${error?.message as string}`,
          error?.stack as string,
        );

        return throwError(() => error as Error);
      }),
    );
  }
}
