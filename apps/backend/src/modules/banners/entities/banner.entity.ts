import { Entity, Column } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('banners')
export class Banner extends AbstractBaseEntity {
  @ApiProperty({ example: 'Welcome to VemTap!', description: 'Banner title' })
  @Column()
  title: string;

  @ApiProperty({ example: 'Manage your visitors and loyalty programs.', description: 'Banner description' })
  @Column('text')
  description: string;

  @ApiProperty({ example: 'Megaphone', description: 'Icon name identifier (Sparkles, Megaphone, Zap, Gift)' })
  @Column({ default: 'Megaphone' })
  iconName: string;

  @ApiProperty({ example: 'Learn More', description: 'Optional CTA button label', required: false })
  @Column({ nullable: true })
  actionLabel: string;

  @ApiProperty({ example: '/dashboard/visitors/all', description: 'Optional CTA button URL', required: false })
  @Column({ nullable: true })
  actionUrl: string;

  @ApiProperty({ example: 'bg-gradient-to-r from-emerald-600 to-teal-500', description: 'Tailwind gradient class for banner background' })
  @Column({ default: 'bg-gradient-to-r from-emerald-600 to-teal-500' })
  color: string;

  @ApiProperty({ example: 0, description: 'Display order (lower = first)' })
  @Column({ default: 0 })
  sortOrder: number;

  @ApiProperty({ example: true, description: 'Whether the banner is active' })
  @Column({ default: true })
  isActive: boolean;
}
