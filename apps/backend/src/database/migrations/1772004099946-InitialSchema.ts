import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1772004099946 implements MigrationInterface {
  name = 'InitialSchema1772004099946';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "product_types" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "description" character varying, "slug" character varying NOT NULL, CONSTRAINT "UQ_2b3bfea1c7797e9d067dfc3c7a0" UNIQUE ("name"), CONSTRAINT "UQ_3e8267a546afc4ce1967ba0ab96" UNIQUE ("slug"), CONSTRAINT "PK_6ad7b08e6491a02ebc9ed82019d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."products_status_enum" AS ENUM('Published', 'Unpublished')`,
    );
    await queryRunner.query(
      `CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "description" character varying NOT NULL, "price" numeric(10,2) NOT NULL, "images" text NOT NULL, "videos" text, "technicalSpecifications" jsonb, "customBrandedCards" boolean NOT NULL DEFAULT false, "tag" character varying NOT NULL, "tagColor" character varying, "rating" double precision NOT NULL DEFAULT '5', "moq" integer NOT NULL DEFAULT '1', "priceTiers" jsonb, "requestQuoteThreshold" integer, "productTypeId" uuid, "status" "public"."products_status_enum" NOT NULL DEFAULT 'Published', CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."quote_negotiations_offeredby_enum" AS ENUM('Admin', 'Owner')`,
    );
    await queryRunner.query(
      `CREATE TABLE "quote_negotiations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "quoteId" uuid NOT NULL, "priceOffered" numeric(10,2) NOT NULL, "message" character varying, "offeredBy" "public"."quote_negotiations_offeredby_enum" NOT NULL, "userId" uuid, CONSTRAINT "PK_ea445924cada5fd632e11911309" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."quotes_status_enum" AS ENUM('Pending', 'Admin_Offered', 'Owner_Offered', 'Accepted', 'Rejected', 'Processed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "quotes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "quantity" integer NOT NULL, "location" character varying NOT NULL, "businessName" character varying NOT NULL, "notes" character varying NOT NULL, "status" "public"."quotes_status_enum" NOT NULL DEFAULT 'Pending', "userId" uuid, "productId" uuid NOT NULL, "currentPrice" numeric(10,2), "isNegotiable" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_99a0e8bcbcd8719d3a41f23c263" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."orders_status_enum" AS ENUM('Pending', 'Ready', 'Completed')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."orders_paymentstatus_enum" AS ENUM('Pending', 'Paid', 'Failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "quoteId" uuid, "productId" uuid, "quantity" integer, "unitPrice" numeric(10,2), "totalPrice" numeric(10,2), "agreedPrice" numeric(10,2), "status" "public"."orders_status_enum" NOT NULL DEFAULT 'Pending', "paymentStatus" "public"."orders_paymentstatus_enum" NOT NULL DEFAULT 'Pending', "paymentReference" character varying, "userId" uuid, CONSTRAINT "REL_95a206b8b8cafbd842d39aba6c" UNIQUE ("quoteId"), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."campaigns_type_enum" AS ENUM('WhatsApp', 'SMS', 'Email')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."campaigns_status_enum" AS ENUM('Active', 'Scheduled', 'Recurring', 'Draft', 'Completed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "campaigns" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "type" "public"."campaigns_type_enum" NOT NULL DEFAULT 'WhatsApp', "audience" character varying NOT NULL, "message" text NOT NULL, "scheduledFor" TIMESTAMP, "status" "public"."campaigns_status_enum" NOT NULL DEFAULT 'Draft', "sent" integer NOT NULL DEFAULT '0', "delivered" character varying NOT NULL DEFAULT '0%', "clicks" integer NOT NULL DEFAULT '0', "branchId" uuid NOT NULL, CONSTRAINT "PK_831e3fcd4fc45b4e4c3f57a9ee4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."message_templates_channel_enum" AS ENUM('SMS', 'WHATSAPP', 'EMAIL')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."message_templates_status_enum" AS ENUM('pending', 'approved', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."message_templates_category_enum" AS ENUM('MARKETING', 'UTILITY', 'AUTHENTICATION')`,
    );
    await queryRunner.query(
      `CREATE TABLE "message_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "businessId" uuid NOT NULL, "channel" "public"."message_templates_channel_enum" NOT NULL, "name" character varying NOT NULL, "content" text NOT NULL, "status" "public"."message_templates_status_enum" NOT NULL DEFAULT 'pending', "category" "public"."message_templates_category_enum" NOT NULL DEFAULT 'MARKETING', "language" character varying NOT NULL DEFAULT 'English (US)', CONSTRAINT "UQ_46169ec413a139c2b9866e28aa4" UNIQUE ("businessId", "name", "channel"), CONSTRAINT "PK_9ac2bd9635be662d183f314947d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."message_campaigns_channel_enum" AS ENUM('SMS', 'WHATSAPP', 'EMAIL')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."message_campaigns_audiencetype_enum" AS ENUM('ALL', 'GROUP', 'TAGGED', 'RECENT')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."message_campaigns_status_enum" AS ENUM('DRAFT', 'PROCESSING', 'SENT', 'FAILED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "message_campaigns" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "branchId" uuid NOT NULL, "name" character varying NOT NULL, "channel" "public"."message_campaigns_channel_enum" NOT NULL, "audienceType" "public"."message_campaigns_audiencetype_enum" NOT NULL, "audienceSize" integer NOT NULL DEFAULT '0', "templateId" uuid, "content" text, "estimatedCost" numeric(10,4) NOT NULL DEFAULT '0', "actualCost" numeric(10,4), "status" "public"."message_campaigns_status_enum" NOT NULL DEFAULT 'DRAFT', "sentAt" TIMESTAMP, "metrics" jsonb, CONSTRAINT "PK_183946228582c5f18c02f7b6775" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "branches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "address" character varying, "phone" character varying, "isActive" boolean NOT NULL DEFAULT true, "businessId" uuid NOT NULL, CONSTRAINT "PK_7f37d3b42defea97f1df0d19535" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."devices_status_enum" AS ENUM('active', 'inactive')`,
    );
    await queryRunner.query(
      `CREATE TABLE "devices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "code" character varying NOT NULL, "status" "public"."devices_status_enum" NOT NULL DEFAULT 'active', "location" character varying, "totalScans" integer NOT NULL DEFAULT '0', "type" character varying NOT NULL DEFAULT 'Card', "batteryLevel" integer NOT NULL DEFAULT '100', "lastActive" TIMESTAMP, "businessId" uuid, "orderId" uuid, "branchId" uuid, "productTypeId" uuid, CONSTRAINT "UQ_8e5789338ecd743536cf10ca995" UNIQUE ("code"), CONSTRAINT "PK_b1514758245c12daf43486dd1f0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."businesses_type_enum" AS ENUM('RESTAURANT', 'RETAIL', 'GYM', 'EVENT', 'LOGISTICS', 'BEAUTY_WELLNESS')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."businesses_status_enum" AS ENUM('active', 'pending', 'suspended')`,
    );
    await queryRunner.query(
      `CREATE TABLE "businesses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "type" "public"."businesses_type_enum" NOT NULL DEFAULT 'RETAIL', "status" "public"."businesses_status_enum" NOT NULL DEFAULT 'pending', "suspensionReason" character varying, "suspendedAt" TIMESTAMP, "balance" numeric(10,2) NOT NULL DEFAULT '0', "documents" text, "category" character varying, "monthlyVisitors" character varying, "goal" character varying, "logoUrl" character varying, "address" character varying, "website" character varying, "whatsappNumber" character varying, "officialEmail" character varying, "welcomeMessage" text, "successMessage" text, "privacyMessage" text, "rewardMessage" text, "rewardEnabled" boolean NOT NULL DEFAULT false, "rewardVisitThreshold" integer NOT NULL DEFAULT '5', "linkedinUrl" character varying, "reviewUrl" character varying, "showReview" boolean NOT NULL DEFAULT true, "showSocial" boolean NOT NULL DEFAULT true, "showFeedback" boolean NOT NULL DEFAULT true, "ownerId" uuid NOT NULL, CONSTRAINT "REL_02e7bfb8e766e8e0ef449cc0f3" UNIQUE ("ownerId"), CONSTRAINT "PK_bc1bf63498dd2368ce3dc8686e8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "userId" uuid NOT NULL, "title" character varying NOT NULL, "message" character varying NOT NULL, "type" character varying NOT NULL DEFAULT 'info', "isRead" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('Owner', 'Manager', 'Staff', 'Admin', 'Customer')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_status_enum" AS ENUM('Active', 'Inactive', 'Invited', 'Pending', 'Suspended')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "email" character varying NOT NULL, "password" character varying NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'Customer', "phone" character varying, "jobTitle" character varying, "permissions" text, "status" "public"."users_status_enum" NOT NULL DEFAULT 'Invited', "lastActive" TIMESTAMP, "businessId" uuid, "branchId" uuid, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "visits" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "customerId" uuid NOT NULL, "businessId" uuid, "branchId" uuid NOT NULL, "deviceId" uuid, "status" character varying NOT NULL DEFAULT 'new', CONSTRAINT "PK_0b0b322289a41015c6ea4e8bf30" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."surveys_triggertype_enum" AS ENUM('INSTANT', 'DELAYED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "surveys" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "questions" jsonb NOT NULL DEFAULT '[]', "triggerType" "public"."surveys_triggertype_enum" NOT NULL DEFAULT 'INSTANT', "triggerDelay" integer, "targetAudience" jsonb NOT NULL DEFAULT '{"new":true,"returning":true}', "isActive" boolean NOT NULL DEFAULT true, "businessId" uuid NOT NULL, CONSTRAINT "REL_c8b08348006a523cf8867b8d0f" UNIQUE ("businessId"), CONSTRAINT "PK_1b5e3d4aaeb2321ffa98498c971" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."support_tickets_status_enum" AS ENUM('Open', 'In Progress', 'Closed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "support_tickets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "subject" character varying NOT NULL, "category" character varying NOT NULL, "status" "public"."support_tickets_status_enum" NOT NULL DEFAULT 'Open', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_942e8d8f5df86100471d2324643" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "ticket_messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ticketId" uuid NOT NULL, "senderId" uuid NOT NULL, "message" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_37beb692dedf7eccb4e519ccec1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "monthlyPrice" numeric(10,2) NOT NULL DEFAULT '0', "quarterlyPrice" numeric(10,2) NOT NULL DEFAULT '0', "yearlyPrice" numeric(10,2) NOT NULL DEFAULT '0', "currency" character varying NOT NULL DEFAULT 'NGN', "isFree" boolean NOT NULL DEFAULT false, "trialDurationDays" integer NOT NULL DEFAULT '30', "features" text array NOT NULL DEFAULT '{}', "smsCredits" integer NOT NULL DEFAULT '0', "emailCredits" integer NOT NULL DEFAULT '0', "whatsappCredits" integer NOT NULL DEFAULT '0', "teamMembersLimit" integer, "loyaltyLimit" integer, "tagsLimit" integer, "branchLimit" integer NOT NULL DEFAULT '1', "analyticsLevel" character varying NOT NULL DEFAULT 'basic', "isActive" boolean NOT NULL DEFAULT true, "description" text, "isPopular" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_3720521a81c7c24fe9b7202ba61" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscriptions_billingperiod_enum" AS ENUM('monthly', 'quarterly', 'yearly')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscriptions_status_enum" AS ENUM('active', 'canceled', 'expired', 'trial')`,
    );
    await queryRunner.query(
      `CREATE TABLE "subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "businessId" uuid NOT NULL, "planId" uuid NOT NULL, "billingPeriod" "public"."subscriptions_billingperiod_enum" NOT NULL, "startDate" TIMESTAMP NOT NULL, "endDate" TIMESTAMP NOT NULL, "trialEndDate" TIMESTAMP, "status" "public"."subscriptions_status_enum" NOT NULL DEFAULT 'active', "paystackReference" character varying, "paystackAuthorizationCode" text, CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "platformName" character varying NOT NULL DEFAULT 'VemTap', "supportEmail" character varying NOT NULL DEFAULT 'support@VemTap.com', "defaultCurrency" character varying NOT NULL DEFAULT 'NGN', "timezone" character varying NOT NULL DEFAULT 'Africa/Lagos', "enforce2FA" boolean NOT NULL DEFAULT true, "passwordExpiry" boolean NOT NULL DEFAULT false, "messagingCostSms" numeric(10,2) NOT NULL DEFAULT '0.05', "messagingCostWhatsapp" numeric(10,2) NOT NULL DEFAULT '0.08', "messagingCostEmail" numeric(10,2) NOT NULL DEFAULT '0.01', CONSTRAINT "PK_0669fe20e252eb692bf4d344975" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_status_enum" AS ENUM('Pending', 'Success', 'Failed')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_purpose_enum" AS ENUM('Order', 'Subscription', 'Credit Topup')`,
    );
    await queryRunner.query(
      `CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "reference" character varying NOT NULL, "amount" numeric(10,2) NOT NULL, "currency" character varying NOT NULL DEFAULT 'NGN', "status" "public"."payments_status_enum" NOT NULL DEFAULT 'Pending', "purpose" "public"."payments_purpose_enum" NOT NULL, "metadata" jsonb, "userId" character varying, "businessId" character varying, CONSTRAINT "UQ_866ddee0e17d9385b4e3b86851d" UNIQUE ("reference"), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."conversation_threads_channel_enum" AS ENUM('SMS', 'WHATSAPP', 'EMAIL')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."conversation_threads_status_enum" AS ENUM('OPEN', 'CLOSED', 'RESOLVED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "conversation_threads" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "businessId" uuid NOT NULL, "branchId" uuid NOT NULL, "contactId" uuid NOT NULL, "channel" "public"."conversation_threads_channel_enum" NOT NULL, "lastActivityAt" TIMESTAMP NOT NULL DEFAULT now(), "status" "public"."conversation_threads_status_enum" NOT NULL DEFAULT 'OPEN', "notes" jsonb, CONSTRAINT "UQ_a2e43b7432b4a2b88cc6e776e54" UNIQUE ("branchId", "contactId", "channel"), CONSTRAINT "PK_3ce0e3590f31e205ac457655de3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "contacts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "businessId" uuid NOT NULL, "phone" character varying, "email" character varying, "name" character varying, "optInChannels" text NOT NULL DEFAULT '["SMS","WHATSAPP","EMAIL"]', "optOut" boolean NOT NULL DEFAULT false, "tags" text, CONSTRAINT "PK_b99cd40cfd66a99f1571f4f72e6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."messages_channel_enum" AS ENUM('SMS', 'WHATSAPP', 'EMAIL')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."messages_direction_enum" AS ENUM('INBOUND', 'OUTBOUND')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."messages_status_enum" AS ENUM('PENDING', 'QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'READ', 'REJECTED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "businessId" uuid NOT NULL, "branchId" uuid, "channel" "public"."messages_channel_enum" NOT NULL, "contactId" uuid, "threadId" uuid, "campaignId" uuid, "direction" "public"."messages_direction_enum" NOT NULL, "content" text NOT NULL, "status" "public"."messages_status_enum" NOT NULL DEFAULT 'PENDING', "providerMessageId" character varying, "cost" numeric(10,2), "timestamp" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."message_logs_channel_enum" AS ENUM('SMS', 'WHATSAPP', 'EMAIL')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."message_logs_direction_enum" AS ENUM('INBOUND', 'OUTBOUND')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."message_logs_status_enum" AS ENUM('PENDING', 'QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'READ', 'REJECTED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "message_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "businessId" uuid, "branchId" uuid, "contactId" character varying, "campaignId" character varying, "messageId" character varying, "channel" "public"."message_logs_channel_enum" NOT NULL, "direction" "public"."message_logs_direction_enum" NOT NULL, "status" "public"."message_logs_status_enum" NOT NULL, "errorReason" character varying, "timestamp" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f0aae0d876a96fa1da0a1b97444" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."flow_executions_status_enum" AS ENUM('pending', 'running', 'waiting', 'completed', 'failed', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "flow_executions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "flowId" uuid NOT NULL, "contactId" uuid NOT NULL, "businessId" uuid NOT NULL, "branchId" uuid, "currentNodeId" character varying, "state" jsonb NOT NULL DEFAULT '{}', "status" "public"."flow_executions_status_enum" NOT NULL DEFAULT 'pending', "lastMessageId" character varying, "completedAt" TIMESTAMP, "nextRunAt" TIMESTAMP, CONSTRAINT "PK_3f6404db5c4ffc05cc0564fbe8d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."flows_status_enum" AS ENUM('draft', 'active', 'paused')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."flows_triggertype_enum" AS ENUM('new_visitor', 'manual', 'tag_applied', 'birthday', 'loyalty_milestone')`,
    );
    await queryRunner.query(
      `CREATE TABLE "flows" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "businessId" uuid NOT NULL, "branchId" uuid, "name" character varying NOT NULL, "status" "public"."flows_status_enum" NOT NULL DEFAULT 'draft', "triggerType" "public"."flows_triggertype_enum" NOT NULL, "structure" jsonb NOT NULL DEFAULT '{"nodes":[],"edges":[]}', CONSTRAINT "PK_c346955f4318ef565e6928462fe" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "credit_plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "description" text, "price" numeric(10,2) NOT NULL, "currency" character varying NOT NULL DEFAULT 'NGN', "smsAmount" integer NOT NULL DEFAULT '0', "emailAmount" integer NOT NULL DEFAULT '0', "whatsappAmount" integer NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_89a6b83ffa0d39285e9214c4fc0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "business_credits" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "businessId" uuid NOT NULL, "smsBalance" integer NOT NULL DEFAULT '0', "emailBalance" integer NOT NULL DEFAULT '0', "whatsappBalance" integer NOT NULL DEFAULT '0', CONSTRAINT "REL_f11168a7a26a635338f6aa2135" UNIQUE ("businessId"), CONSTRAINT "PK_2dff99ec3d861e0d8cb95d18a89" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."automation_rules_triggertype_enum" AS ENUM('first_tag', 'repeat_tag', 'reward_earned', 'survey_completed')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."automation_rules_actiontype_enum" AS ENUM('send_sms', 'send_whatsapp', 'send_email', 'push_review')`,
    );
    await queryRunner.query(
      `CREATE TABLE "automation_rules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "businessId" uuid NOT NULL, "branchId" uuid, "name" character varying NOT NULL, "triggerType" "public"."automation_rules_triggertype_enum" NOT NULL, "delaySeconds" integer DEFAULT '0', "actionType" "public"."automation_rules_actiontype_enum" NOT NULL, "actionConfig" jsonb NOT NULL DEFAULT '{}', "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_378bed501eacc036895837121c2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "automation_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "ruleId" uuid NOT NULL, "contactId" character varying, "status" character varying, "errorReason" character varying, "executedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c62c5adfa217facbc2838bd6c99" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "rewards" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "businessId" uuid, "branchId" uuid, "name" character varying NOT NULL, "description" text, "rewardType" character varying NOT NULL DEFAULT 'free_item', "pointCost" integer NOT NULL, "value" numeric(10,2) NOT NULL DEFAULT '0', "validityDays" integer NOT NULL DEFAULT '30', "usageLimitPerUser" integer NOT NULL DEFAULT '1', "totalRedeemed" integer NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, "imageUrl" character varying, CONSTRAINT "PK_3d947441a48debeb9b7366f8b8c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "point_transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "loyaltyProfileId" uuid NOT NULL, "transactionType" character varying NOT NULL, "pointsAmount" integer NOT NULL, "reason" character varying NOT NULL, "referenceId" character varying, "metadata" jsonb, "expiresAt" TIMESTAMP, CONSTRAINT "PK_ceb5185b63f070e23d65509b0a7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "loyalty_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "userId" uuid NOT NULL, "businessId" uuid, "branchId" uuid, "totalPointsEarned" integer NOT NULL DEFAULT '0', "currentPointsBalance" integer NOT NULL DEFAULT '0', "pointsRedeemed" integer NOT NULL DEFAULT '0', "tierLevel" character varying NOT NULL DEFAULT 'bronze', "lastVisitDate" TIMESTAMP, "lastRewardedAt" TIMESTAMP, CONSTRAINT "PK_f9cd740bcd5eae4d8160594c040" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e511eec2dd0a93192bdfdcd4de" ON "loyalty_profiles" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_73106f06fac64eaded06516a3a" ON "loyalty_profiles" ("businessId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_80d0596c9acaf40cf1ba7175ae" ON "loyalty_profiles" ("branchId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "redemptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "loyaltyProfileId" uuid NOT NULL, "rewardId" uuid NOT NULL, "redemptionCode" character varying NOT NULL, "pointsSpent" integer NOT NULL, "status" character varying NOT NULL DEFAULT 'pending', "branchId" uuid, "redeemedAt" TIMESTAMP NOT NULL DEFAULT now(), "verifiedAt" TIMESTAMP, "verifiedByUserId" character varying, "expiresAt" TIMESTAMP NOT NULL, CONSTRAINT "UQ_6e08df45598501197c90afb6e52" UNIQUE ("redemptionCode"), CONSTRAINT "PK_def143ab94376fea5985bb04219" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0585b16421a6e388dcf5bb5319" ON "redemptions" ("branchId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "loyalty_rules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "branchId" uuid NOT NULL, "ruleType" character varying NOT NULL DEFAULT 'hybrid', "isActive" boolean NOT NULL DEFAULT true, "spendingBaseAmount" integer NOT NULL DEFAULT '10', "spendingBasePoints" integer NOT NULL DEFAULT '1', "visitPoints" integer NOT NULL DEFAULT '50', "visitCooldownHours" integer NOT NULL DEFAULT '24', "firstVisitBonus" integer NOT NULL DEFAULT '100', "birthdayBonus" integer NOT NULL DEFAULT '500', "referralBonus" integer NOT NULL DEFAULT '200', CONSTRAINT "PK_94cb1aeb0c0ac95c2e9bbcdbd11" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "campaign_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "title" character varying NOT NULL, "category" character varying NOT NULL, "type" character varying NOT NULL, "content" text NOT NULL, "textColor" character varying, "branchId" uuid, CONSTRAINT "PK_ca50726582efebc779f5cccd389" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "otps" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "email" character varying NOT NULL, "code" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "metadata" jsonb, "isVerified" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_91fef5ed60605b854a2115d2410" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_fed065ae1a8b80a37a9230da1fa" FOREIGN KEY ("productTypeId") REFERENCES "product_types"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quote_negotiations" ADD CONSTRAINT "FK_a31b6d23f84fba6864543eaa562" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quote_negotiations" ADD CONSTRAINT "FK_b70842c1a1b49cea8b40efc6393" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quotes" ADD CONSTRAINT "FK_8bad8bd49d1dd6954b46366349c" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quotes" ADD CONSTRAINT "FK_0434dd944045bb895f042b8e1c9" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_95a206b8b8cafbd842d39aba6cf" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_8624dad595ae567818ad9983b33" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_151b79a83ba240b0cb31b2302d1" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" ADD CONSTRAINT "FK_4b66fabc3b7ca8d3ba55c2c1099" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_templates" ADD CONSTRAINT "FK_287b0bb37bfab02d52698eea64b" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_campaigns" ADD CONSTRAINT "FK_c233f0f1eac93f99f03ce612b7d" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_campaigns" ADD CONSTRAINT "FK_3c04a8d62ced12a0a32c717ab26" FOREIGN KEY ("templateId") REFERENCES "message_templates"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" ADD CONSTRAINT "FK_b874e5030fa1d52bc338dae8925" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "devices" ADD CONSTRAINT "FK_3120dad6f15b9eb17b57deee7a6" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "devices" ADD CONSTRAINT "FK_d37057046d97dfbff10c95ce14d" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "devices" ADD CONSTRAINT "FK_0b06457274d1f798765e0f54894" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "devices" ADD CONSTRAINT "FK_43ea527751871d9392b257a85f6" FOREIGN KEY ("productTypeId") REFERENCES "product_types"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD CONSTRAINT "FK_02e7bfb8e766e8e0ef449cc0f36" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_692a909ee0fa9383e7859f9b406" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_78725ac7117e7526e028014606b" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_246426dfd001466a1d5e47322f4" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" ADD CONSTRAINT "FK_75f05529507320445c79ac9b33e" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" ADD CONSTRAINT "FK_9d57ca3caedfa1a13cc4f799a62" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" ADD CONSTRAINT "FK_27ac2b146f315a2a56c9aa932b9" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" ADD CONSTRAINT "FK_78adb0c8665c50789286fb0087f" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "surveys" ADD CONSTRAINT "FK_c8b08348006a523cf8867b8d0f4" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_tickets" ADD CONSTRAINT "FK_8679e2ff150ff0e253189ca0253" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_messages" ADD CONSTRAINT "FK_b01e2a35417efbe04c10828266f" FOREIGN KEY ("ticketId") REFERENCES "support_tickets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_messages" ADD CONSTRAINT "FK_ddea80824c24d270ef2cb4cb0ba" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_7e9f8a764f844a37dc4a968494a" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_7536cba909dd7584a4640cad7d5" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" ADD CONSTRAINT "FK_182cffea6be89d674dae3c6431f" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" ADD CONSTRAINT "FK_44a6f5f86b7700a3ea88223e1a9" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" ADD CONSTRAINT "FK_eb40ce34ada4dbd69f44344a1d7" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts" ADD CONSTRAINT "FK_d0bcfd4756ee3dc38a0c252b2e2" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_2234441aac965d27bd93edb33d6" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_cab4c83e89008ff0f36131abe9d" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_435f12bd11014722a707a292763" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_15f9bd2bf472ff12b6ee20012d0" FOREIGN KEY ("threadId") REFERENCES "conversation_threads"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_621cca3fc837c781bd415fdf49e" FOREIGN KEY ("campaignId") REFERENCES "message_campaigns"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_logs" ADD CONSTRAINT "FK_6cd8838fbb238db1495c608464d" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_logs" ADD CONSTRAINT "FK_ed060aa8f4e76711996b1a06c13" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_executions" ADD CONSTRAINT "FK_bca57ea8523d9610d1b6ee80d0d" FOREIGN KEY ("flowId") REFERENCES "flows"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_executions" ADD CONSTRAINT "FK_9b9d04d4c1921cd1a10afc83d3e" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_executions" ADD CONSTRAINT "FK_7d660298759f3645a33f8c2a5f8" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_executions" ADD CONSTRAINT "FK_70981b882106ff89d7f2eb9aab3" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "flows" ADD CONSTRAINT "FK_3da537da5efbca752e2a30914b1" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "flows" ADD CONSTRAINT "FK_9e287b2ba144aaf44c0c2adffcf" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_credits" ADD CONSTRAINT "FK_f11168a7a26a635338f6aa21350" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "automation_rules" ADD CONSTRAINT "FK_e1e14056207167432227f0eac8f" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "automation_rules" ADD CONSTRAINT "FK_194687193adfc87754348ef4265" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "automation_logs" ADD CONSTRAINT "FK_a1a5b920c1214634ac827607d00" FOREIGN KEY ("ruleId") REFERENCES "automation_rules"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "rewards" ADD CONSTRAINT "FK_fef5462e98502631a6af0289495" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "rewards" ADD CONSTRAINT "FK_0253c100f3699f97fc2ed8b34c0" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_transactions" ADD CONSTRAINT "FK_36d9f26ca7a5abe7d8ac436a4c9" FOREIGN KEY ("loyaltyProfileId") REFERENCES "loyalty_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" ADD CONSTRAINT "FK_e511eec2dd0a93192bdfdcd4de2" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" ADD CONSTRAINT "FK_73106f06fac64eaded06516a3a4" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" ADD CONSTRAINT "FK_80d0596c9acaf40cf1ba7175aed" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "redemptions" ADD CONSTRAINT "FK_0585b16421a6e388dcf5bb5319e" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "redemptions" ADD CONSTRAINT "FK_ddb9c853d8602bea573b46334b1" FOREIGN KEY ("loyaltyProfileId") REFERENCES "loyalty_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "redemptions" ADD CONSTRAINT "FK_ffd3fb3e7583a259ce2beecd15a" FOREIGN KEY ("rewardId") REFERENCES "rewards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_rules" ADD CONSTRAINT "FK_da0940a87735e5dd87eed2a2eb9" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaign_templates" ADD CONSTRAINT "FK_59cade5e45d1c1f43c938581238" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "campaign_templates" DROP CONSTRAINT "FK_59cade5e45d1c1f43c938581238"`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_rules" DROP CONSTRAINT "FK_da0940a87735e5dd87eed2a2eb9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "redemptions" DROP CONSTRAINT "FK_ffd3fb3e7583a259ce2beecd15a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "redemptions" DROP CONSTRAINT "FK_ddb9c853d8602bea573b46334b1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "redemptions" DROP CONSTRAINT "FK_0585b16421a6e388dcf5bb5319e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" DROP CONSTRAINT "FK_80d0596c9acaf40cf1ba7175aed"`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" DROP CONSTRAINT "FK_73106f06fac64eaded06516a3a4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "loyalty_profiles" DROP CONSTRAINT "FK_e511eec2dd0a93192bdfdcd4de2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_transactions" DROP CONSTRAINT "FK_36d9f26ca7a5abe7d8ac436a4c9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rewards" DROP CONSTRAINT "FK_0253c100f3699f97fc2ed8b34c0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rewards" DROP CONSTRAINT "FK_fef5462e98502631a6af0289495"`,
    );
    await queryRunner.query(
      `ALTER TABLE "automation_logs" DROP CONSTRAINT "FK_a1a5b920c1214634ac827607d00"`,
    );
    await queryRunner.query(
      `ALTER TABLE "automation_rules" DROP CONSTRAINT "FK_194687193adfc87754348ef4265"`,
    );
    await queryRunner.query(
      `ALTER TABLE "automation_rules" DROP CONSTRAINT "FK_e1e14056207167432227f0eac8f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_credits" DROP CONSTRAINT "FK_f11168a7a26a635338f6aa21350"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flows" DROP CONSTRAINT "FK_9e287b2ba144aaf44c0c2adffcf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flows" DROP CONSTRAINT "FK_3da537da5efbca752e2a30914b1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_executions" DROP CONSTRAINT "FK_70981b882106ff89d7f2eb9aab3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_executions" DROP CONSTRAINT "FK_7d660298759f3645a33f8c2a5f8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_executions" DROP CONSTRAINT "FK_9b9d04d4c1921cd1a10afc83d3e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_executions" DROP CONSTRAINT "FK_bca57ea8523d9610d1b6ee80d0d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_logs" DROP CONSTRAINT "FK_ed060aa8f4e76711996b1a06c13"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_logs" DROP CONSTRAINT "FK_6cd8838fbb238db1495c608464d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_621cca3fc837c781bd415fdf49e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_15f9bd2bf472ff12b6ee20012d0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_435f12bd11014722a707a292763"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_cab4c83e89008ff0f36131abe9d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_2234441aac965d27bd93edb33d6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts" DROP CONSTRAINT "FK_d0bcfd4756ee3dc38a0c252b2e2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" DROP CONSTRAINT "FK_eb40ce34ada4dbd69f44344a1d7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" DROP CONSTRAINT "FK_44a6f5f86b7700a3ea88223e1a9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_threads" DROP CONSTRAINT "FK_182cffea6be89d674dae3c6431f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_7536cba909dd7584a4640cad7d5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_7e9f8a764f844a37dc4a968494a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_messages" DROP CONSTRAINT "FK_ddea80824c24d270ef2cb4cb0ba"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_messages" DROP CONSTRAINT "FK_b01e2a35417efbe04c10828266f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_tickets" DROP CONSTRAINT "FK_8679e2ff150ff0e253189ca0253"`,
    );
    await queryRunner.query(
      `ALTER TABLE "surveys" DROP CONSTRAINT "FK_c8b08348006a523cf8867b8d0f4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" DROP CONSTRAINT "FK_78adb0c8665c50789286fb0087f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" DROP CONSTRAINT "FK_27ac2b146f315a2a56c9aa932b9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" DROP CONSTRAINT "FK_9d57ca3caedfa1a13cc4f799a62"`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" DROP CONSTRAINT "FK_75f05529507320445c79ac9b33e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_246426dfd001466a1d5e47322f4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_78725ac7117e7526e028014606b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_692a909ee0fa9383e7859f9b406"`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP CONSTRAINT "FK_02e7bfb8e766e8e0ef449cc0f36"`,
    );
    await queryRunner.query(
      `ALTER TABLE "devices" DROP CONSTRAINT "FK_43ea527751871d9392b257a85f6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "devices" DROP CONSTRAINT "FK_0b06457274d1f798765e0f54894"`,
    );
    await queryRunner.query(
      `ALTER TABLE "devices" DROP CONSTRAINT "FK_d37057046d97dfbff10c95ce14d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "devices" DROP CONSTRAINT "FK_3120dad6f15b9eb17b57deee7a6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" DROP CONSTRAINT "FK_b874e5030fa1d52bc338dae8925"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_campaigns" DROP CONSTRAINT "FK_3c04a8d62ced12a0a32c717ab26"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_campaigns" DROP CONSTRAINT "FK_c233f0f1eac93f99f03ce612b7d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_templates" DROP CONSTRAINT "FK_287b0bb37bfab02d52698eea64b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" DROP CONSTRAINT "FK_4b66fabc3b7ca8d3ba55c2c1099"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_151b79a83ba240b0cb31b2302d1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_8624dad595ae567818ad9983b33"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_95a206b8b8cafbd842d39aba6cf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quotes" DROP CONSTRAINT "FK_0434dd944045bb895f042b8e1c9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quotes" DROP CONSTRAINT "FK_8bad8bd49d1dd6954b46366349c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quote_negotiations" DROP CONSTRAINT "FK_b70842c1a1b49cea8b40efc6393"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quote_negotiations" DROP CONSTRAINT "FK_a31b6d23f84fba6864543eaa562"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_fed065ae1a8b80a37a9230da1fa"`,
    );
    await queryRunner.query(`DROP TABLE "otps"`);
    await queryRunner.query(`DROP TABLE "campaign_templates"`);
    await queryRunner.query(`DROP TABLE "loyalty_rules"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0585b16421a6e388dcf5bb5319"`,
    );
    await queryRunner.query(`DROP TABLE "redemptions"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_80d0596c9acaf40cf1ba7175ae"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_73106f06fac64eaded06516a3a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e511eec2dd0a93192bdfdcd4de"`,
    );
    await queryRunner.query(`DROP TABLE "loyalty_profiles"`);
    await queryRunner.query(`DROP TABLE "point_transactions"`);
    await queryRunner.query(`DROP TABLE "rewards"`);
    await queryRunner.query(`DROP TABLE "automation_logs"`);
    await queryRunner.query(`DROP TABLE "automation_rules"`);
    await queryRunner.query(
      `DROP TYPE "public"."automation_rules_actiontype_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."automation_rules_triggertype_enum"`,
    );
    await queryRunner.query(`DROP TABLE "business_credits"`);
    await queryRunner.query(`DROP TABLE "credit_plans"`);
    await queryRunner.query(`DROP TABLE "flows"`);
    await queryRunner.query(`DROP TYPE "public"."flows_triggertype_enum"`);
    await queryRunner.query(`DROP TYPE "public"."flows_status_enum"`);
    await queryRunner.query(`DROP TABLE "flow_executions"`);
    await queryRunner.query(`DROP TYPE "public"."flow_executions_status_enum"`);
    await queryRunner.query(`DROP TABLE "message_logs"`);
    await queryRunner.query(`DROP TYPE "public"."message_logs_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."message_logs_direction_enum"`);
    await queryRunner.query(`DROP TYPE "public"."message_logs_channel_enum"`);
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(`DROP TYPE "public"."messages_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."messages_direction_enum"`);
    await queryRunner.query(`DROP TYPE "public"."messages_channel_enum"`);
    await queryRunner.query(`DROP TABLE "contacts"`);
    await queryRunner.query(`DROP TABLE "conversation_threads"`);
    await queryRunner.query(
      `DROP TYPE "public"."conversation_threads_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."conversation_threads_channel_enum"`,
    );
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TYPE "public"."payments_purpose_enum"`);
    await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
    await queryRunner.query(`DROP TABLE "settings"`);
    await queryRunner.query(`DROP TABLE "subscriptions"`);
    await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."subscriptions_billingperiod_enum"`,
    );
    await queryRunner.query(`DROP TABLE "plans"`);
    await queryRunner.query(`DROP TABLE "ticket_messages"`);
    await queryRunner.query(`DROP TABLE "support_tickets"`);
    await queryRunner.query(`DROP TYPE "public"."support_tickets_status_enum"`);
    await queryRunner.query(`DROP TABLE "surveys"`);
    await queryRunner.query(`DROP TYPE "public"."surveys_triggertype_enum"`);
    await queryRunner.query(`DROP TABLE "visits"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TABLE "businesses"`);
    await queryRunner.query(`DROP TYPE "public"."businesses_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."businesses_type_enum"`);
    await queryRunner.query(`DROP TABLE "devices"`);
    await queryRunner.query(`DROP TYPE "public"."devices_status_enum"`);
    await queryRunner.query(`DROP TABLE "branches"`);
    await queryRunner.query(`DROP TABLE "message_campaigns"`);
    await queryRunner.query(
      `DROP TYPE "public"."message_campaigns_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."message_campaigns_audiencetype_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."message_campaigns_channel_enum"`,
    );
    await queryRunner.query(`DROP TABLE "message_templates"`);
    await queryRunner.query(
      `DROP TYPE "public"."message_templates_category_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."message_templates_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."message_templates_channel_enum"`,
    );
    await queryRunner.query(`DROP TABLE "campaigns"`);
    await queryRunner.query(`DROP TYPE "public"."campaigns_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."campaigns_type_enum"`);
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(`DROP TYPE "public"."orders_paymentstatus_enum"`);
    await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
    await queryRunner.query(`DROP TABLE "quotes"`);
    await queryRunner.query(`DROP TYPE "public"."quotes_status_enum"`);
    await queryRunner.query(`DROP TABLE "quote_negotiations"`);
    await queryRunner.query(
      `DROP TYPE "public"."quote_negotiations_offeredby_enum"`,
    );
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TYPE "public"."products_status_enum"`);
    await queryRunner.query(`DROP TABLE "product_types"`);
  }
}
