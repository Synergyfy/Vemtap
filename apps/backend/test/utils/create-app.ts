import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
// Mock IORedis BEFORE importing AppModule to ensure BullModule uses the mock
jest.mock('ioredis', () => require('ioredis-mock'));

import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/main';
import { DataSource } from 'typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { BatchSendProcessor } from '../../src/modules/messaging/processors/batch-send.processor';
import { FlowDelayProcessor } from '../../src/modules/messaging/processors/flow-delay.processor';
import { AutomationProcessor } from '../../src/modules/messaging/processors/automation.processor';

export async function createTestApp(
  configureBuilder?: (builder: TestingModuleBuilder) => void
): Promise<INestApplication> {
  const builder = Test.createTestingModule({
    imports: [AppModule],
  });

  // Mock BullMQ Queues to avoid Redis connections in E2E tests
  const mockQueue = {
    add: jest.fn(),
    process: jest.fn(),
    close: jest.fn(),
    on: jest.fn(),
  };

  builder.overrideProvider(getQueueToken('messaging-batch-send')).useValue(mockQueue);
  builder.overrideProvider(getQueueToken('messaging-flow-delay')).useValue(mockQueue);
  builder.overrideProvider(getQueueToken('messaging-automation')).useValue(mockQueue);

  // Mock BullMQ Processors to avoid starting workers that require Redis connections
  builder.overrideProvider(BatchSendProcessor).useValue({ process: jest.fn() });
  builder.overrideProvider(FlowDelayProcessor).useValue({ process: jest.fn() });
  builder.overrideProvider(AutomationProcessor).useValue({ process: jest.fn() });

  if (configureBuilder) {
    configureBuilder(builder);
  }

  const moduleFixture: TestingModule = await builder.compile();

  const app = moduleFixture.createNestApplication();

  // Apply standard configuration (pipes, prefix, etc.)
  await configureApp(app);

  await app.init();

  // Reset database to ensure clean state
  // We use synchronize: true and dropSchema: true in AppModule for test env
  // so the database is reset automatically on connection.

  return app;
}
