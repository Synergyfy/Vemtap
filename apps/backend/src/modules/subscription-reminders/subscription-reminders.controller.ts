import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { SubscriptionRemindersService } from './subscription-reminders.service';
import {
  CreateReminderTemplateDto,
  UpdateReminderTemplateDto,
  PreviewReminderTemplateDto,
} from './dto/subscription-reminder-template.dto';

@ApiTags('Subscription Reminders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subscription-reminders')
export class SubscriptionRemindersController {
  constructor(
    private readonly remindersService: SubscriptionRemindersService,
  ) {}

  @Get('admin/placeholders')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Admin: List all available template variables/placeholders',
  })
  async getPlaceholders() {
    return this.remindersService.getPlaceholders();
  }

  @Get('admin/templates')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Admin: List all customizable subscription reminder templates',
  })
  async getTemplates() {
    return this.remindersService.getTemplates();
  }

  @Get('admin/templates/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: Get a reminder template by ID' })
  async getTemplateById(@Param('id', ParseUUIDPipe) id: string) {
    return this.remindersService.getTemplateById(id);
  }

  @Post('admin/templates')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: Create a custom reminder template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  async createTemplate(@Body() dto: CreateReminderTemplateDto) {
    return this.remindersService.createTemplate(dto);
  }

  @Patch('admin/templates/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary:
      'Admin: Update reminder template (copy, status, channels, action URL)',
  })
  async updateTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReminderTemplateDto,
  ) {
    return this.remindersService.updateTemplate(id, dto);
  }

  @Post('admin/templates/:id/reset')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Admin: Reset a reminder template to system default copy',
  })
  async resetTemplate(@Param('id', ParseUUIDPipe) id: string) {
    return this.remindersService.resetTemplate(id);
  }

  @Post('admin/templates/preview')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Admin: Preview template rendering with test/sample data',
  })
  async previewTemplate(@Body() dto: PreviewReminderTemplateDto) {
    return this.remindersService.previewTemplate(dto);
  }

  @Post('admin/run-now')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Admin: Manually trigger the subscription reminder cycle on-demand',
  })
  async runRemindersNow() {
    const result = await this.remindersService.runRenewalReminders();
    return {
      message: 'Subscription renewal reminders processed successfully',
      result,
    };
  }
}
