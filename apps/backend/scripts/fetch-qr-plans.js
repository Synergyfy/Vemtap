const { Client } = require('pg');

async function main() {
  const connectionString = "postgresql://postgres:Nov52002%23@localhost:5432/qr-thrive?schema=public";
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected to QR Thrive database.');
    
    const res = await client.query('SELECT id, name FROM "Plan"');
    console.log('Plans found in QR Thrive:', JSON.stringify(res.rows, null, 2));
    
  } catch (err) {
    console.error('Error connecting to QR Thrive database:', err.message);
  } finally {
    await client.end();
  }
}

main();
