import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            singleLine: true,
            translateTime: 'SYS:standard',
          },
        },
      }),
});

export class PinoLoggerService {
  log(message: any, ...optionalParams: any[]) {
    logger.info(this.formatMessage(message, optionalParams));
  }

  error(message: any, ...optionalParams: any[]) {
    logger.error(this.formatMessage(message, optionalParams));
  }

  warn(message: any, ...optionalParams: any[]) {
    logger.warn(this.formatMessage(message, optionalParams));
  }

  debug(message: any, ...optionalParams: any[]) {
    logger.debug(this.formatMessage(message, optionalParams));
  }

  verbose(message: any, ...optionalParams: any[]) {
    logger.trace(this.formatMessage(message, optionalParams));
  }

  private formatMessage(message: any, optionalParams: any[]) {
    let context = 'Global';
    let params: any[] = [];

    if (optionalParams && optionalParams.length > 0) {
      // In NestJS, the last param is often the context string
      context = optionalParams[optionalParams.length - 1];
      params = optionalParams.slice(0, -1);
    }

    // Sanitize params to avoid [null] in logs
    const sanitizedParams = params.map((p) =>
      p === null ? 'null' : p === undefined ? 'undefined' : p,
    );

    const baseLog: any = {
      context,
      params: sanitizedParams.length > 0 ? sanitizedParams : undefined,
    };

    // Handle null/undefined message
    if (message === null || message === undefined) {
      return {
        ...baseLog,
        msg: String(message),
      };
    }

    // If the message is an Error, extract its enumerable properties and common Error fields
    if (message instanceof Error) {
      return {
        ...baseLog,
        msg: message.message,
        stack: message.stack,
        ...message, // Merge other enumerable properties
      };
    }

    // If the message is an object (but NOT null), merge it
    if (typeof message === 'object') {
      return {
        ...message,
        ...baseLog,
      };
    }

    return {
      ...baseLog,
      msg: message,
    };
  }
}
