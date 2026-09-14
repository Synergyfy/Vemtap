import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';

console.log('[TestApp] Applying IORedis mock...');
// Mock IORedis BEFORE importing AppModule to ensure BullModule uses the mock
jest.mock('ioredis', () => require('ioredis-mock'));

import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/main';
import { DataSource } from 'typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { BatchSendProcessor } from '../../src/modules/messaging/processors/batch-send.processor';
import { IndividualSendProcessor } from '../../src/modules/messaging/processors/individual-send.processor';
import { FlowDelayProcessor } from '../../src/modules/messaging/processors/flow-delay.processor';
import { AutomationProcessor } from '../../src/modules/messaging/processors/automation.processor';
import { RotatorRefreshProcessor } from '../../src/modules/rotator/rotator-refresh.processor';
import { ClusterAutoAssignProcessor } from '../../src/modules/clusters/cluster-auto-assign.processor';
import { PushNotificationProcessor } from '../../src/modules/notifications/push-notification.processor';
import { OrderNotificationProcessor } from '../../src/modules/catalogue-orders/processors/order-notification.processor';
import { GeocodingProcessor } from '../../src/modules/businesses/processors/geocoding.processor';
import { AffiliateSyncProcessor } from '../../src/modules/affiliates/affiliate-sync.processor';
import { TestErrorFilter } from '../../src/common/filters/test-error.filter';

export async function createTestApp(
  configureBuilder?: (builder: TestingModuleBuilder) => void,
): Promise<INestApplication> {
  console.log('[TestApp] Starting test module creation...');
  const builder = Test.createTestingModule({
    imports: [AppModule],
  });

  // Mock BullMQ Queues to avoid Redis connections in E2E tests
  const mockQueue = {
    add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
    addBulk: jest.fn().mockResolvedValue([]),
    process: jest.fn(),
    close: jest.fn(),
    on: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
  };

  console.log('[TestApp] Overriding BullMQ providers...');
  const queueNames = [
    'messaging-batch-send',
    'messaging-individual-send',
    'messaging-flow-delay',
    'messaging-automation',
    'rotator-refresh',
    'cluster-auto-assign',
    'push-notifications',
    'order-notifications',
    'geocoding',
    'affiliate-external-sync',
  ];

  for (const queueName of queueNames) {
    builder.overrideProvider(getQueueToken(queueName)).useValue(mockQueue);
  }

  // Mock BullMQ Processors to avoid starting workers that require Redis connections
  const mockProcessor = { process: jest.fn() };
  builder.overrideProvider(BatchSendProcessor).useValue(mockProcessor);
  builder.overrideProvider(IndividualSendProcessor).useValue(mockProcessor);
  builder.overrideProvider(FlowDelayProcessor).useValue(mockProcessor);
  builder.overrideProvider(AutomationProcessor).useValue(mockProcessor);
  builder.overrideProvider(RotatorRefreshProcessor).useValue(mockProcessor);
  builder.overrideProvider(ClusterAutoAssignProcessor).useValue(mockProcessor);
  builder.overrideProvider(PushNotificationProcessor).useValue(mockProcessor);
  builder.overrideProvider(OrderNotificationProcessor).useValue(mockProcessor);
  builder.overrideProvider(GeocodingProcessor).useValue(mockProcessor);
  builder.overrideProvider(AffiliateSyncProcessor).useValue(mockProcessor);

  if (configureBuilder) {
    configureBuilder(builder);
  }

  console.log(
    '[TestApp] Compiling testing module (TypeORM will sync and BullMQ will connect here)...',
  );
  const moduleFixture: TestingModule = await builder.compile();

  console.log('[TestApp] Creating Nest application instance...');
  const app = moduleFixture.createNestApplication();

  // Apply standard configuration (pipes, prefix, etc.)
  console.log('[TestApp] Configuring application...');
  await configureApp(app);

  // Apply test-only error logger
  app.useGlobalFilters(new TestErrorFilter());

  console.log('[TestApp] Initializing application (app.init())...');

  await app.init();

  // Seed default free plan for e2e tests
  const dataSource = app.get(DataSource);
  const planRepo = dataSource.getRepository(
    require('../../src/modules/subscriptions/entities/plan.entity').Plan,
  );
  const freePlan = await planRepo.findOne({ where: { isFree: true } });
  if (!freePlan) {
    await planRepo.save(
      planRepo.create({
        name: 'Free Plan',
        isFree: true,
        teamMembersEnabled: true,
        teamMembersLimit: -1,
        loyaltyEnabled: true,
        loyaltyLimit: -1,
        branchesEnabled: true,
        branchLimit: 10,
        analyticsEnabled: true,
        isActive: true,
      }),
    );
  }

  console.log('[TestApp] Application initialized successfully.');
  return app;
}
