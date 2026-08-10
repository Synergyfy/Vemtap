import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FosTransfersController } from './fos-transfers.controller';
import { FosTransfersService } from './fos-transfers.service';
import { FosTransfer } from './entities/transfer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FosTransfer])],
  controllers: [FosTransfersController],
  providers: [FosTransfersService],
  exports: [FosTransfersService],
})
export class FosTransfersModule {}
