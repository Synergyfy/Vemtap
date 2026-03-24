import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RequestIdMiddleware } from './middlewares/request-id.middleware';
import { MetricsMiddleware } from './middlewares/metrics.middleware';
import { MetricsController } from './metrics.controller';

@Module({
  imports: [ConfigModule],
  controllers: [MetricsController],
  providers: [],
})
export class ObservabilityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply request ID and metrics middleware to all routes
    consumer.apply(RequestIdMiddleware, MetricsMiddleware).forRoutes('*');
  }
}
