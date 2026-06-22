import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum } from 'class-validator';
import { SaleStatus } from '../entities/pos-enums';

export class UpdatePosSaleStatusDto {
  @ApiProperty({ enum: SaleStatus, example: SaleStatus.REFUNDED })
  @IsNotEmpty()
  @IsEnum(SaleStatus)
  status: SaleStatus;
}
