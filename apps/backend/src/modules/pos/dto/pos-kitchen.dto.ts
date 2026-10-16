import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { CatalogueOrderStatus } from '../../catalogue-orders/entities/catalogue-order.entity';

export const KITCHEN_STATUSES = [
  CatalogueOrderStatus.NEW,
  CatalogueOrderStatus.PROCESSING,
  CatalogueOrderStatus.READY,
  CatalogueOrderStatus.COMPLETED,
] as const;
export type KitchenStatus = (typeof KITCHEN_STATUSES)[number];

export class PosKitchenQueryDto {
  @ApiPropertyOptional({
    description: "Branch to stream; defaults to the caller's branch",
  })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ enum: KITCHEN_STATUSES })
  @IsOptional()
  @IsIn(KITCHEN_STATUSES)
  status?: KitchenStatus;
}

export class UpdateKitchenOrderStatusDto {
  @ApiProperty({
    enum: [...KITCHEN_STATUSES, CatalogueOrderStatus.CANCELLED],
    description: 'new → processing → ready → completed, or cancelled',
  })
  @IsIn([...KITCHEN_STATUSES, CatalogueOrderStatus.CANCELLED])
  status: KitchenStatus | CatalogueOrderStatus.CANCELLED;

  @ApiPropertyOptional({ example: 'Out of salmon' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}

export class PosKitchenLineDto {
  @ApiProperty({ example: 'Jollof Rice & Chicken' }) name: string;
  @ApiProperty({ example: 2 }) quantity: number;
  @ApiProperty({ example: 5400 }) lineTotal: number;
}

export class PosKitchenOrderDto {
  @ApiProperty() id: string;
  @ApiProperty({ example: '#3F9A21C0' }) reference: string;
  @ApiProperty({ enum: CatalogueOrderStatus }) status: CatalogueOrderStatus;
  @ApiProperty({ nullable: true, example: '12' }) tableNumber: string | null;
  @ApiProperty({ nullable: true }) notes: string | null;
  @ApiProperty({ nullable: true, example: 'Tolu' }) guestName: string | null;
  @ApiProperty({ nullable: true, example: '+2348023456789' })
  guestPhone: string | null;
  @ApiProperty({ example: 27950 }) totalAmount: number;
  @ApiProperty({ description: 'A POS sale settled this order' }) paid: boolean;
  @ApiProperty() createdAt: Date;
  @ApiProperty({ nullable: true }) statusTimeline: Record<
    string,
    string
  > | null;
  @ApiProperty({ example: 9, description: 'Minutes since the order came in' })
  elapsedMinutes: number;
  @ApiProperty({ type: [PosKitchenLineDto] }) lines: PosKitchenLineDto[];
}

export class PosKitchenStreamDto {
  @ApiProperty({ type: [PosKitchenOrderDto] }) data: PosKitchenOrderDto[];
  @ApiProperty({ example: { new: 3, processing: 4, ready: 1, completed: 22 } })
  counts: Record<KitchenStatus, number>;
  @ApiProperty({
    example: 14,
    nullable: true,
    description: 'Average minutes from new to ready today',
  })
  averagePrepMinutes: number | null;
  @ApiProperty({ example: 9700, description: 'Unpaid open orders total' })
  unpaidTotal: number;
}
