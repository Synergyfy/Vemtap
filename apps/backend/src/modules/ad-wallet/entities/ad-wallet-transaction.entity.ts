import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { AdWallet, money } from './ad-wallet.entity';

export enum AdWalletTransactionType {
  /** Money paid in. */
  TOPUP = 'topup',
  /** Promotional credit added with a top-up bundle. */
  BONUS = 'bonus',
  /** Held for a campaign at launch. */
  RESERVE = 'reserve',
  /** Reserved money actually consumed by a campaign. */
  SPEND = 'spend',
  /** Unspent reserve returned when a campaign ends or pauses. */
  RELEASE = 'release',
  /** Manual correction by the platform. */
  ADJUSTMENT = 'adjustment',
}

/**
 * Append-only ledger of every wallet movement. `reference` makes top-ups
 * idempotent: a payment reference can only ever be credited once.
 */
@Entity('ad_wallet_transactions')
@Index('IDX_ad_wallet_transactions_wallet_created', ['walletId', 'createdAt'])
export class AdWalletTransaction extends AbstractBaseEntity {
  @ManyToOne(() => AdWallet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'walletId' })
  wallet: AdWallet;

  @Column({ type: 'uuid' })
  walletId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  businessId: string;

  @ApiProperty({ enum: AdWalletTransactionType })
  @Column({ type: 'varchar', length: 20 })
  type: AdWalletTransactionType;

  /** Always positive; `type` says which way it moved. */
  @ApiProperty({ example: 20000 })
  @Column(money)
  amount: number;

  @ApiProperty({ example: 'ADW-2f1c…', nullable: true })
  @Column({ type: 'varchar', length: 120, nullable: true, unique: true })
  reference: string | null;

  @ApiProperty({ nullable: true })
  @Column({ type: 'uuid', nullable: true })
  campaignId: string | null;

  @ApiProperty({ example: 'Prime Lunch Combo boost' })
  @Column({ type: 'varchar', length: 200 })
  description: string;

  @ApiProperty({ example: 25000 })
  @Column(money)
  balanceAfter: number;

  @ApiProperty({ example: 14350 })
  @Column(money)
  reservedAfter: number;
}
