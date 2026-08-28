const { Client } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env';
dotenv.config({ path: path.join(__dirname, '../../', envFile) });
// Also fallback to root .env if DB_HOST not set
if (!process.env.DB_HOST) {
  dotenv.config({ path: path.join(__dirname, '../../.env') });
}

async function run() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  console.log(`Connecting to ${process.env.DB_HOST}...`);
  await client.connect();
  console.log('Connected to database.');

  console.log('1. Adding actionUrl to notifications table if not exists...');
  await client.query(`
    ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "actionUrl" character varying;
  `);

  console.log('2. Adding lastRenewalReminder columns to subscriptions table if not exists...');
  await client.query(`
    ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "lastRenewalReminderAt" TIMESTAMP;
    ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "lastRenewalReminderStage" integer;
  `);

  console.log('3. Creating notification_broadcasts table if not exists...');
  await client.query(`
    CREATE TABLE IF NOT EXISTS "notification_broadcasts" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
      "deletedAt" TIMESTAMP,
      "senderId" uuid,
      "title" character varying NOT NULL,
      "message" text NOT NULL,
      "targetAudience" character varying NOT NULL DEFAULT 'ALL',
      "type" character varying NOT NULL DEFAULT 'announcement',
      "actionUrl" character varying,
      "channels" text NOT NULL DEFAULT 'IN_APP,PUSH',
      "totalRecipients" integer NOT NULL DEFAULT 0,
      "pushRecipients" integer NOT NULL DEFAULT 0,
      "status" character varying NOT NULL DEFAULT 'SENT',
      "metadata" jsonb,
      CONSTRAINT "PK_notification_broadcasts" PRIMARY KEY ("id"),
      CONSTRAINT "FK_notification_broadcasts_sender" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE SET NULL
    );
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS "IDX_notification_broadcasts_targetAudience" ON "notification_broadcasts" ("targetAudience");
    CREATE INDEX IF NOT EXISTS "IDX_notification_broadcasts_createdAt" ON "notification_broadcasts" ("createdAt");
  `);

  console.log('4. Creating subscription_reminder_templates table if not exists...');
  await client.query(`
    CREATE TABLE IF NOT EXISTS "subscription_reminder_templates" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
      "deletedAt" TIMESTAMP,
      "stage" integer NOT NULL,
      "name" character varying NOT NULL,
      "description" text,
      "titleTemplate" character varying NOT NULL,
      "messageTemplate" text NOT NULL,
      "type" character varying NOT NULL DEFAULT 'warning',
      "actionUrl" character varying NOT NULL DEFAULT '/dashboard/settings/subscription',
      "isEnabled" boolean NOT NULL DEFAULT true,
      "sendPush" boolean NOT NULL DEFAULT true,
      "sendInApp" boolean NOT NULL DEFAULT true,
      "sendEmail" boolean NOT NULL DEFAULT false,
      "emailSubjectTemplate" character varying,
      "isDefault" boolean NOT NULL DEFAULT false,
      CONSTRAINT "PK_subscription_reminder_templates" PRIMARY KEY ("id"),
      CONSTRAINT "UQ_subscription_reminder_templates_stage" UNIQUE ("stage")
    );
  `);

  console.log('5. Seeding default reminder templates...');
  await client.query(`
    INSERT INTO "subscription_reminder_templates" (
      "stage", "name", "description", "titleTemplate", "messageTemplate", "type", "actionUrl", "isEnabled", "sendPush", "sendInApp", "sendEmail", "emailSubjectTemplate", "isDefault"
    ) VALUES
    (
      14,
      '14-Day Expiry Reminder',
      'Sent 14 days before subscription expires to nudge early renewal.',
      'Your deals in {{clusterName}} expire in {{daysLeft}} days',
      '{{people}} people checked deals in {{clusterName}} this month — renew now to stay visible to them.',
      'warning',
      '/dashboard/settings/subscription',
      true,
      true,
      true,
      false,
      'Your {{planName}} expires in {{daysLeft}} days',
      true
    ),
    (
      7,
      '7-Day Expiry Reminder',
      'Sent 7 days before subscription expires highlighting nearby active businesses.',
      'Your offers leave {{clusterName}} in {{daysLeft}} days',
      'Your offers will disappear from the {{clusterName}} feed in {{daysText}}. {{people}} shoppers browsed deals there this month — and {{businesses}} businesses are staying visible. Renew to keep showing up.',
      'warning',
      '/dashboard/settings/subscription',
      true,
      true,
      true,
      false,
      'Important: Your offers leave {{clusterName}} in {{daysLeft}} days',
      true
    ),
    (
      3,
      '3-Day Urgent Expiry Reminder',
      'Sent 3 days before subscription expires with urgent renewal CTA across push, in-app, and email.',
      'Last call: renew before {{clusterName}} expires',
      'In {{daysText}} your offers leave the {{clusterName}} deals feed while {{businesses}} nearby businesses reach {{people}} shoppers. Renew today.',
      'warning',
      '/dashboard/settings/subscription',
      true,
      true,
      true,
      true,
      'Urgent: {{businessName}} subscription expires in {{daysText}}',
      true
    ),
    (
      0,
      'Lapsed / Expired Subscription Reminder',
      'Sent when subscription has expired/lapsed notifying the business that their offers are no longer visible.',
      'Your offers left the {{clusterName}} deals feed',
      'Your plan expired, so customers in {{clusterName}} can no longer see your deals. {{businesses}} businesses there are reaching {{people}} shoppers. Renew to rejoin.',
      'error',
      '/dashboard/settings/subscription',
      true,
      true,
      true,
      true,
      'Your {{businessName}} offers have been removed from {{clusterName}}',
      true
    )
    ON CONFLICT ("stage") DO NOTHING;
  `);

  console.log('✅ Schema synchronization completed successfully!');
  await client.end();
}

run().catch((err) => {
  console.error('❌ Sync failed:', err);
  process.exit(1);
});
