import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { MessagingAutomationsService } from './messaging-automations.service';
import { UpdateChatSettingsDto } from './dto/chat-settings.dto';
import { CreateFaqTriggerDto, UpdateFaqTriggerDto } from './dto/faq-trigger.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Messaging Chat Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messaging/chat/settings/automation')
export class MessagingChatSettingsController {
  constructor(private readonly service: MessagingAutomationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get chat automation settings for a branch' })
  getSettings(@Query('branchId') branchId: string) {
    return this.service.getChatSettings(branchId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update chat automation settings for a branch' })
  updateSettings(@Query('branchId') branchId: string, @Body() dto: UpdateChatSettingsDto) {
    return this.service.updateChatSettings(branchId, dto);
  }

  @Post('faq')
  @ApiOperation({ summary: 'Add a new FAQ trigger' })
  createFaq(@Query('branchId') branchId: string, @Body() dto: CreateFaqTriggerDto) {
    return this.service.createFaq(branchId, dto);
  }

  @Patch('faq/:id')
  @ApiOperation({ summary: 'Update an FAQ trigger' })
  updateFaq(
    @Param('id') id: string,
    @Query('branchId') branchId: string,
    @Body() dto: UpdateFaqTriggerDto,
  ) {
    return this.service.updateFaq(id, branchId, dto);
  }

  @Delete('faq/:id')
  @ApiOperation({ summary: 'Delete an FAQ trigger' })
  removeFaq(@Param('id') id: string, @Query('branchId') branchId: string) {
    return this.service.deleteFaq(id, branchId);
  }
}
