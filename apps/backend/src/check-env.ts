import * as dotenv from 'dotenv';
import { join } from 'path';

const envFile = '../../.env';
console.log('__dirname:', __dirname);
const targetPath = join(__dirname, envFile);
console.log('Target path:', targetPath);

dotenv.config({ path: targetPath });

console.log('DB_PASSWORD env:', process.env.DB_PASSWORD ? 'DEFINED' : 'UNDEFINED');
if (process.env.DB_PASSWORD) {
    console.log('DB_PASSWORD length:', process.env.DB_PASSWORD.length);
}
