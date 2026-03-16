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

export async function createTestApp(
  configureBuilder?: (builder: TestingModuleBuilder) => void,
): Promise<INestApplication> {
  console.log('[TestApp] Starting test module creation...');
  const builder = Test.createTestingModule({
    imports: [AppModule],
  });

  // Mock BullMQ Queues to avoid Redis connections in E2E tests
  const mockQueue = {
    add: jest.fn(),
    process: jest.fn(),
    close: jest.fn(),
    on: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
  };

  console.log('[TestApp] Overriding BullMQ providers...');
  builder
    .overrideProvider(getQueueToken('messaging-batch-send'))
    .useValue(mockQueue);
  builder
    .overrideProvider(getQueueToken('messaging-individual-send'))
    .useValue(mockQueue);
  builder
    .overrideProvider(getQueueToken('messaging-flow-delay'))
    .useValue(mockQueue);
  builder
    .overrideProvider(getQueueToken('messaging-automation'))
    .useValue(mockQueue);

  // Mock BullMQ Processors to avoid starting workers that require Redis connections
  builder.overrideProvider(BatchSendProcessor).useValue({ process: jest.fn() });
  builder.overrideProvider(IndividualSendProcessor).useValue({ process: jest.fn() });
  builder.overrideProvider(FlowDelayProcessor).useValue({ process: jest.fn() });
  builder
    .overrideProvider(AutomationProcessor)
    .useValue({ process: jest.fn() });

  if (configureBuilder) {
    configureBuilder(builder);
  }

  console.log('[TestApp] Compiling testing module (TypeORM will sync and BullMQ will connect here)...');
  const moduleFixture: TestingModule = await builder.compile();

  console.log('[TestApp] Creating Nest application instance...');
  const app = moduleFixture.createNestApplication();

  // Apply standard configuration (pipes, prefix, etc.)
  console.log('[TestApp] Configuring application...');
  await configureApp(app);

  console.log('[TestApp] Initializing application (app.init())...');
  await app.init();

  console.log('[TestApp] Application initialized successfully.');
  return app;
}
