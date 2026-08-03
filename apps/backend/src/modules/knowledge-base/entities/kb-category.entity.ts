import { Entity, Column, OneToMany } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { KbSection } from './kb-section.entity';
import { KbPage } from './kb-page.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('kb_categories')
export class KbCategory extends AbstractBaseEntity {
  @ApiProperty({ example: 'Getting Started' })
  @Column()
  title: string;

  @ApiProperty({ example: 0, default: 0 })
  @Column({ type: 'int', default: 0 })
  order: number;

  @OneToMany(() => KbSection, (section) => section.category, {
    cascade: true,
  })
  sections: KbSection[];

  @OneToMany(() => KbPage, (page) => page.category, {
    cascade: true,
  })
  pages: KbPage[];
}
