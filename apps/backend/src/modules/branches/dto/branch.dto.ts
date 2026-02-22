import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBranchDto {
    @ApiProperty({ example: 'Main Branch' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: '123 Street, City', required: false })
    @IsString()
    @IsOptional()
    address?: string;

    @ApiProperty({ example: '+1234567890', required: false })
    @IsString()
    @IsOptional()
    phone?: string;
}

export class UpdateBranchDto {
    @ApiProperty({ example: 'Updated Branch Name', required: false })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({ example: '456 New Ave, City', required: false })
    @IsString()
    @IsOptional()
    address?: string;

    @ApiProperty({ example: '+1987654321', required: false })
    @IsString()
    @IsOptional()
    phone?: string;
}
