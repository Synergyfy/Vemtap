import { IsString, IsOptional, IsEnum, MinLength, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChatCategoryDto {
  @ApiProperty()
  @IsString()
  @MinLength(1, { message: 'Category name is required' })
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  routeTo?: string;

  @ApiProperty({ enum: ['Low', 'Medium', 'High'], default: 'Medium' })
  @IsEnum(['Low', 'Medium', 'High'])
  @IsOptional()
  urgency?: 'Low' | 'Medium' | 'High';

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  icon?: string;

  @IsUUID()
  @IsOptional()
  branchId?: string;
}


export class UpdateChatCategoryDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MinLength(1, { message: 'Category name cannot be empty' })
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  routeTo?: string;

  @ApiProperty({ enum: ['Low', 'Medium', 'High'], required: false })
  @IsEnum(['Low', 'Medium', 'High'])
  @IsOptional()
  urgency?: 'Low' | 'Medium' | 'High';

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  icon?: string;
}
