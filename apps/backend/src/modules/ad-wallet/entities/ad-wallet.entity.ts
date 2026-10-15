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
}
