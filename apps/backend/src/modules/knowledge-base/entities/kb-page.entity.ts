import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { KbCategory } from './kb-category.entity';
import { KbSection } from './kb-section.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('kb_pages')
export class KbPage extends AbstractBaseEntity {
  @ApiProperty({ example: 'Introduction to POS' })
  @Column()
  title: string;

  @ApiProperty({ example: 'pos/getting-started' })
  @Column({ unique: true })
  @Index()
  path: string;

  @ApiProperty({ example: 'A brief guide on setting up your POS device.' })
  @Column({ type: 'text' })
  summary: string;

  @ApiProperty({ example: 'https://example.com/thumb.jpg', nullable: true })
  @Column({ type: 'varchar', nullable: true })
  thumbnail: string | null;

  @ApiProperty({
    example: [
      { type: 'heading', text: 'Step 1' },
      { type: 'text', text: 'Turn on device' },
      { type: 'steps', items: ['Connect power', 'Press button'] },
      { type: 'image', url: 'https://example.com/img.png', caption: 'Button' },
    ],
  })
  @Column({ type: 'jsonb', default: [] })
  blocks: Record<string, any>[];

  @ApiProperty({
    example: ['Make sure device is charged'],
    nullable: true,
  })
  @Column({ type: 'jsonb', nullable: true })
  tips: string[] | null;

  @Column({ type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => KbCategory, (category) => category.pages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'categoryId' })
  category: KbCategory;

  @Column({ type: 'uuid' })
  sectionId: string;

  @ManyToOne(() => KbSection, (section) => section.pages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sectionId' })
  section: KbSection;

  @ApiProperty({ example: 0, default: 0 })
  @Column({ type: 'int', default: 0 })
  order: number;
}
