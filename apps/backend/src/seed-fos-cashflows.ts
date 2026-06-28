import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource, Repository } from 'typeorm';
import {
  FinancialTransaction,
  FosTransactionType,
} from './modules/fos-core/entities/financial-transaction.entity';
import {
  CashFlow,
  CashFlowType,
} from './modules/fos-core/entities/cash-flow.entity';
import {
  Expense,
  ExpenseFrequency,
} from './modules/fos-core/entities/expense.entity';

const BATCH_SIZE = 500;

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const fosRepo: Repository<FinancialTransaction> =
    dataSource.getRepository(FinancialTransaction);
  const cashFlowRepo: Repository<CashFlow> = dataSource.getRepository(CashFlow);
  const expenseRepo: Repository<Expense> = dataSource.getRepository(Expense);

  const existingCashFlows = await cashFlowRepo.count();
  if (existingCashFlows > 0) {
    console.log(
      `cash_flows already has ${existingCashFlows} records. Skipping backfill.`,
    );
    await app.close();
    return;
  }

  const allTransactions = await fosRepo.find();

  if (allTransactions.length === 0) {
    console.log('fos_transactions is empty. Nothing to backfill.');
    await app.close();
    return;
  }

  let totalCashFlows = 0;
  let totalExpenses = 0;

  // Backfill cash_flows from fos_transactions
  const cashFlowRecords: Partial<CashFlow>[] = [];
  const expenseRecords: Partial<Expense>[] = [];

  for (const t of allTransactions) {
    if (
      t.type === FosTransactionType.SUBSCRIPTION ||
      t.type === FosTransactionType.SMS
    ) {
      cashFlowRecords.push({
        type: CashFlowType.INFLOW,
        category:
          t.type === FosTransactionType.SUBSCRIPTION
            ? 'subscription_revenue'
            : 'sms_revenue',
        amount: Number(t.amount),
        date: t.date,
      });
    } else if (t.type === FosTransactionType.COMMISSION) {
      cashFlowRecords.push({
        type: CashFlowType.OUTFLOW,
        category: 'commission',
        amount: Number(t.amount),
        date: t.date,
      });
    } else if (t.type === FosTransactionType.EXPENSE) {
      // Also backfill expenses table
      expenseRecords.push({
        category: 'sms_credits',
        amount: Number(t.amount),
        frequency: ExpenseFrequency.ONE_TIME,
        date: t.date,
      });
      cashFlowRecords.push({
        type: CashFlowType.OUTFLOW,
        category: 'operating_expense',
        amount: Number(t.amount),
        date: t.date,
      });
    }
  }

  // Insert cash_flows in batches
  console.log(`Queued ${cashFlowRecords.length} cash_flow records`);
  for (let i = 0; i < cashFlowRecords.length; i += BATCH_SIZE) {
    const batch = cashFlowRecords.slice(i, i + BATCH_SIZE);
    await cashFlowRepo.save(batch);
    totalCashFlows += batch.length;
    console.log(
      `  Inserted cash_flow batch ${Math.floor(i / BATCH_SIZE) + 1} (${totalCashFlows} total)`,
    );
  }

  // Insert expenses in batches
  console.log(`Queued ${expenseRecords.length} expense records`);
  for (let i = 0; i < expenseRecords.length; i += BATCH_SIZE) {
    const batch = expenseRecords.slice(i, i + BATCH_SIZE);
    await expenseRepo.save(batch);
    totalExpenses += batch.length;
    console.log(
      `  Inserted expense batch ${Math.floor(i / BATCH_SIZE) + 1} (${totalExpenses} total)`,
    );
  }

  console.log(
    `Backfilled ${totalCashFlows} cash_flows and ${totalExpenses} expenses.`,
  );
  await app.close();
}

bootstrap().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
