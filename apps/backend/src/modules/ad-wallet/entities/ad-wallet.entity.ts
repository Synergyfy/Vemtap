import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';

export const money = {
  type: 'decimal' as const,
  precision: 14,
  scale: 2,
  default: 0,
  transformer: {
    to: (value: number) => value,
    from: (value: string | null) => (value == null ? 0 : parseFloat(value)),
  },
};

/**
 * A business's prepaid naira balance for paid promotion (boosts and
 * promotion campaigns). Separate from the messaging credit wallet, which
 * counts SMS/email/WhatsApp units rather than money.
 *
 * `balance` is everything in the wallet; `reserved` is the part held for
 * running campaigns; what can still be committed is `balance - reserved`.
 */
@Entity('ad_wallets')
export class AdWallet extends AbstractBaseEntity {
  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @ApiProperty()
  @Column({ type: 'uuid', unique: true })
  businessId: string;

  @ApiProperty({ example: 'VEM-WAL-7Q4K2D' })
  @Column({ type: 'varchar', length: 32, unique: true })
  walletRef: string;

  @ApiProperty({ example: 25000 })
  @Column(money)
  balance: number;

  @ApiProperty({ example: 14350 })
  @Column(money)
  reserved: number;

  /**
   * Paystack reusable authorization for the saved card. Stored only with the
   * owner's consent and never returned by the API.
   */
  @Column({ type: 'varchar', length: 128, nullable: true, select: true })
  cardAuthorizationCode: string | null;

  /** The Paystack customer email the authorization was issued to. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  cardEmail: string | null;

  /** The saved card for display: no secrets. */
  @Column({ type: 'jsonb', nullable: true })
  cardSummary: AdWalletCardSummary | null;

  /** Top up from the saved card when spendable money drops below `threshold`. */
  @Column({ type: 'jsonb', nullable: true })
  autoReload: AdWalletAutoReload | null;
}

export interface AdWalletCardSummary {
  brand: string | null;
  last4: string | null;
  expMonth: string | null;
  expYear: string | null;
  bank: string | null;
}

export interface AdWalletAutoReload {
  enabled: boolean;
  /** Reload when spendable (₦) is below this. */
  threshold: number;
  /** Top-up amount (₦). */
  amount: number;
  lastAttemptAt?: string | null;
  /** Why the last attempt failed (auto-reload is switched off then). */
  lastError?: string | null;
}
