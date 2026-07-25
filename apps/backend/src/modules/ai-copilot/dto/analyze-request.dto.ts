import { IsString, IsOptional, IsObject, MaxLength, Matches } from 'class-validator';

export class AnalyzeRequestDto {
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/)
  page: string;

  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;
}
