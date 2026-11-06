import { Entity, Column, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { numericTransformer } from '../../../common/transformers/numeric.transformer';
import { User } from '../../users/entities/user.entity';

/** A place the customer orders to or picks up near (Home, Office, …). */
@Entity('customer_addresses')
export class CustomerAddress extends AbstractBaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ example: 'Home' })
  @Column({ length: 40 })
  label: string;

  @ApiProperty({ example: '12 Aminu Kano Crescent, Wuse II' })
  @Column({ length: 200 })
  line: string;

  @ApiProperty({ example: 'Abuja, FCT', nullable: true })
  @Column({ type: 'varchar', length: 120, nullable: true })
  area: string | null;

  @ApiProperty({ example: 'Gate code 4411', nullable: true })
  @Column({ type: 'varchar', length: 300, nullable: true })
  notes: string | null;

  @ApiProperty({ example: 9.0765, nullable: true })
  @Column('decimal', {
    precision: 10,
    scale: 7,
    nullable: true,
    transformer: numericTransformer,
  })
  latitude: number | null;

  @ApiProperty({ example: 7.3986, nullable: true })
  @Column('decimal', {
    precision: 10,
    scale: 7,
    nullable: true,
    transformer: numericTransformer,
  })
  longitude: number | null;

  @ApiProperty({ example: true })
  @Column({ default: false })
  isDefault: boolean;
}
