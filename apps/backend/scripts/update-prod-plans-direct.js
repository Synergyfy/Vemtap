const { Client } = require('pg');

async function main() {
  const connectionString = "postgresql://postgres.duowxsphkrmvdquxukdu:Vemtapng100@aws-1-us-east-2.pooler.supabase.com:5432/postgres";
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  
  try {
    await client.connect();
    console.log('Connected to Production database.');
    
    const mapping = [
      { name: 'Free plan', qrThriveId: '8bae20fd-b47a-479e-b461-7628db088fc9' },
      { name: 'Silver Plan', qrThriveId: '81a2ecf5-6f62-4ad9-947c-202b90dc027b' },
      { name: 'Gold Plan', qrThriveId: '81a2ecf5-6f62-4ad9-947c-202b90dc027b' },
      { name: 'Platinum Plan', qrThriveId: '81a2ecf5-6f62-4ad9-947c-202b90dc027b' },
      { name: 'Enterprise Plan', qrThriveId: '81a2ecf5-6f62-4ad9-947c-202b90dc027b' },
    ];

    for (const item of mapping) {
      const res = await client.query(
        'UPDATE plans SET "qrThrivePlanId" = $1 WHERE name = $2',
        [item.qrThriveId, item.name]
      );
      console.log(`Updated ${item.name}: ${res.rowCount} rows`);
    }
    
    const finalPlans = await client.query('SELECT id, name, "qrThrivePlanId" FROM plans');
    console.log('Final Production Plans:', JSON.stringify(finalPlans.rows, null, 2));
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

main();
