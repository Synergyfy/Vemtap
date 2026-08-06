import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource, Repository, In } from 'typeorm';
import {
  Payment,
  PaymentPurpose,
  PaymentStatus,
} from './modules/payments/entities/payment.entity';
import { AffiliateCommission } from './modules/affiliates/entities/commission.entity';
import { CreditTransaction } from './modules/messaging/entities/credit-transaction.entity';
import {
  FinancialTransaction,
  FosTransactionType,
  FosPlatform,
} from './modules/fos-core/entities/financial-transaction.entity';

const BATCH_SIZE = 500;

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const fosRepo: Repository<FinancialTransaction> =
    dataSource.getRepository(FinancialTransaction);

  const existingCount = await fosRepo.count();
  if (existingCount > 0) {
    console.log(
      `fos_transactions already has ${existingCount} records. Skipping seed.`,
    );
    await app.close();
    return;
  }

  let totalSeeded = 0;

  // 1. From payments
  const paymentRepo: Repository<Payment> = dataSource.getRepository(Payment);
  const payments = await paymentRepo.find({
    where: { status: PaymentStatus.SUCCESS },
  });
  const paymentRecords: Partial<FinancialTransaction>[] = [];
  for (const p of payments) {
    let type: FosTransactionType;
    if (
      [
        PaymentPurpose.SUBSCRIPTION,
        PaymentPurpose.ADDON,
        PaymentPurpose.PLAN_WITH_ADDONS,
      ].includes(p.purpose)
    ) {
      type = FosTransactionType.SUBSCRIPTION;
    } else if (p.purpose === PaymentPurpose.CREDIT_TOPUP) {
      type = FosTransactionType.SMS;
    } else {
      continue;
    }
    paymentRecords.push({
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
  console.log(`  Queued ${paymentRecords.length} payment records`);
  for (let i = 0; i < paymentRecords.length; i += BATCH_SIZE) {
    const batch = paymentRecords.slice(i, i + BATCH_SIZE);
    await fosRepo.save(batch);
    totalSeeded += batch.length;
    console.log(
      `  Inserted payment batch ${i / BATCH_SIZE + 1} (${totalSeeded} total)`,
    );
  }

  // 2. From affiliate commissions
  const commissionRepo: Repository<AffiliateCommission> =
    dataSource.getRepository(AffiliateCommission);
  const commissions = await commissionRepo.find();
  const commissionRecords: Partial<FinancialTransaction>[] = [];
  for (const c of commissions) {
    commissionRecords.push({
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
  console.log(`  Queued ${commissionRecords.length} commission records`);
  for (let i = 0; i < commissionRecords.length; i += BATCH_SIZE) {
    const batch = commissionRecords.slice(i, i + BATCH_SIZE);
    await fosRepo.save(batch);
    totalSeeded += batch.length;
    console.log(
      `  Inserted commission batch ${i / BATCH_SIZE + 1} (${totalSeeded} total)`,
    );
  }

  // 3. From credit transactions (message deductions as expense)
  const creditRepo: Repository<CreditTransaction> =
    dataSource.getRepository(CreditTransaction);
  const creditTxns = await creditRepo.find();
  const creditRecords: Partial<FinancialTransaction>[] = [];
  for (const ct of creditTxns) {
    creditRecords.push({
      type: FosTransactionType.EXPENSE,
      platform: FosPlatform.VEMTAP,
      businessId: ct.businessId,
      agentId: undefined,
      amount: ct.credits,
      cost: ct.credits,
      profit: -ct.credits,
      paymentMethod: undefined,
      referenceId: undefined,
      date: ct.createdAt.toISOString().split('T')[0],
      description: `${ct.channel} ${ct.transactionType}: ${ct.credits} credits`,
    });
  }
  console.log(`  Queued ${creditRecords.length} credit transaction records`);
  for (let i = 0; i < creditRecords.length; i += BATCH_SIZE) {
    const batch = creditRecords.slice(i, i + BATCH_SIZE);
    await fosRepo.save(batch);
    totalSeeded += batch.length;
    console.log(
      `  Inserted credit batch ${i / BATCH_SIZE + 1} (${totalSeeded} total)`,
    );
  }

  console.log(`Seeded ${totalSeeded} total records into fos_transactions.`);
  await app.close();
}

bootstrap().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
