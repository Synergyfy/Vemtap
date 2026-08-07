import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FosMessagingController } from './fos-messaging.controller';
import { FosMessagingService } from './fos-messaging.service';
import { MessageLog } from '../messaging/entities/message-log.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Business } from '../businesses/entities/business.entity';
import { Setting } from '../settings/entities/setting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MessageLog, Branch, Business, Setting])],
  controllers: [FosMessagingController],
  providers: [FosMessagingService],
  exports: [FosMessagingService],
})
export class FosMessagingModule {}
