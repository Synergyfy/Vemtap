import { IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class BranchFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by specific branch ID (UUID)',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )
  @IsUUID('4', { message: 'branchId must be a valid UUID v4' })
  branchId?: string;

  @ApiPropertyOptional({
    description:
      'Fetch data for all branches in the business (Owner/Admin only)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  allBranches?: boolean;
}
