import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class GenerateAIContentDto {
  @ApiProperty({ example: 'uuid', description: 'Selected MarketingAIPrompt id' })
  @IsUUID()
  @IsNotEmpty()
  promptId: string;

  @ApiProperty({ example: 'Restaurant', required: false })
  @IsString()
  @IsOptional()
  businessType?: string;

  @ApiProperty({ example: 'Salty Crab Cafe', required: false })
  @IsString()
  @IsOptional()
  businessName?: string;

  @ApiProperty({ example: 'French Fries', required: false })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty({ example: 'Playful', required: false, description: 'Tone of voice (e.g. Playful, Professional, Energetic)' })
  @IsString()
  @IsOptional()
  tone?: string;
}
