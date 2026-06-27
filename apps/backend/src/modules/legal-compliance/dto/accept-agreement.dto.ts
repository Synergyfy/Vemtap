import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AcceptAgreementDto {
  @ApiProperty({ required: false, description: 'Optional signature hash' })
  @IsOptional()
  @IsString()
  signatureHash?: string;
}
