import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class VisitorSignupQueryDto {
  @ApiProperty({
    description: 'The UUID of the branch the visitor is signing up for',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'branchId must be a valid UUID' })
  @IsNotEmpty({ message: 'branchId is required for signup' })
  branchId: string;
}
