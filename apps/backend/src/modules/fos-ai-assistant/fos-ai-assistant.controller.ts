import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FosAiAssistantService } from './fos-ai-assistant.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { FosEnvelope } from '../../common/decorators/fos-envelope.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ChatQueryDto } from './dto/chat-query.dto';

@ApiTags('FOS AI Assistant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@FosEnvelope()
@Controller('ai-assistant')
export class FosAiAssistantController {
  constructor(private readonly aiService: FosAiAssistantService) {}

  @Get('insights')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get AI insights and predefined questions' })
  async getInsights() {
    return this.aiService.getInsights();
  }

  @Post('chat')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Answer a financial question' })
  async chat(@Body(new ValidationPipe({ transform: true })) dto: ChatQueryDto) {
    return this.aiService.chat(dto.query);
  }
}
