import dataSource from '../database/data-source';

async function run() {
  console.log('Initializing Data Source...');
  await dataSource.initialize();
  console.log('Running ALTER TABLE statements...');

  await dataSource.query(
    `ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "creditPriceAi" numeric(10,2) NOT NULL DEFAULT '50.00'`,
  );
  await dataSource.query(
    `ALTER TABLE "business_credit_wallets" ADD COLUMN IF NOT EXISTS "aiCredits" integer NOT NULL DEFAULT '0'`,
  );
  await dataSource.query(
    `ALTER TABLE "credit_plans" ADD COLUMN IF NOT EXISTS "aiAmount" integer NOT NULL DEFAULT '0'`,
  );

  console.log(
    'Successfully added missing columns: creditPriceAi, aiCredits, aiAmount!',
  );
  await dataSource.destroy();
  process.exit(0);
}

run().catch((err) => {
  console.error('Error running script:', err);
  process.exit(1);
});
