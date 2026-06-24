import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { PartnershipStatus } from '../entities/partnership.entity';

export class RespondPartnershipDto {
  @ApiProperty({
    enum: [PartnershipStatus.ACCEPTED, PartnershipStatus.DECLINED],
    example: PartnershipStatus.ACCEPTED,
    description: 'The response status for the partnership invitation',
  })
  @IsNotEmpty()
  @IsEnum([PartnershipStatus.ACCEPTED, PartnershipStatus.DECLINED], {
    message: 'Status must be Accepted or Declined',
  })
  status: PartnershipStatus.ACCEPTED | PartnershipStatus.DECLINED;
}
