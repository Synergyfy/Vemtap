import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class BranchFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by specific branch ID (UUID)',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  @IsOptional()
  @IsUUID('4', { message: 'branchId must be a valid UUID v4' })
  branchId?: string;
}
