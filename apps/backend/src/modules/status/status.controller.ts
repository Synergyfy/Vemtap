import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StatusService } from './status.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Status')
@Controller('status')
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Public status page payload',
    description:
      'Returns system component statuses, recent incidents, and the 90-day uptime average in the shape consumed by the /status page.',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        overall: 'operational',
        systems: [
          {
            name: 'NFC Response API',
            status: 'Operational',
            uptime: '99.99%',
            load: '12ms',
          },
        ],
        incidents: [],
        uptime90d: '99.98%',
        lastUpdated: '2026-08-04T10:00:00.000Z',
      },
    },
  })
  async getStatus() {
    return this.statusService.getPublicStatus();
  }
}
