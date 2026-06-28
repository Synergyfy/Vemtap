import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AIPromptsService } from '../services/ai-prompts.service';
import { CreateAIPromptDto } from '../dto/create-ai-prompt.dto';
import { GenerateAIContentDto } from '../dto/generate-ai-content.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';
import { MarketingAIPrompt } from '../entities/marketing-ai-prompt.entity';

@ApiTags('Marketing AI Prompts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('marketing-ai-prompts')
export class AIPromptsController {
  constructor(private readonly aiPromptsService: AIPromptsService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new AI prompt template (Admin only)' })
  @ApiResponse({ status: 201, type: MarketingAIPrompt })
  @Roles(UserRole.ADMIN)
  create(@Body() createDto: CreateAIPromptDto) {
    return this.aiPromptsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get list of all active AI prompt templates' })
  @ApiResponse({ status: 200, type: [MarketingAIPrompt] })
  findAll() {
    return this.aiPromptsService.findAll(true);
  }

  @Post('generate')
  @ApiOperation({
    summary: 'Execute AI copywriting helper using template parameters',
  })
  @ApiResponse({ status: 200 })
  generate(@Body() dto: GenerateAIContentDto) {
    return this.aiPromptsService.generateContent(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single AI prompt details' })
  @ApiResponse({ status: 200, type: MarketingAIPrompt })
  findOne(@Param('id') id: string) {
    return this.aiPromptsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an AI prompt template (Admin only)' })
  @ApiResponse({ status: 200, type: MarketingAIPrompt })
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateAIPromptDto>,
  ) {
    return this.aiPromptsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an AI prompt template (Admin only)' })
  @ApiResponse({ status: 204 })
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.aiPromptsService.remove(id);
  }
}
