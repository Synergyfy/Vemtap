const { Client } = require('pg');
const client = new Client({
  user: 'postgres.duowxsphkrmvdquxukdu',
  host: 'aws-1-us-east-2.pooler.supabase.com',
  database: 'postgres',
  password: 'Vemtapng100',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});
client.connect().then(async () => {
  const res = await client.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('information_schema', 'pg_catalog')");
  console.log('Tables:', res.rows.map(r => `${r.table_schema}.${r.table_name}`));
  const constraints = await client.query("SELECT constraint_schema, constraint_name FROM information_schema.table_constraints WHERE constraint_schema NOT IN ('information_schema', 'pg_catalog')");
  console.log('Constraints:', constraints.rows.map(r => `${r.constraint_schema}.${r.constraint_name}`));
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
