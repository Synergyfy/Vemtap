import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  UseGuards,
  Request,
  Body,
  Query,
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
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import {
  AdminBroadcastDto,
  BroadcastQueryDto,
} from './dto/admin-broadcast.dto';
import { TargetAudience } from './entities/notification-broadcast.entity';

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
  async registerPushToken(@Body() dto: RegisterPushTokenDto, @Request() req) {
    return this.pushNotificationService.registerToken(
      req.user.id,
      dto.token,
      true,
    );
  }

  @Post('device-token')
  @ApiOperation({
    summary: 'Register a device/FCM push token for the current user',
  })
  @ApiBody({ type: RegisterPushTokenDto })
  @ApiResponse({
    status: 201,
    description: 'Device token registered successfully',
  })
  async registerDeviceToken(@Body() dto: RegisterPushTokenDto, @Request() req) {
    return this.pushNotificationService.registerToken(
      req.user.id,
      dto.token,
      true,
    );
  }

  @Delete('push-token')
  @ApiOperation({ summary: 'Clear the push token for the current user' })
  @ApiResponse({ status: 200, description: 'Push token cleared successfully' })
  async clearPushToken(@Request() req) {
    return this.pushNotificationService.clearToken(req.user.id, true);
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
  async registerVisitorPushToken(
    @Body() dto: RegisterPushTokenDto,
    @Request() req,
  ) {
    return this.pushNotificationService.registerToken(
      req.user.id,
      dto.token,
      false,
    );
  }

  @Get('preferences')
  @Roles(
    UserRole.ADMIN,
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.STAFF,
    UserRole.AGENT,
    UserRole.CUSTOMER,
  )
  @ApiOperation({
    summary: 'Get notification preferences for the current user',
  })
  async getPreferences(@Request() req) {
    return this.notificationsService.getPreferences(req.user.id);
  }

  @Patch('preferences')
  @Roles(
    UserRole.ADMIN,
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.STAFF,
    UserRole.AGENT,
    UserRole.CUSTOMER,
  )
  @ApiOperation({
    summary: 'Update notification preferences for the current user',
  })
  async updatePreferences(
    @Request() req,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.notificationsService.updatePreferences(
      req.user.id,
      dto as Record<string, boolean>,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all notifications for current user' })
  @ApiResponse({
    status: 200,
    description: 'List of notifications',
    type: [NotificationResponseDto],
  })
  async findAll(@Request() req) {
    const items = await this.notificationsService.findByUser(req.user.id);
    return items.map((n) => ({ ...n, read: n.isRead }));
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
  async markAllAsRead(@Request() req) {
    await this.notificationsService.markAllAsRead(req.user.id);
    return { success: true };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read for current user' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsReadAlias(@Request() req) {
    await this.notificationsService.markAllAsRead(req.user.id);
    return { success: true };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a specific notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead(@Param('id') id: string) {
    const notification = await this.notificationsService.markAsRead(id);
    return { ...notification, read: notification.isRead };
  }

  @Post('admin/broadcast')
  @Post('broadcast')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Admin: Push custom notification to ALL, BUSINESSES, or CUSTOMERS',
    description:
      'Creates in-app notifications and queues web push notifications for targeted users. Persists to broadcast history.',
  })
  @ApiResponse({
    status: 201,
    description: 'Broadcast dispatched successfully',
  })
  async broadcast(@Body() data: AdminBroadcastDto, @Request() req) {
    const targetAudience = data.targetAudience || TargetAudience.ALL;
    return this.notificationsService.sendAdminBroadcast(req.user?.id, {
      ...data,
      targetAudience,
    });
  }

  @Get('admin/broadcasts')
  @Get('admin/history/broadcasts')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: Get paginated broadcast history' })
  async getBroadcastHistory(@Query() query: BroadcastQueryDto) {
    return this.notificationsService.getBroadcastHistory(query);
  }

  @Get('admin/broadcasts/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: Get broadcast details by ID' })
  async getBroadcastById(@Param('id') id: string) {
    return this.notificationsService.getBroadcastById(id);
  }
}
