import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiCopilotService } from './ai-copilot.service';
import { AnalyzeRequestDto } from './dto/analyze-request.dto';
import { AIAnalysisResponse } from './dto/ai-analysis-response.dto';

@ApiTags('AI Copilot')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
@Controller('ai')
export class AiCopilotController {
  constructor(private readonly aiCopilotService: AiCopilotService) {}

  @Post('analyze')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Analyze a dashboard page using AI copilot' })
  async analyze(
    @Request() req: any,
    @Body() dto: AnalyzeRequestDto,
  ): Promise<AIAnalysisResponse> {
    const branchId =
      req.user?.branchId || req.user?.activeBranchId || req.user?.businessId;
    if (!branchId)
      throw new BadRequestException('Branch or Business ID is required');
    return this.aiCopilotService.analyze(dto.page, branchId, dto.context);
  }

  @Get('credits')
  @ApiOperation({ summary: 'Get available AI copilot credits' })
  async getCredits(@Request() req: any) {
    const branchId =
      req.user?.branchId || req.user?.activeBranchId || req.user?.businessId;
    if (!branchId)
      throw new BadRequestException('Branch or Business ID is required');
    return this.aiCopilotService.getCredits(branchId);
  }
}
