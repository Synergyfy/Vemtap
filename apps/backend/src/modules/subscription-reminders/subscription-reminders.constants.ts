/**
 * Renewal reminder configuration for the cluster deals feed.
 *
 * A business's offers only surface in a cluster when it has a valid
 * subscription whose plan includes the Discovery Network (see
 * ClustersService.buildOfferQuery). These constants drive the periodic job
 * that nudges owners before that gate drops them out, and right after it does.
 */

/** Escalation stages in days-before-expiry. A business is reminded once per
 *  stage as its endDate crosses each threshold. */
export const SUBSCRIPTION_REMINDER_STAGES = [14, 7, 3] as const;

/** Sentinel stage used to dedupe the post-expiry ("lapsed") reminder. */
export const SUBSCRIPTION_REMINDER_LAPSED_STAGE = 0;

/** How long after endDate a lapsed business may still receive the expired
 *  reminder before we stop nagging. */
export const SUBSCRIPTION_REMINDER_LAPSED_DAYS = 7;

/** Engagement window (days) for the "potential customers" stat — unique people
 *  who browsed a cluster's deals feed within this period. */
export const SUBSCRIPTION_REMINDER_CUSTOMER_LOOKBACK_DAYS = 30;

/** Daily run time (08:00 server-local). */
export const SUBSCRIPTION_REMINDER_CRON = '0 8 * * *';

/** Deep link used for both the in-app notification actionUrl and the push
 *  notification tap-through. */
export const SUBSCRIPTION_RENEWAL_URL = '/dashboard/settings/subscription';

/**
 * Dynamic placeholders available for subscription reminder templates.
 */
export const SUBSCRIPTION_REMINDER_PLACEHOLDERS = [
  { placeholder: '{{businessName}}', description: 'Name of the business' },
  { placeholder: '{{ownerName}}', description: "Business owner's full name" },
  { placeholder: '{{planName}}', description: 'Name of the subscription plan' },
  { placeholder: '{{daysLeft}}', description: 'Number of days left until expiry' },
  { placeholder: '{{daysText}}', description: '"X days" or "1 day"' },
  { placeholder: '{{clusterName}}', description: 'Assigned cluster or area name' },
  { placeholder: '{{people}}', description: 'Active shoppers in cluster this month' },
  { placeholder: '{{businesses}}', description: 'Active businesses in cluster' },
  { placeholder: '{{renewalUrl}}', description: 'Deep link to renewal page' },
] as const;

export interface DefaultReminderTemplateDefinition {
  stage: number;
  name: string;
  description: string;
  titleTemplate: string;
  messageTemplate: string;
  type: string;
  actionUrl: string;
  isEnabled: boolean;
  sendPush: boolean;
  sendInApp: boolean;
  sendEmail: boolean;
  emailSubjectTemplate?: string;
}

export const DEFAULT_REMINDER_TEMPLATES: Record<
  number,
  DefaultReminderTemplateDefinition
> = {
  14: {
    stage: 14,
    name: '14-Day Expiry Reminder',
    description:
      'Sent 14 days before subscription expires to nudge early renewal.',
    titleTemplate: 'Your deals in {{clusterName}} expire in {{daysLeft}} days',
    messageTemplate:
      '{{people}} people checked deals in {{clusterName}} this month — renew now to stay visible to them.',
    type: 'warning',
    actionUrl: SUBSCRIPTION_RENEWAL_URL,
    isEnabled: true,
    sendPush: true,
    sendInApp: true,
    sendEmail: false,
    emailSubjectTemplate: 'Your {{planName}} expires in {{daysLeft}} days',
  },
  7: {
    stage: 7,
    name: '7-Day Expiry Reminder',
    description:
      'Sent 7 days before subscription expires highlighting nearby active businesses.',
    titleTemplate: 'Your offers leave {{clusterName}} in {{daysLeft}} days',
    messageTemplate:
      'Your offers will disappear from the {{clusterName}} feed in {{daysText}}. {{people}} shoppers browsed deals there this month — and {{businesses}} businesses are staying visible. Renew to keep showing up.',
    type: 'warning',
    actionUrl: SUBSCRIPTION_RENEWAL_URL,
    isEnabled: true,
    sendPush: true,
    sendInApp: true,
    sendEmail: false,
    emailSubjectTemplate:
      'Important: Your offers leave {{clusterName}} in {{daysLeft}} days',
  },
  3: {
    stage: 3,
    name: '3-Day Urgent Expiry Reminder',
    description:
      'Sent 3 days before subscription expires with urgent renewal CTA across push, in-app, and email.',
    titleTemplate: 'Last call: renew before {{clusterName}} expires',
    messageTemplate:
      'In {{daysText}} your offers leave the {{clusterName}} deals feed while {{businesses}} nearby businesses reach {{people}} shoppers. Renew today.',
    type: 'warning',
    actionUrl: SUBSCRIPTION_RENEWAL_URL,
    isEnabled: true,
    sendPush: true,
    sendInApp: true,
    sendEmail: true,
    emailSubjectTemplate:
      'Urgent: {{businessName}} subscription expires in {{daysText}}',
  },
  0: {
    stage: 0,
    name: 'Lapsed / Expired Subscription Reminder',
    description:
      'Sent when subscription has expired/lapsed notifying the business that their offers are no longer visible.',
    titleTemplate: 'Your offers left the {{clusterName}} deals feed',
    messageTemplate:
      'Your plan expired, so customers in {{clusterName}} can no longer see your deals. {{businesses}} businesses there are reaching {{people}} shoppers. Renew to rejoin.',
    type: 'error',
    actionUrl: SUBSCRIPTION_RENEWAL_URL,
    isEnabled: true,
    sendPush: true,
    sendInApp: true,
    sendEmail: true,
    emailSubjectTemplate:
      'Your {{businessName}} offers have been removed from {{clusterName}}',
  },
};
