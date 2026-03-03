import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { ControlTowerController } from './controllers/control-tower.controller';
import { ControlTowerService } from './services/control-tower.service';
import { Business } from '../businesses/entities/business.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Business, Contact, User])],
  controllers: [SystemController, ControlTowerController],
  providers: [SystemService, ControlTowerService],
  exports: [SystemService, ControlTowerService],
})
export class SystemModule {}
