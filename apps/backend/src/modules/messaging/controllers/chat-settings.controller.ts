import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatSettingsService } from '../services/chat-settings.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { User } from '../../users/entities/user.entity';

@ApiTags('Chat Settings')
@Controller('messaging/chat/settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ChatSettingsController {
  constructor(private readonly chatSettingsService: ChatSettingsService) {}

  @Get('automation')
  @ApiOperation({ summary: 'Get automated reply settings' })
  async getAutomation(@Request() req: { user: User }) {
    return this.chatSettingsService.getAutomatedReplies(req.user.branchId);
  }

  @Patch('automation')
  @ApiOperation({ summary: 'Update automated reply settings' })
  async updateAutomation(@Request() req: { user: User }, @Body() dto: any) {
    return this.chatSettingsService.updateAutomatedReplies(req.user.branchId, dto);
  }

  @Post('automation/faq')
  @ApiOperation({ summary: 'Add a new FAQ keyword trigger' })
  async addFaq(@Request() req: { user: User }, @Body() dto: any) {
    return this.chatSettingsService.addFaqKeyword(req.user.branchId, dto);
  }

  @Patch('automation/faq/:id')
  @ApiOperation({ summary: 'Update an FAQ keyword trigger' })
  async updateFaq(
    @Param('id') id: string,
    @Request() req: { user: User },
    @Body() dto: any,
  ) {
    return this.chatSettingsService.updateFaqKeyword(id, req.user.branchId, dto);
  }

  @Delete('automation/faq/:id')
  @ApiOperation({ summary: 'Delete an FAQ keyword trigger' })
  async deleteFaq(@Param('id') id: string, @Request() req: { user: User }) {
    return this.chatSettingsService.deleteFaqKeyword(id, req.user.branchId);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get chat/ticket categories' })
  async getCategories(@Request() req: { user: User }) {
    return this.chatSettingsService.getCategories(req.user.branchId);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a new ticket category' })
  async createCategory(@Request() req: { user: User }, @Body() dto: any) {
    return this.chatSettingsService.createCategory(req.user.branchId, dto);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a ticket category' })
  async updateCategory(
    @Param('id') id: string,
    @Request() req: { user: User },
    @Body() dto: any,
  ) {
    return this.chatSettingsService.updateCategory(id, req.user.branchId, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete a ticket category' })
  async deleteCategory(@Param('id') id: string, @Request() req: { user: User }) {
    return this.chatSettingsService.deleteCategory(id, req.user.branchId);
  }
}
