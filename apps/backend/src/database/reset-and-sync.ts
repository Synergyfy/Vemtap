import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { dataSourceOptions } from './data-source';

async function resetAndSync() {
  const ds = new DataSource({
    ...dataSourceOptions,
    synchronize: true, // Force sync for a clean reset
    dropSchema: false, // We drop it manually below
  } as any);

  await ds.initialize();

  console.log('Dropping schema...');
  await ds.query('DROP SCHEMA public CASCADE');
  await ds.query('CREATE SCHEMA public');
  await ds.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  console.log('Synchronizing entities...');
  await ds.synchronize();

  console.log('Database reset and schema synced from entities.');
  await ds.destroy();
}

resetAndSync().catch((e) => {
  console.error('Error during reset:', e);
  process.exit(1);
});
