import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource, Repository } from 'typeorm';
import { Payment, PaymentPurpose, PaymentStatus } from './modules/payments/entities/payment.entity';
import { AffiliateCommission } from './modules/affiliates/entities/commission.entity';
import { CreditTransaction } from './modules/messaging/entities/credit-transaction.entity';
import { FinancialTransaction, FosTransactionType, FosPlatform } from './modules/fos-core/entities/financial-transaction.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const fosRepo: Repository<FinancialTransaction> = dataSource.getRepository(FinancialTransaction);

  const existingCount = await fosRepo.count();
  if (existingCount > 0) {
    console.log(`fos_transactions already has ${existingCount} records. Skipping seed.`);
    await app.close();
    return;
  }

  const records: Partial<FinancialTransaction>[] = [];

  // 1. From payments
  const paymentRepo: Repository<Payment> = dataSource.getRepository(Payment);
  const payments = await paymentRepo.find({ where: { status: PaymentStatus.SUCCESS } });
  for (const p of payments) {
    let type: FosTransactionType;
    if ([PaymentPurpose.SUBSCRIPTION, PaymentPurpose.ADDON, PaymentPurpose.PLAN_WITH_ADDONS].includes(p.purpose)) {
      type = FosTransactionType.SUBSCRIPTION;
    } else if (p.purpose === PaymentPurpose.CREDIT_TOPUP) {
      type = FosTransactionType.SMS;
    } else {
      continue;
    }
    records.push({
      type,
      platform: FosPlatform.VEMTAP,
      businessId: p.businessId ?? undefined,
      agentId: undefined,
      amount: Number(p.amount),
      cost: 0,
      profit: Number(p.amount),
      paymentMethod: undefined,
      referenceId: p.reference,
      date: p.createdAt.toISOString().split('T')[0],
      description: `Payment: ${p.purpose}`,
    });
  }
  console.log(`  Queued ${payments.length} payment records`);

  // 2. From affiliate commissions (Paid)
  const commissionRepo: Repository<AffiliateCommission> = dataSource.getRepository(AffiliateCommission);
  const commissions = await commissionRepo.find();
  for (const c of commissions) {
    records.push({
      type: FosTransactionType.COMMISSION,
      platform: FosPlatform.VEMTAP,
      businessId: c.referredBusinessId ?? undefined,
      agentId: c.affiliateId,
      amount: Number(c.amount),
      cost: Number(c.amount),
      profit: 0,
      paymentMethod: undefined,
      referenceId: c.paymentId ?? undefined,
      date: c.createdAt.toISOString().split('T')[0],
      description: c.description ?? 'Affiliate commission',
    });
  }
  console.log(`  Queued ${commissions.length} commission records`);

  // 3. From credit transactions (message deductions as expense)
  const creditRepo: Repository<CreditTransaction> = dataSource.getRepository(CreditTransaction);
  const creditTxns = await creditRepo.find();
  for (const ct of creditTxns) {
    records.push({
      type: FosTransactionType.EXPENSE,
      platform: FosPlatform.VEMTAP,
      businessId: ct.businessId,
      agentId: undefined,
      amount: 0,
      cost: ct.credits,
      profit: -ct.credits,
      paymentMethod: undefined,
      referenceId: undefined,
      date: ct.createdAt.toISOString().split('T')[0],
      description: `${ct.channel} ${ct.transactionType}: ${ct.credits} credits`,
    });
  }
  console.log(`  Queued ${creditTxns.length} credit transaction records`);

  if (records.length === 0) {
    console.log('No source data found to seed fos_transactions.');
    await app.close();
    return;
  }

  await fosRepo.save(records);
  console.log(`Seeded ${records.length} records into fos_transactions.`);
  await app.close();
}

bootstrap().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
