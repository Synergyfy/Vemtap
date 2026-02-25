import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeviceTapDto {
    @ApiProperty({
        example: 'COFFEE-SHOP-01',
        description: 'The unique code of the device (QR Plaque/Pylon)',
    })
    @IsString()
    @IsNotEmpty()
    deviceCode: string;
}
