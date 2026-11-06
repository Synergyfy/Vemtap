import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

/** `POST /messaging/inbox/threads/init`: open (or reopen) a thread with a customer. */
export class InitThreadDto {
  @ApiProperty({ description: 'The customer (user) to message' })
  @IsUUID()
  customerId: string;

  @ApiPropertyOptional({ description: 'Branch the thread belongs to' })
  @IsOptional()
  @IsUUID()
  branchId?: string;
}
