import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { KbCategory } from './kb-category.entity';
import { ApiProperty } from '@nestjs/swagger';
import { KbPage } from './kb-page.entity';

@Entity('kb_sections')
export class KbSection extends AbstractBaseEntity {
  @ApiProperty({ example: 'POS Setup' })
  @Column()
  title: string;

  @Column({ type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => KbCategory, (category) => category.sections, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'categoryId' })
  category: KbCategory;

  @ApiProperty({ example: 0, default: 0 })
  @Column({ type: 'int', default: 0 })
  order: number;

  @OneToMany(() => KbPage, (page) => page.section, {
    cascade: true,
  })
  pages: KbPage[];
}
