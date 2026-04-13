import { IsString, IsNotEmpty, IsOptional, IsArray, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export interface ChatButton {
  label: string;
  action: 'navigate' | 'url' | 'action';
  value: string;
}

export class BotQueryDto {
  @ApiProperty({ example: 'How do I top up credits?' })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiPropertyOptional({ example: 'General Dashboard' })
  @IsString()
  @IsOptional()
  context?: string;

  @ApiPropertyOptional({ example: 'session_123456' })
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  guestName?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsString()
  @IsOptional()
  guestEmail?: string;

  @ApiPropertyOptional({ example: [] })
  @IsArray()
  @IsOptional()
  history?: { role: string; content: string }[];
}

export class BotResponseDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  content: string;

  @ApiProperty({ enum: ['knowledge_base', 'ai', 'fallback'] })
  @IsString()
  source: string;

  @ApiProperty()
  @IsNumber()
  confidence: number;

  @ApiPropertyOptional({ type: [Object] })
  @IsOptional()
  @IsArray()
  buttons?: ChatButton[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  followUp?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  conversationPath?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  suggestedAction?: string;
}

export class CreateKnowledgeDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsString()
  @IsNotEmpty()
  answer: string;

  @IsArray()
  @IsOptional()
  keywords?: string[];

  @IsString()
  @IsOptional()
  category?: string;

  @IsOptional()
  @IsArray()
  buttons?: ChatButton[];
}

export class InteractionFeedbackDto {
  @ApiProperty()
  @IsBoolean()
  wasHelpful: boolean;
}

export class ConversationContextDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currentPath?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  businessType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerVolume?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  challenge?: string;
}
