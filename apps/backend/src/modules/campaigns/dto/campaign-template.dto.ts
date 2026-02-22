import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCampaignTemplateDto {
  @ApiProperty({ example: 'Welcome Message' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Onboarding' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'Any' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 'Hello {name}...' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: 'blue', required: false })
  @IsOptional()
  @IsString()
  textColor?: string;

  @ApiProperty({ example: 'branch-uuid', description: 'Branch ID for branch-specific template (null for global)', required: false })
  @IsOptional()
  @IsString()
  branchId?: string | null;
}
