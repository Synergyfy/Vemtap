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
    if (optionalParams && optionalParams.length > 0) {
      const context = optionalParams[optionalParams.length - 1];
      const params = optionalParams.slice(0, -1);

      // If the first parameter is an object, merge it for structured logging
      if (typeof message === 'object') {
        return {
          ...message,
          context,
          params: params.length > 0 ? params : undefined,
        };
      }

      return {
        msg: message,
        context,
        params: params.length > 0 ? params : undefined,
      };
    }

    if (typeof message === 'object') {
      return message;
    }

    return { msg: message };
  }
}
