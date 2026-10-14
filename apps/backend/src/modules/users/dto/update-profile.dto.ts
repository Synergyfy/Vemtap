import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserProfileDto {
  @ApiProperty({ example: 'John', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Female', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  gender?: string;

  /**
   * Persisted so an avatar outlives the device-local session snapshot: the
   * upload flow PUTs the file to Cloudinary first, then PATCHes this field
   * back onto the user so every surface renders it on the next login too.
   * Must be declared or the app-wide `forbidNonWhitelisted` pipe drops it.
   */
  @ApiProperty({
    example: 'https://res.cloudinary.com/demo/image/upload/avatar.png',
    required: false,
    description: 'Avatar image URL persisted after the upload succeeds',
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  avatar?: string;

  // Email updates usually require verification, but for profile update let's allow it or maybe not?
  // The reviewer mentioned "emailVerified".
  // Let's stick to safe fields.
}
