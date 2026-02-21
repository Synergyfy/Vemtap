import { ApiProperty } from '@nestjs/swagger';

export class NotificationResponseDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: 'Welcome to LaTap!' })
  title: string;

  @ApiProperty({ example: 'Your account has been successfully verified.' })
  message: string;

  @ApiProperty({
    example: 'success',
    enum: ['info', 'success', 'warning', 'error'],
  })
  type: string;

  @ApiProperty({ example: false })
  isRead: boolean;

  @ApiProperty()
  createdAt: Date;
}
