import { IsEmail, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AgentStatus } from './list-agents-query.dto';

export class CreateAgentDto {
  @ApiProperty({ description: "Agent's full name" })
  @IsString()
  name: string;

  @ApiProperty({ description: "Agent's email address" })
  @IsEmail()
  email: string;

  @ApiProperty({ description: "Agent's phone number" })
  @IsString()
  phone: string;

  @ApiPropertyOptional({
    description: 'Optional password (auto-generated if omitted)',
  })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({
    description: 'Agent status',
    enum: AgentStatus,
    default: 'ACTIVE',
  })
  @IsOptional()
  @IsEnum(AgentStatus)
  status?: AgentStatus;

  @ApiPropertyOptional({ description: 'Parent agent ID (null = Manager)' })
  @IsOptional()
  @IsUUID()
  managerId?: string;
}
