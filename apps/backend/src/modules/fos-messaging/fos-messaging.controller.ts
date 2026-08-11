import {
  Controller,
  Get,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FosMessagingService } from './fos-messaging.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { FosEnvelope } from '../../common/decorators/fos-envelope.decorator';
import { UserRole } from '../users/entities/user.entity';
import { MessagingLogsQueryDto } from './dto/messaging-logs-query.dto';

@ApiTags('FOS Messaging')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@FosEnvelope()
@Controller('messaging')
export class FosMessagingController {
  constructor(private readonly messagingService: FosMessagingService) {}

  @Get('sms')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'SMS usage logs per business per day' })
  async getSmsLogs(
    @Query(new ValidationPipe({ transform: true }))
    query: MessagingLogsQueryDto,
  ): Promise<any> {
    return this.messagingService.getSmsLogs(query);
  }

  @Get('email')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Email usage logs per business per day' })
  async getEmailLogs(
    @Query(new ValidationPipe({ transform: true }))
    query: MessagingLogsQueryDto,
  ): Promise<any> {
    return this.messagingService.getEmailLogs(query);
  }

  @Get('aggregates')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Messaging aggregates (SMS + Email)' })
  async getAggregates() {
    return this.messagingService.getAggregates();
  }
}
