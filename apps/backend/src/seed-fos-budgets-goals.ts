import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { dataSourceOptions } from './database/data-source';
import {
  Budget,
  BudgetPeriodType,
} from './modules/fos-budgets/entities/budget.entity';
import { Goal, Project } from './modules/fos-goals/entities/goal.entity';

async function bootstrap() {
  const dataSource = new DataSource(dataSourceOptions);
  await dataSource.initialize();

  const budgetRepo = dataSource.getRepository(Budget);
  const goalRepo = dataSource.getRepository(Goal);
  const projectRepo = dataSource.getRepository(Project);

  if ((await budgetRepo.count()) === 0) {
    const today = new Date();
    const end = new Date(today);
    end.setMonth(end.getMonth() + 1);
    await budgetRepo.save(
      budgetRepo.create({
        periodType: BudgetPeriodType.MONTHLY,
        targetRevenue: 3000000,
        targetBusinesses: 350,
        targetSmsUsage: 1500000,
        targetProfit: 1500000,
        startDate: today.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        createdBy: null,
      }),
    );
    console.log('Seeded fos_budgets.');
  } else {
    console.log('fos_budgets already has records. Skipping.');
  }

  if ((await goalRepo.count()) === 0) {
    const deadline = new Date();
    deadline.setMonth(deadline.getMonth() + 3);
    await goalRepo.save(
      goalRepo.create({
        name: 'Reach 400 Businesses',
        target: 400,
        current: 342,
        deadline: deadline.toISOString().split('T')[0],
        category: 'Growth',
      }),
    );
    console.log('Seeded fos_goals.');
  } else {
    console.log('fos_goals already has records. Skipping.');
  }

  if ((await projectRepo.count()) === 0) {
    const deadline = new Date();
    deadline.setMonth(deadline.getMonth() + 1);
    await projectRepo.save(
      projectRepo.create({
        name: 'QRThrive V2 Launch',
        budget: 500000,
        spent: 320000,
        revenue: 850000,
        status: 'IN_PROGRESS',
        deadline: deadline.toISOString().split('T')[0],
      }),
    );
    console.log('Seeded fos_projects.');
  } else {
    console.log('fos_projects already has records. Skipping.');
  }

  await dataSource.destroy();
}

bootstrap().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
