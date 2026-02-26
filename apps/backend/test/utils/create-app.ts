import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/main';
import { DataSource } from 'typeorm';

export async function createTestApp(
  configureBuilder?: (builder: TestingModuleBuilder) => void
): Promise<INestApplication> {
  const builder = Test.createTestingModule({
    imports: [AppModule],
  });

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
