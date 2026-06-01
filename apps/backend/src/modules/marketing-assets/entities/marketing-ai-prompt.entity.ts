import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';

@Entity('marketing_ai_prompts')
export class MarketingAIPrompt extends AbstractBaseEntity {
  @ApiProperty({ example: 'Review Call to Action' })
  @Column()
  name: string;

  @ApiProperty({ example: 'Review Request', description: 'Prompt category' })
  @Column()
  category: string;

  @ApiProperty({ example: 'Write a catchy one-line call to action for a {businessType} business asking customers to leave a Google Review. Emphasize a friendly vibe.', description: 'The prompt template' })
  @Column({ type: 'text' })
  promptTemplate: string;

  @ApiProperty({ example: true })
  @Column({ default: true })
  isActive: boolean;
}
