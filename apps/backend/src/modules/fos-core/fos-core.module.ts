import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialTransaction } from './entities/financial-transaction.entity';
import { Expense } from './entities/expense.entity';
import { CashFlow } from './entities/cash-flow.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([FinancialTransaction, Expense, CashFlow]),
  ],
  exports: [TypeOrmModule],
})
export class FosCoreModule {}
