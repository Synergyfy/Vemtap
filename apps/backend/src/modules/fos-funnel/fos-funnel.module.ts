import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FosFunnelController } from './fos-funnel.controller';
import { FosFunnelService } from './fos-funnel.service';
import { FosCoreModule } from '../fos-core/fos-core.module';
import { QrThriveUserMapping } from '../qr-thrive/entities/qr-thrive-user-mapping.entity';

@Module({
  imports: [TypeOrmModule.forFeature([QrThriveUserMapping]), FosCoreModule],
  controllers: [FosFunnelController],
  providers: [FosFunnelService],
  exports: [FosFunnelService],
})
export class FosFunnelModule {}
