import { Controller, Get, Sse, MessageEvent, Delete, Query, UseGuards } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ObservabilityStoreService } from './observability-store.service';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../modules/users/entities/user.entity';

@Controller('observability')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ObservabilityController {
  constructor(private readonly storeService: ObservabilityStoreService) {}

  @Get('logs')
  getLogs(
    @Query('search') search?: string,
    @Query('method') method?: string,
    @Query('statusClass') statusClass?: string,
    @Query('minLatency') minLatency?: number,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.storeService.getLogs({
      search,
      method,
      statusClass,
      minLatency: minLatency ? Number(minLatency) : undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get('stats')
  getStats() {
    return this.storeService.getStats();
  }

  @Sse('stream')
  streamLogs(): Observable<MessageEvent> {
    return this.storeService.getLogStream().pipe(
      map((log) => ({
        data: JSON.stringify(log),
      })),
    );
  }

  @Delete('logs')
  clearLogs() {
    this.storeService.clearLogs();
    return { success: true, message: 'Logs cleared successfully' };
  }
}
