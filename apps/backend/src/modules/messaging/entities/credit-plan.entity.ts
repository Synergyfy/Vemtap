import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';

@Entity('credit_plans')
export class CreditPlan extends AbstractBaseEntity {
    @ApiProperty({ example: 'Basic SMS Bundle' })
    @Column()
    name: string;

    @ApiProperty({ example: '100 SMS messages' })
    @Column({ type: 'text', nullable: true })
    description: string;

    @ApiProperty({ example: 1000 })
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number;

    @ApiProperty({ example: 'NGN' })
    @Column({ default: 'NGN' })
    currency: string;

    @ApiProperty({ example: 100 })
    @Column({ type: 'int', default: 0 })
    smsAmount: number;

    @ApiProperty({ example: 50 })
    @Column({ type: 'int', default: 0 })
    emailAmount: number;

    @ApiProperty({ example: 20 })
    @Column({ type: 'int', default: 0 })
    whatsappAmount: number;

    @ApiProperty({ example: true })
    @Column({ default: true })
    isActive: boolean;
}
