import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatusController } from './status.controller';
import { AdminStatusController } from './admin-status.controller';
import { StatusService } from './status.service';
import { SystemComponent } from './entities/status-component.entity';
import { Incident } from './entities/incident.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SystemComponent, Incident])],
  controllers: [StatusController, AdminStatusController],
  providers: [StatusService],
  exports: [StatusService],
})
export class StatusModule {}
