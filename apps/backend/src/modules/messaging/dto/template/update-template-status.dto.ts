import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { TemplateStatus } from '../../entities/message-template.entity';

export class UpdateTemplateStatusDto {
  @ApiProperty({
    enum: TemplateStatus,
    example: TemplateStatus.APPROVED,
    description: 'New status for the messaging template',
  })
  @IsEnum(TemplateStatus)
  status: TemplateStatus;
}
