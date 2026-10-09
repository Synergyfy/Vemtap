import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { MeBookingsController } from './controllers/me-bookings.controller';
import { Booking } from './entities/booking.entity';
import { Branch } from '../branches/entities/branch.entity';
import { CatalogueItem } from '../catalogue/entities/catalogue-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Branch, CatalogueItem])],
  controllers: [BookingsController, MeBookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
