import * as dotenv from 'dotenv';
import { join } from 'path';

console.log('Current Working Directory (process.cwd()):', process.cwd());
const targetPath = join(process.cwd(), '.env');
console.log('Target path (process.cwd() + .env):', targetPath);

dotenv.config({ path: targetPath });

console.log(
  'DB_PASSWORD env:',
  process.env.DB_PASSWORD ? 'DEFINED' : 'UNDEFINED',
);
if (process.env.DB_PASSWORD) {
  console.log('DB_PASSWORD length:', process.env.DB_PASSWORD.length);
}
