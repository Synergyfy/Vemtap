import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LegalComplianceController } from './legal-compliance.controller';
import { LegalComplianceService } from './legal-compliance.service';
import { LegalAgreement } from './entities/legal-agreement.entity';
import { LegalAgreementAcceptance } from './entities/legal-agreement-acceptance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LegalAgreement, LegalAgreementAcceptance]),
  ],
  controllers: [LegalComplianceController],
  providers: [LegalComplianceService],
  exports: [LegalComplianceService],
})
export class LegalComplianceModule {}
