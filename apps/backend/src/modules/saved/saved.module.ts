import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavedService } from './saved.service';
import { SavedBusiness } from './entities/saved-business.entity';
import { SavedService as SavedServiceEntity } from './entities/saved-service.entity';
import { DealSave } from '../deal-engagement/entities/deal-save.entity';
import { Business } from '../businesses/entities/business.entity';
import { CatalogueItem } from '../catalogue/entities/catalogue-item.entity';
import { MeSavedController } from './controllers/me-saved.controller';
import { BusinessesSaveController } from './controllers/businesses-save.controller';
import { ServicesSaveController } from './controllers/services-save.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SavedBusiness,
      SavedServiceEntity,
      DealSave,
      Business,
      CatalogueItem,
    ]),
  ],
  controllers: [
    MeSavedController,
    BusinessesSaveController,
    ServicesSaveController,
  ],
  providers: [SavedService],
  exports: [SavedService],
})
export class SavedModule {}
