import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { join } from 'path';

const options = {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    entities: [join(process.cwd(), 'src/**/*.entity{.ts,.js}')],
    synchronize: true, // create schema from entities
};

async function resetAndSync() {
    const ds = new DataSource(options as any);
    await ds.initialize();

    await ds.query('DROP SCHEMA public CASCADE');
    await ds.query('CREATE SCHEMA public');
    await ds.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await ds.synchronize();
    console.log('Database reset and schema synced from entities.');
    await ds.destroy();
}

resetAndSync().catch((e) => {
    console.error(e);
    process.exit(1);
});
