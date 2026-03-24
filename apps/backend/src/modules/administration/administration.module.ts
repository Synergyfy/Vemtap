import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdministrationService } from './administration.service';
import { AdministrationController } from './administration.controller';
import { ImpersonationToken } from './entities/impersonation-token.entity';
import { AuditLog } from './entities/audit-log.entity';
import { User } from '../users/entities/user.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Business } from '../businesses/entities/business.entity';
import { AuditInterceptor } from './audit.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ImpersonationToken,
      AuditLog,
      User,
      Branch,
      Business,
    ]),
  ],
  controllers: [AdministrationController],
  providers: [
    AdministrationService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
  exports: [AdministrationService],
})
export class AdministrationModule {}
