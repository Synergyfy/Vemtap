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
   *
   * On a collapsed batch, `stat` and `footnote` describe only the first
   * event and are dropped by the read path before this reaches a client.
   */
  @ApiProperty({
    example: { stat: { value: '₦342,850', trend: 'zero variance' } },
    nullable: true,
  })
  metadata: Record<string, any> | null;

  /**
   * The event this row describes, as distinct from `type` (which is the
   * display tone). Stable, so a client can group or filter by what actually
   * happened. Null on rows written before the column existed.
   */
  @ApiProperty({ example: 'new_rating', nullable: true })
  eventType: string | null;

  /**
   * How many events this row stands for — 1 for an ordinary notification.
   * Above 1 the row is a collapsed batch and `title`/`message` already read
   * in the aggregate, so this is for a client that wants to badge the row
   * rather than for building the sentence.
   */
  @ApiProperty({ example: 1, minimum: 1 })
  groupCount: number;

  @ApiProperty()
  createdAt: Date;
}
