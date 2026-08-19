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

    let status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: any =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Handle database driver errors (e.g. TypeORM QueryFailedError)
    if (!(exception instanceof HttpException)) {
      const isQueryFailed =
        (exception as any)?.name === 'QueryFailedError' ||
        (exception as any)?.constructor?.name === 'QueryFailedError';

      if (isQueryFailed) {
        const driverError = (exception as any)?.driverError || (exception as any);
        const code = driverError?.code;

        if (code === '22P02') {
          // Invalid text representation (e.g. invalid UUID syntax or integer format)
          status = HttpStatus.BAD_REQUEST;
          message = {
            statusCode: HttpStatus.BAD_REQUEST,
            error: 'Bad Request',
            message: 'Invalid format or data type for identifier or parameter',
          };
        } else if (code === '23505') {
          // Unique violation
          status = HttpStatus.CONFLICT;
          message = {
            statusCode: HttpStatus.CONFLICT,
            error: 'Conflict',
            message: driverError?.detail || 'A record with this identifier or unique value already exists',
          };
        } else if (code === '23503') {
          // Foreign key violation
          status = HttpStatus.BAD_REQUEST;
          message = {
            statusCode: HttpStatus.BAD_REQUEST,
            error: 'Bad Request',
            message: driverError?.detail || 'Referenced record does not exist or cannot be deleted',
          };
        } else if (code === '22001') {
          // String data right truncation (value too long)
          status = HttpStatus.BAD_REQUEST;
          message = {
            statusCode: HttpStatus.BAD_REQUEST,
            error: 'Bad Request',
            message: 'Value provided is too long for the field length',
          };
        }
      }
    }

    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error:
        typeof message === 'string'
          ? message
          : (message as any).error || (message as any).message || message,
      message:
        (message as any).message ||
        (typeof message === 'string' ? message : 'Internal server error'),
    };

    // Log the error for tracking
    if (status >= 500) {
      const stack =
        exception instanceof Error
          ? exception.stack
          : (exception as any)?.stack ||
            JSON.stringify(exception) ||
            'No stack trace';
      this.logger.error(
        `${request.method} ${request.url} ${status} - ${JSON.stringify(errorResponse)}`,
        stack,
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} ${status} - ${errorResponse.message}`,
      );
    }

    response.status(status).json(errorResponse);
  }
}
