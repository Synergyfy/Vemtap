import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  UseGuards,
  Request,
  Body,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PushNotificationService } from './push-notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { NotificationResponseDto } from './dto/notification-response.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  @Post('push-token')
  @ApiOperation({ summary: 'Register a push token for the current user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string', example: 'fcm-token-abc-123' },
      },
      required: ['token'],
    },
  })
  @ApiResponse({ status: 201, description: 'Token registered successfully' })
  async registerPushToken(@Body('token') token: string, @Request() req) {
    return this.pushNotificationService.registerToken(req.user.id, token, true);
  }

  @Post('visitor/push-token')
  @ApiOperation({ summary: 'Register a push token for the current visitor' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string', example: 'fcm-token-abc-123' },
      },
      required: ['token'],
    },
  })
  @ApiResponse({ status: 201, description: 'Token registered successfully' })
  async registerVisitorPushToken(@Body('token') token: string, @Request() req) {
    return this.pushNotificationService.registerToken(
      req.user.id,
      token,
      false,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all notifications for current user' })
  @ApiResponse({
    status: 200,
    description: 'List of notifications',
    type: [NotificationResponseDto],
  })
  findAll(@Request() req) {
    return this.notificationsService.findByUser(req.user.id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get count of unread notifications' })
  @ApiResponse({
    status: 200,
    description: 'Count of unread notifications',
    schema: { example: 5 },
  })
  getUnreadCount(@Request() req) {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  @Post('mark-all-read')
  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read for current user' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a specific notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Post('broadcast')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Broadcast a notification to all agents (affiliates)',
  })
  async broadcast(@Body() data: { title: string; message: string }) {
    return this.notificationsService.broadcastToRole(
      UserRole.AGENT,
      data.title,
      data.message,
    );
  }

  @Get('admin/history/broadcasts')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get broadcast history for admins' })
  async getHistory() {
    return this.notificationsService.getBroadcastHistory();
  }
}
