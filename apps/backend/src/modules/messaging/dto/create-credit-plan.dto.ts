import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';

export class CreateCreditPlanDto {
    @ApiProperty({ example: 'Growth Bundle' })
    @IsString()
    name: string;

    @ApiProperty({ required: false, example: 'Contains 500 SMS and 1000 Email credits' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ example: 5000 })
    @IsNumber()
    @Min(0)
    price: number;

    @ApiProperty({ default: 'NGN', example: 'NGN' })
    @IsString()
    @IsOptional()
    currency?: string;

    @ApiProperty({ example: 500 })
    @IsNumber()
    @Min(0)
    smsAmount: number;

    @ApiProperty({ example: 1000 })
    @IsNumber()
    @Min(0)
    emailAmount: number;

    @ApiProperty({ example: 200 })
    @IsNumber()
    @Min(0)
    whatsappAmount: number;

    @ApiProperty({ default: true, example: true })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
