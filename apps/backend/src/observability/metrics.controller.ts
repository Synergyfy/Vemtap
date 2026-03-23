import { Controller, Get, Header } from '@nestjs/common';
import { registry } from './middlewares/metrics.middleware';

@Controller('metrics')
export class MetricsController {
  @Get()
  @Header('Content-Type', registry.contentType)
  async getMetrics() {
    return registry.metrics();
  }
}
