import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FosProfileController } from './fos-profile.controller';
import { FosProfileService } from './fos-profile.service';
import { User } from '../users/entities/user.entity';
import { FosAuditLog } from '../fos-settings/entities/fos-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, FosAuditLog])],
  controllers: [FosProfileController],
  providers: [FosProfileService],
  exports: [FosProfileService],
})
export class FosProfileModule {}
