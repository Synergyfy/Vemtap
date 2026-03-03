import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class AdminCreateDeviceDto {
    @ApiProperty({
        example: 'Front Entrance Tag',
        description: 'Friendly name for the device',
    })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({
        example: 'LT-8829-X',
        description: 'Unique serial number/code on the physical tag',
    })
    @IsString()
    @IsNotEmpty()
    code: string;

    @ApiProperty({
        example: 'Card',
        description: 'Form factor of the device',
    })
    @IsString()
    @IsOptional()
    type?: string;

    @ApiPropertyOptional({
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Business ID (Optional) to assign the device to',
    })
    @IsUUID()
    @IsOptional()
    businessId?: string;

    @ApiPropertyOptional({
        example: 'Main Lobby',
        description: 'Physical location of the device',
    })
    @IsString()
    @IsOptional()
    location?: string;
}
