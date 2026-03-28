import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogueService } from './catalogue.service';
import { AdminCatalogueController } from './admin-catalogue.controller';
import { PublicCatalogueController } from './public-catalogue.controller';
import { CatalogueCategory } from './entities/catalogue-category.entity';
import { CatalogueItem } from './entities/catalogue-item.entity';
import { Branch } from '../branches/entities/branch.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CatalogueCategory, CatalogueItem, Branch]),
  ],
  controllers: [AdminCatalogueController, PublicCatalogueController],
  providers: [CatalogueService],
  exports: [CatalogueService],
})
export class CatalogueModule {}
