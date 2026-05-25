import { initializeTracing } from './observability/tracing';
initializeTracing();

import { NestFactory, Reflector } from '@nestjs/core';
import {
  Logger,
  ValidationPipe,
  ClassSerializerInterceptor,
  INestApplication,
} from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';

import { ObservabilityLoggingInterceptor } from './observability/interceptors/logging.interceptor';
import { ObservabilityStoreService } from './observability/observability-store.service';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

// 1. Shared Configuration Function
// This setup applies to both Local and Vercel environments
export function configureApp(app: INestApplication) {
  // Security
  app.use(helmet());

  // Compression
  app.use(compression());

  // CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Filters & Interceptors
  app.useGlobalFilters(new AllExceptionsFilter());

  // Serialization & Global Logging
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new ObservabilityLoggingInterceptor(app.get(ObservabilityStoreService)),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Vemtap API')
    .setDescription('The Vemtap Backend API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    customfavIcon:
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/favicon-16x16.png',
    customCssUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.min.js',
    ],
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}

import { PinoLoggerService } from './observability/logger.config';

// 2. Local Development Bootstrap
// This only runs if you execute the file directly (e.g., `nest start` or `node dist/main`)
if (require.main === module) {
  const bootstrap = async () => {
    const logger = new Logger('Bootstrap');
    const app = await NestFactory.create(AppModule, {
      logger: new PinoLoggerService(),
    });

    configureApp(app);

    // -------------------------------------------------------------------
    // Graceful shutdown
    // -------------------------------------------------------------------
    // Tells NestJS to listen for OS shutdown signals (SIGTERM, SIGINT).
    // When received it calls `onModuleDestroy()` on every provider before
    // the process exits, allowing DB connections, queues, etc. to close cleanly.
    app.enableShutdownHooks();

    const server = await app.listen(process.env.PORT || 3002);

    // Keep-alive timeout must be > any upstream load balancer idle timeout
    // (AWS ALB default is 60s) to prevent the LB closing a connection mid-request.
    server.keepAliveTimeout = 65_000;
    server.headersTimeout = 66_000; // must be > keepAliveTimeout

    // -------------------------------------------------------------------
    // SIGTERM drain window
    // -------------------------------------------------------------------
    // On SIGTERM (Docker stop / k8s rolling deploy / PM2 restart):
    //  1. Stop accepting new connections immediately.
    //  2. Give in-flight requests up to 10 seconds to complete.
    //  3. Then close the NestJS app (flushes queues, closes DB pool, etc.).
    process.on('SIGTERM', async () => {
      logger.log('[Shutdown] SIGTERM received — draining in-flight requests (10s window)...');
      server.close(async () => {
        logger.log('[Shutdown] HTTP server closed. Closing application...');
        await app.close();
        logger.log('[Shutdown] Application closed cleanly.');
        process.exit(0);
      });

      // Safety net: force-exit after 15 seconds if drain stalls
      setTimeout(() => {
        logger.warn('[Shutdown] Drain timeout exceeded — force exiting.');
        process.exit(1);
      }, 15_000).unref();
    });

    logger.log(`Application is running on: http://localhost:${process.env.PORT || 3002}/api/v1`);
    logger.log(`Swagger documentation: http://localhost:${process.env.PORT || 3002}/api-docs`);
  };
  void bootstrap();
}

// 3. Vercel Serverless Handler
// Vercel imports this file and calls the default export
let cachedApp: any;

export default async (req: unknown, res: unknown) => {
  if (!cachedApp) {
    const app = await NestFactory.create(AppModule, {
      logger: new PinoLoggerService(),
    });
    configureApp(app);
    await app.init();
    cachedApp = app.getHttpAdapter().getInstance() as unknown;
  }
  return (cachedApp as (req: unknown, res: unknown) => Promise<unknown>)(
    req,
    res,
  );
};
