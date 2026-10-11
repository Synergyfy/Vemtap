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

  /**
   * In-app deep link for the row's subject, when it has one. Absent on plain
   * informational notices.
   */
  @ApiProperty({
    example: '/orders/8f3c1b2a-...',
    nullable: true,
  })
  actionUrl: string | null;

  /**
   * Structured payload the row was written with — `{ stat, footnote, cta }` on
   * rows whose figure belongs in a stat block rather than in prose. Null on
   * rows that predate the column and on notices with nothing to attach.
   */
  @ApiProperty({
    example: { stat: { value: '₦342,850', trend: 'zero variance' } },
    nullable: true,
  })
  metadata: Record<string, any> | null;

  @ApiProperty()
  createdAt: Date;
}
