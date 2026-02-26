import 'reflect-metadata';
import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(__dirname, '../.env.test') });

// Mock IORedis globally to intercept BullMQ connections
jest.mock('ioredis', () => require('ioredis-mock'));

jest.setTimeout(30000);
