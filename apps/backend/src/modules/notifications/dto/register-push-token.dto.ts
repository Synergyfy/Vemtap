import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsIn,
} from 'class-validator';
import { PushTransport } from '../entities/push-token.entity';

export class RegisterPushTokenDto {
  @ApiProperty({
    example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
    description:
      'An Expo push token from the mobile app, or a serialised Web Push subscription from the browser.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  token: string;

  @ApiPropertyOptional({
    enum: [PushTransport.EXPO, PushTransport.WEB],
    default: PushTransport.EXPO,
    description:
      'How the token should be delivered. Omit to have it inferred from the token itself.',
  })
  @IsOptional()
  @IsIn([PushTransport.EXPO, PushTransport.WEB])
  transport?: PushTransport;

  @ApiPropertyOptional({
    enum: ['ios', 'android', 'web'],
    description: 'Device platform, for delivery diagnostics.',
  })
  @IsOptional()
  @IsString()
  platform?: string;
}
