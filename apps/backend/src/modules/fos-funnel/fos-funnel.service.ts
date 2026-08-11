import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  FinancialTransaction,
  FosPlatform,
  FosTransactionType,
} from '../fos-core/entities/financial-transaction.entity';
import { QrThriveUserMapping } from '../qr-thrive/entities/qr-thrive-user-mapping.entity';
import { ExternalLeadStatusEntity } from '../qr-thrive/entities/external-lead-status.entity';

@Injectable()
export class FosFunnelService {
  constructor(
    @InjectRepository(FinancialTransaction)
    private readonly transactionRepo: Repository<FinancialTransaction>,
    @InjectRepository(QrThriveUserMapping)
    private readonly mappingRepo: Repository<QrThriveUserMapping>,
    private readonly dataSource: DataSource,
  ) {}

  async getFunnelStats() {
    const qrTransactions = await this.transactionRepo.find({
      where: { platform: FosPlatform.QRTHRIVE },
    });

    const qrScans = qrTransactions.length;
    const convertedBusinessIds = new Set(
      qrTransactions
        .filter(
          (t) => t.businessId && t.type === FosTransactionType.SUBSCRIPTION,
        )
        .map((t) => t.businessId),
    );
    const convertedToVemtap = convertedBusinessIds.size;

    let leadsCaptured = 0;
    let qrUsers = 0;
    try {
      const leadsRepo = this.dataSource.getRepository(ExternalLeadStatusEntity);
      leadsCaptured = await leadsRepo.count();
      qrUsers = await this.mappingRepo.count();
    } catch {
      // best-effort; counters fall back to zero when tables are empty
    }

    const conversionRate =
      qrUsers > 0 ? Math.round((convertedToVemtap / qrUsers) * 1000) / 10 : 0;

    return [
      {
        id: 'latest',
        qrScans,
        leadsCaptured,
        qrUsers,
        convertedToVemtap,
        conversionRate,
        date: new Date().toISOString().split('T')[0],
      },
    ];
  }
}
