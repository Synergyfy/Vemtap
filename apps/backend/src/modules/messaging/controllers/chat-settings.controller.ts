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
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatSettingsService } from '../services/chat-settings.service';
import { MessagingHelperService } from '../services/messaging-helper.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { User, UserRole } from '../../users/entities/user.entity';
import { MessagingEngineService } from '../services/messaging-engine.service';
import { 
  UpdateChatAutomationDto, 
  AddFaqKeywordDto, 
  UpdateFaqKeywordDto 
} from '../dto/chat-automation.dto';
import { 
  CreateChatCategoryDto, 
  UpdateChatCategoryDto 
} from '../dto/chat-category.dto';

@ApiTags('Chat Settings')
@Controller('messaging/chat/settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN)
export class ChatSettingsController {
  constructor(
    private readonly chatSettingsService: ChatSettingsService,
    private readonly messagingHelperService: MessagingHelperService,
  ) {}

  private async getBranchId(req: { user: User }, branchId?: string): Promise<string> {
    return this.messagingHelperService.resolveBranchId(req.user, branchId);
  }

  @Get('automation')
  @ApiOperation({ summary: 'Get automated reply settings' })
  async getAutomation(@Request() req: { user: User }, @Query('branchId') branchId?: string) {
    const effectiveBranchId = await this.getBranchId(req, branchId);
    return this.chatSettingsService.getAutomatedReplies(effectiveBranchId);
  }

  @Patch('automation')
  @ApiOperation({ summary: 'Update automated reply settings' })
  async updateAutomation(
    @Request() req: { user: User }, 
    @Body() dto: UpdateChatAutomationDto,
    @Query('branchId') branchId?: string
  ) {
    const effectiveBranchId = await this.getBranchId(req, branchId || dto.branchId);
    return this.chatSettingsService.updateAutomatedReplies(effectiveBranchId, dto);
  }

  @Post('automation/faq')
  @ApiOperation({ summary: 'Add a new FAQ keyword trigger' })
  async addFaq(
    @Request() req: { user: User }, 
    @Body() dto: AddFaqKeywordDto,
    @Query('branchId') branchId?: string
  ) {
    const effectiveBranchId = await this.getBranchId(req, branchId || dto.branchId);
    return this.chatSettingsService.addFaqKeyword(effectiveBranchId, dto);
  }

  @Patch('automation/faq/:id')
  @ApiOperation({ summary: 'Update an FAQ keyword trigger' })
  async updateFaq(
    @Param('id') id: string,
    @Request() req: { user: User },
    @Body() dto: UpdateFaqKeywordDto,
    @Query('branchId') branchId?: string
  ) {
    const effectiveBranchId = await this.getBranchId(req, branchId);
    return this.chatSettingsService.updateFaqKeyword(id, effectiveBranchId, dto);
  }

  @Delete('automation/faq/:id')
  @ApiOperation({ summary: 'Delete an FAQ keyword trigger' })
  async deleteFaq(
    @Param('id') id: string, 
    @Request() req: { user: User },
    @Query('branchId') branchId?: string
  ) {
    const effectiveBranchId = await this.getBranchId(req, branchId);
    return this.chatSettingsService.deleteFaqKeyword(id, effectiveBranchId);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get chat/ticket categories' })
  async getCategories(@Request() req: { user: User }, @Query('branchId') branchId?: string) {
    const effectiveBranchId = await this.getBranchId(req, branchId);
    return this.chatSettingsService.getCategories(effectiveBranchId);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a new ticket category' })
  async createCategory(
    @Request() req: { user: User }, 
    @Body() dto: CreateChatCategoryDto,
    @Query('branchId') branchId?: string
  ) {
    const effectiveBranchId = await this.getBranchId(req, branchId || dto.branchId);
    return this.chatSettingsService.createCategory(effectiveBranchId, dto);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a ticket category' })
  async updateCategory(
    @Param('id') id: string,
    @Request() req: { user: User },
    @Body() dto: UpdateChatCategoryDto,
    @Query('branchId') branchId?: string
  ) {
    const effectiveBranchId = await this.getBranchId(req, branchId);
    return this.chatSettingsService.updateCategory(id, effectiveBranchId, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete a ticket category' })
  async deleteCategory(
    @Param('id') id: string, 
    @Request() req: { user: User },
    @Query('branchId') branchId?: string
  ) {
    const effectiveBranchId = await this.getBranchId(req, branchId);
    return this.chatSettingsService.deleteCategory(id, effectiveBranchId);
  }
}
