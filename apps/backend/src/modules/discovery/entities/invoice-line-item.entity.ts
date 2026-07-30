import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { DiscoveryInvoice } from './discovery-invoice.entity';
@Entity('invoice_line_items')
export class InvoiceLineItem extends AbstractBaseEntity {
  @ManyToOne(() => DiscoveryInvoice, (invoice) => invoice.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invoiceId' })
  invoice: DiscoveryInvoice;

  @Column({ type: 'uuid' })
  invoiceId: string;

  @Column()
  description: string;

  @Column({ type: 'int', default: 1 })
  qty: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total: number;
}
