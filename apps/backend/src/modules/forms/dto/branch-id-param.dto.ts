import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class BranchIdParamDto {
  @ApiProperty({
    description: 'The branch ID (UUID)',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  @IsUUID('4', { message: 'branchId must be a valid UUID v4' })
  branchId: string;
}
