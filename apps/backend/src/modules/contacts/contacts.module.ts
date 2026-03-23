import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact } from './entities/contact.entity';
import { SegmentsService } from './services/segments.service';
import { SegmentsController } from './controllers/segments.controller';
import { Segment } from './entities/segment.entity';
import { User } from '../users/entities/user.entity';
import { Branch } from '../branches/entities/branch.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Contact, Segment, User, Branch])],
  providers: [SegmentsService],
  controllers: [SegmentsController],
  exports: [TypeOrmModule, SegmentsService],
})
export class ContactsModule {}
