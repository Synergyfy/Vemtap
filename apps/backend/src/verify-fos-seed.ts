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
import { Expense } from './modules/fos-core/entities/expense.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const fosRepo: Repository<FinancialTransaction> =
    dataSource.getRepository(FinancialTransaction);
  const cashFlowRepo: Repository<CashFlow> = dataSource.getRepository(CashFlow);
  const expenseRepo: Repository<Expense> = dataSource.getRepository(Expense);

  const fosCount = await fosRepo.count();
  const cashFlowCount = await cashFlowRepo.count();
  const expenseCount = await expenseRepo.count();

  console.log('=== FOS DATA VERIFICATION ===');
  console.log(`fos_transactions: ${fosCount} records`);
  console.log(`cash_flows: ${cashFlowCount} records`);
  console.log(`expenses: ${expenseCount} records`);

  if (fosCount > 0) {
    const byType = await fosRepo
      .createQueryBuilder('t')
      .select('t.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(t.amount), 0)', 'totalAmount')
      .addSelect('COALESCE(SUM(t.cost), 0)', 'totalCost')
      .addSelect('COALESCE(SUM(t.profit), 0)', 'totalProfit')
      .groupBy('t.type')
      .getRawMany();
    console.log('\n--- fos_transactions breakdown ---');
    for (const row of byType) {
      console.log(
        `  ${row.type}: ${row.count} records, amount=${row.totalAmount}, cost=${row.totalCost}, profit=${row.totalProfit}`,
      );
    }

    const samples = await fosRepo.find({
      take: 3,
      order: { createdAt: 'DESC' },
    });
    console.log('\n--- Sample records ---');
    for (const s of samples) {
      console.log(
        `  ${s.type} | ${s.platform} | amt=${s.amount} | cost=${s.cost} | profit=${s.profit} | date=${s.date} | biz=${s.businessId ?? '-'} | desc=${s.description ?? '-'}`,
      );
    }
  }

  if (cashFlowCount > 0) {
    const cfByType = await cashFlowRepo
      .createQueryBuilder('cf')
      .select('cf.type', 'type')
      .addSelect('cf.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(cf.amount), 0)', 'totalAmount')
      .groupBy('cf.type')
      .addGroupBy('cf.category')
      .getRawMany();
    console.log('\n--- cash_flows breakdown ---');
    for (const row of cfByType) {
      console.log(
        `  ${row.type} | ${row.category}: ${row.count} records, total=${row.totalAmount}`,
      );
    }
  }

  if (expenseCount > 0) {
    const expByCat = await expenseRepo
      .createQueryBuilder('e')
      .select('e.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(e.amount), 0)', 'totalAmount')
      .groupBy('e.category')
      .getRawMany();
    console.log('\n--- expenses breakdown ---');
    for (const row of expByCat) {
      console.log(
        `  ${row.category}: ${row.count} records, total=${row.totalAmount}`,
      );
    }
  }

  await app.close();
}

bootstrap().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
