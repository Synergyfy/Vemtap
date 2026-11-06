import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { AccountDeletionStatus } from '../entities/account-deletion-request.entity';

export const ACCOUNT_DELETION_REASONS = [
  'no-longer-use',
  'could-not-find',
  'problem',
  'privacy',
  'another-account',
  'other',
] as const;

export class CreateAccountDeletionDto {
  @ApiPropertyOptional({
    enum: ACCOUNT_DELETION_REASONS,
    example: 'no-longer-use',
    description: 'Optional exit reason. It never blocks deletion.',
  })
  @IsOptional()
  @IsIn(ACCOUNT_DELETION_REASONS)
  reasonId?: string;

  @ApiPropertyOptional({ example: 'I moved to another city.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  feedback?: string;
}

export class AccountDeletionResponseDto {
  @ApiProperty({ example: 'b3f1c2d4-5e6f-4a1b-9c8d-7e6f5a4b3c2d' })
  id: string;

  @ApiProperty({ enum: AccountDeletionStatus, example: 'completed' })
  status: AccountDeletionStatus;

  @ApiProperty({ example: '2026-10-21T10:00:00.000Z' })
  submittedAt: Date;

  @ApiProperty({ example: '2026-10-21T10:00:00.000Z' })
  completedAt: Date;

  @ApiProperty({
    example:
      'Receipts and transaction records are retained for 24 months where legally required, then anonymised.',
  })
  retainedNote: string;
}
