import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class InvitePartnershipDto {
  @ApiProperty({
    example: 'd9b2d63d-4c3e-4f30-8025-06be521b191a',
    description: 'The ID of the branch initiating the partnership',
  })
  @IsNotEmpty()
  @IsUUID()
  initiatorBranchId: string;

  @ApiProperty({
    example: 'e8c3e63d-4c3e-4f30-8025-06be521b191b',
    description: 'The ID of the target branch to partner with',
  })
  @IsNotEmpty()
  @IsUUID()
  recipientBranchId: string;
}
