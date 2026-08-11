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
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';

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

  @Post('broadcast')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
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
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get broadcast history for admins' })
  async getHistory() {
    return this.notificationsService.getBroadcastHistory();
  }
}
