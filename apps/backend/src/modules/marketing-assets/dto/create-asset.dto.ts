import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsObject,
  IsUUID,
} from 'class-validator';

export class CreateAssetDto {
  @ApiProperty({ example: 'Summer BBQ Table Tent' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'uuid', required: false })
  @IsUUID()
  @IsOptional()
  templateId?: string;

  @ApiProperty({ example: 'uuid', required: false })
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @ApiProperty({ example: 'table_tent' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    description:
      'Asset specific customized variables, text configurations and style overrides',
  })
  @IsObject()
  @IsNotEmpty()
  customConfig: any;

  @ApiProperty({ example: 'https://vemtap.com/r/table-4' })
  @IsString()
  @IsNotEmpty()
  qrCodeContent: string;

  @ApiProperty({
    description: 'QR Code display styles custom to this asset',
    required: false,
  })
  @IsObject()
  @IsOptional()
  qrCodeConfig?: any;

  @ApiProperty({
    example: 'https://cdn.vemtap.com/assets/my-table-tent.png',
    required: false,
  })
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;
}
