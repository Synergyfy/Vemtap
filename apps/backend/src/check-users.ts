import { Client, QueryResult } from 'pg';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });

interface UserRow {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
}

async function check(): Promise<void> {
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  const result: QueryResult<UserRow> = await client.query(
    `SELECT "firstName", "lastName", email, role, status FROM users ORDER BY "createdAt" DESC LIMIT 10`,
  );
  console.log('\n=== Users in DB ===');
  result.rows.forEach((u: UserRow) => {
    console.log(
      `  [${u.role}] ${u.firstName} ${u.lastName} — ${u.email} (${u.status})`,
    );
  });
  console.log(`\nTotal: ${result.rowCount} rows shown`);
  await client.end();
  process.exit(0);
}
check().catch((e: Error) => {
  console.error(e.message);
  process.exit(1);
});
