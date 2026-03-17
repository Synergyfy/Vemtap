import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error: typeof message === 'string' ? message : (message as any).error || (message as any).message || message,
      message: (message as any).message || (typeof message === 'string' ? message : 'Internal server error'),
    };

    // Log the error for tracking
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} ${status} - ${JSON.stringify(errorResponse)}`,
        exception instanceof Error ? exception.stack : '',
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} ${status} - ${errorResponse.message}`,
      );
    }

    response.status(status).json(errorResponse);
  }
}
