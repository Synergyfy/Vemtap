import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBroadcastAndReminderTemplates1787200000000 implements MigrationInterface {
  name = 'AddBroadcastAndReminderTemplates1787200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 0. Ensure actionUrl column exists on notifications table
    await queryRunner.query(`
      ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "actionUrl" character varying;
    `);

    // 1. Create notification_broadcasts table
    await queryRunner.query(`
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
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_notification_broadcasts_targetAudience" ON "notification_broadcasts" ("targetAudience");
      CREATE INDEX IF NOT EXISTS "IDX_notification_broadcasts_createdAt" ON "notification_broadcasts" ("createdAt");
    `);

    // 2. Create subscription_reminder_templates table
    await queryRunner.query(`
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
      )
    `);

    // 3. Seed default templates
    await queryRunner.query(`
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "subscription_reminder_templates"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notification_broadcasts_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notification_broadcasts_targetAudience"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_broadcasts"`);
  }
}
