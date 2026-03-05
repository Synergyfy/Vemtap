import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BusinessSudoActionDto {
  @ApiProperty({ example: 'biz_102' })
  @IsString()
  businessUid: string;

  @ApiProperty({ example: 'TKT-9912', required: false })
  @IsOptional()
  @IsString()
  ticketRef?: string;

  @ApiProperty({
    enum: [
      'add_user',
      'send_message',
      'add_device',
      'adjust_loyalty',
      'resolve_ticket',
      'assume_session',
      'reset_access',
      'pause',
    ],
  })
  @IsEnum([
    'add_user',
    'send_message',
    'add_device',
    'adjust_loyalty',
    'resolve_ticket',
    'assume_session',
    'reset_access',
    'pause',
  ])
  actionKey: string;

  @ApiProperty({
    required: false,
    description: 'Flexible payload for action fields',
    example: {
      full_name: 'Jane Doe',
      email: 'jane@business.com',
      role: 'Manager',
    },
  })
  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;
}

export class CustomerSudoActionDto {
  @ApiProperty({ example: 'cus_8801' })
  @IsString()
  customerUid: string;

  @ApiProperty({ example: 'biz_102' })
  @IsString()
  businessUid: string;

  @ApiProperty({ example: 'TKT-9912', required: false })
  @IsOptional()
  @IsString()
  ticketRef?: string;

  @ApiProperty({
    enum: [
      'add_profile',
      'award_points',
      'redeem_fix',
      'update_contact',
      'close_issue',
    ],
  })
  @IsEnum([
    'add_profile',
    'award_points',
    'redeem_fix',
    'update_contact',
    'close_issue',
  ])
  actionKey: string;

  @ApiProperty({
    required: false,
    description: 'Flexible payload for action fields',
    example: { points: 100, reason: 'Compensation' },
  })
  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;
}

export class BusinessSearchFilterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}

export class CustomerSearchFilterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}
