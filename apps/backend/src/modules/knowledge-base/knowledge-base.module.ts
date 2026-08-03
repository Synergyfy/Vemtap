import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KbCategory } from './entities/kb-category.entity';
import { KbSection } from './entities/kb-section.entity';
import { KbPage } from './entities/kb-page.entity';
import { KnowledgeBaseService } from './knowledge-base.service';
import { PublicKnowledgeBaseController } from './public-knowledge-base.controller';
import { AdminKnowledgeBaseController } from './admin-knowledge-base.controller';

@Module({
  imports: [TypeOrmModule.forFeature([KbCategory, KbSection, KbPage])],
  controllers: [PublicKnowledgeBaseController, AdminKnowledgeBaseController],
  providers: [KnowledgeBaseService],
  exports: [KnowledgeBaseService],
})
export class KnowledgeBaseModule {}
