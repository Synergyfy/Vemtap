import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { In, Repository } from 'typeorm';
import {
  Subscription,
  SubscriptionStatus,
} from '../subscriptions/entities/subscription.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Cluster } from '../clusters/entities/cluster.entity';
import { Business } from '../businesses/entities/business.entity';
import { User, UserStatus } from '../users/entities/user.entity';
import { RotatorImpression } from '../rotator/entities/rotator-impression.entity';
import { SubscriptionReminderTemplate } from './entities/subscription-reminder-template.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { PushNotificationService } from '../notifications/push-notification.service';
import { MailService } from '../mail/mail.service';
import {
  SUBSCRIPTION_REMINDER_STAGES,
  SUBSCRIPTION_REMINDER_LAPSED_STAGE,
  SUBSCRIPTION_REMINDER_LAPSED_DAYS,
  SUBSCRIPTION_REMINDER_CUSTOMER_LOOKBACK_DAYS,
  SUBSCRIPTION_REMINDER_CRON,
  SUBSCRIPTION_RENEWAL_URL,
  DEFAULT_REMINDER_TEMPLATES,
  SUBSCRIPTION_REMINDER_PLACEHOLDERS,
} from './subscription-reminders.constants';
import {
  CreateReminderTemplateDto,
  UpdateReminderTemplateDto,
  PreviewReminderTemplateDto,
} from './dto/subscription-reminder-template.dto';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const RENEWAL_GRACE_HOURS = 24;

export interface SubscriptionReminderRunResult {
  expiring: number;
  lapsed: number;
  sentInApp: number;
  sentPush: number;
  sentEmail: number;
  failed: number;
  skippedNoCluster: number;
  skippedDisabledTemplate: number;
}

interface ReminderTarget {
  sub: Subscription;
  daysLeft: number;
  isLapsed: boolean;
}

interface ClusterStats {
  name: string;
  people: number;
  businesses: number;
}

export interface ReminderRenderResult {
  title: string;
  message: string;
  type: string;
  actionUrl: string;
  sendInApp: boolean;
  sendPush: boolean;
  sendEmail: boolean;
  emailSubjectTemplate?: string | null;
}

/**
 * Periodic renewal reminders for the cluster deals feed.
 *
 * Dispatches customized multi-channel notifications (in-app, push, email)
 * following admin-customizable templates for each expiration stage.
 */
@Injectable()
export class SubscriptionRemindersService {
  private readonly logger = new Logger(SubscriptionRemindersService.name);

  private readonly stages: number[];
  private readonly lapsedDays: number;
  private readonly customerLookbackDays: number;

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(Cluster)
    private readonly clusterRepository: Repository<Cluster>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RotatorImpression)
    private readonly impressionRepository: Repository<RotatorImpression>,
    @InjectRepository(SubscriptionReminderTemplate)
    private readonly templateRepository: Repository<SubscriptionReminderTemplate>,
    private readonly notificationsService: NotificationsService,
    private readonly pushNotificationService: PushNotificationService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {
    this.stages = this.parseStages(
      this.configService.get<string>('SUBSCRIPTION_REMINDER_STAGES'),
    );
    this.lapsedDays = this.configService.get<number>(
      'SUBSCRIPTION_REMINDER_LAPSED_DAYS',
      SUBSCRIPTION_REMINDER_LAPSED_DAYS,
    );
    this.customerLookbackDays = this.configService.get<number>(
      'SUBSCRIPTION_REMINDER_CUSTOMER_LOOKBACK_DAYS',
      SUBSCRIPTION_REMINDER_CUSTOMER_LOOKBACK_DAYS,
    );
  }

  @Cron(SUBSCRIPTION_REMINDER_CRON)
  async handleCron(): Promise<void> {
    this.logger.log('Running subscription renewal reminders');
    const result = await this.runRenewalReminders();
    this.logger.log(
      `Renewal reminders done: ${result.sentInApp} in-app, ${result.sentPush} push, ` +
        `${result.sentEmail} email (${result.expiring} expiring, ${result.lapsed} lapsed, ` +
        `${result.failed} failed, ${result.skippedNoCluster} skipped for lack of a cluster, ` +
        `${result.skippedDisabledTemplate} skipped disabled)`,
    );
  }

  async runRenewalReminders(): Promise<SubscriptionReminderRunResult> {
    const now = new Date();
    const [expiring, lapsedCandidates] = await Promise.all([
      this.findExpiringSubscriptions(now),
      this.findLapsedCandidates(now),
    ]);

    const eligibleBusinessIds =
      lapsedCandidates.length > 0
        ? await this.currentlyEligibleDiscoveryBusinesses(
            [...new Set(lapsedCandidates.map((c) => c.businessId))],
            now,
          )
        : new Set<string>();
    const lapsed = lapsedCandidates.filter(
      (c) => !eligibleBusinessIds.has(c.businessId),
    );

    const result: SubscriptionReminderRunResult = {
      expiring: expiring.length,
      lapsed: lapsedCandidates.length,
      sentInApp: 0,
      sentPush: 0,
      sentEmail: 0,
      failed: 0,
      skippedNoCluster: 0,
      skippedDisabledTemplate: 0,
    };

    const targets: ReminderTarget[] = [
      ...expiring.map((sub) => ({
        sub,
        daysLeft: this.daysUntil(sub.endDate, now),
        isLapsed: false,
      })),
      ...lapsed.map((sub) => ({ sub, daysLeft: 0, isLapsed: true })),
    ];

    if (targets.length === 0) return result;

    const businessIds = [...new Set(targets.map((t) => t.sub.businessId))];
    const clusterByBusiness = await this.resolvePrimaryCluster(businessIds);
    if (clusterByBusiness.size === 0) {
      result.skippedNoCluster = targets.length;
      return result;
    }

    const stats = await this.computeClusterStats(
      [...new Set(clusterByBusiness.values())],
      now,
    );
    const owners = await this.resolveActiveOwners(businessIds);
    const templatesMap = await this.loadTemplatesMap();

    let sentInApp = 0;
    let sentPush = 0;
    let sentEmail = 0;
    let failed = 0;
    let skippedNoCluster = 0;
    let skippedDisabledTemplate = 0;

    for (const { sub, daysLeft, isLapsed } of targets) {
      try {
        const clusterId = clusterByBusiness.get(sub.businessId);
        if (!clusterId) {
          skippedNoCluster++;
          continue;
        }
        const ownerId = sub.business?.ownerId;
        if (!ownerId) continue;
        const owner = owners.get(ownerId);
        if (!owner) continue;

        const stage = isLapsed
          ? SUBSCRIPTION_REMINDER_LAPSED_STAGE
          : this.stageForDays(daysLeft);

        if (this.alreadyRemindedAtStage(sub, stage)) continue;

        const template = templatesMap.get(stage);
        if (template && template.isEnabled === false) {
          skippedDisabledTemplate++;
          continue;
        }

        const clusterStats = stats.get(clusterId);
        const rendered = this.renderReminderCopy(
          stage,
          daysLeft,
          isLapsed,
          sub,
          owner,
          clusterStats,
          template,
        );

        // In-App Notification
        if (rendered.sendInApp) {
          await this.notificationsService.create(
            ownerId,
            rendered.title,
            rendered.message,
            rendered.type,
            rendered.actionUrl,
          );
          sentInApp++;
        }

        // Web Push Notification
        if (rendered.sendPush) {
          const pushResult = await this.pushNotificationService.sendNotification(
            ownerId,
            rendered.title,
            rendered.message,
            {
              url: rendered.actionUrl,
              category: 'marketing',
              stage,
              clusterId,
            },
          );
          if (pushResult.queued) sentPush++;
        }

        // Email reminder for urgent and lapsed stages (or if enabled in template)
        const shouldSendEmail =
          rendered.sendEmail || (stage <= 3 || isLapsed);
        if (shouldSendEmail && owner.email) {
          const customerName =
            [owner.firstName, owner.lastName].filter(Boolean).join(' ') ||
            'Valued Merchant';
          const businessName =
            sub.business?.name ||
            (sub.business as any)?.businessName ||
            'Your Business';
          const planName = sub.plan?.name || 'Discovery Plan';

          const emailSent =
            await this.mailService.sendSubscriptionRenewalReminder({
              email: owner.email,
              customerName,
              businessName,
              planName,
              daysLeft,
              isLapsed,
              clusterName: clusterStats?.name ?? 'your area',
              clusterStats: clusterStats
                ? {
                    people: clusterStats.people,
                    businesses: clusterStats.businesses,
                  }
                : undefined,
            });
          if (emailSent) sentEmail++;
        }

        await this.subscriptionRepository.update(sub.id, {
          lastRenewalReminderAt: now,
          lastRenewalReminderStage: stage,
        });
      } catch (error) {
        failed++;
        this.logger.error(
          `Failed processing renewal reminder for subscription ${sub.id}: ${
            (error as Error).message
          }`,
          (error as Error).stack,
        );
      }
    }

    result.sentInApp = sentInApp;
    result.sentPush = sentPush;
    result.sentEmail = sentEmail;
    result.failed = failed;
    result.skippedNoCluster = skippedNoCluster;
    result.skippedDisabledTemplate = skippedDisabledTemplate;
    return result;
  }

  // ------------------------------------------------------------------
  // Template Management (CRUD & Interpolation)
  // ------------------------------------------------------------------

  async getPlaceholders() {
    return SUBSCRIPTION_REMINDER_PLACEHOLDERS;
  }

  async getTemplates(): Promise<SubscriptionReminderTemplate[]> {
    const templates = await this.templateRepository.find({
      order: { stage: 'DESC' },
    });
    if (templates.length === 0) {
      await this.seedDefaultTemplates();
      return this.templateRepository.find({
        order: { stage: 'DESC' },
      });
    }
    return templates;
  }

  async getTemplateById(id: string): Promise<SubscriptionReminderTemplate> {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }
    return template;
  }

  async createTemplate(
    dto: CreateReminderTemplateDto,
  ): Promise<SubscriptionReminderTemplate> {
    const existing = await this.templateRepository.findOne({
      where: { stage: dto.stage },
    });
    if (existing) {
      throw new BadRequestException(
        `A reminder template for stage ${dto.stage} already exists. Please update the existing template instead.`,
      );
    }

    const template = this.templateRepository.create({
      stage: dto.stage,
      name: dto.name,
      description: dto.description ?? null,
      titleTemplate: dto.titleTemplate,
      messageTemplate: dto.messageTemplate,
      type: dto.type || 'warning',
      actionUrl: dto.actionUrl || SUBSCRIPTION_RENEWAL_URL,
      isEnabled: dto.isEnabled ?? true,
      sendPush: dto.sendPush ?? true,
      sendInApp: dto.sendInApp ?? true,
      sendEmail: dto.sendEmail ?? false,
      emailSubjectTemplate: dto.emailSubjectTemplate ?? null,
      isDefault: false,
    });

    return this.templateRepository.save(template);
  }

  async updateTemplate(
    id: string,
    dto: UpdateReminderTemplateDto,
  ): Promise<SubscriptionReminderTemplate> {
    const template = await this.getTemplateById(id);

    if (dto.name !== undefined) template.name = dto.name;
    if (dto.description !== undefined) template.description = dto.description;
    if (dto.titleTemplate !== undefined)
      template.titleTemplate = dto.titleTemplate;
    if (dto.messageTemplate !== undefined)
      template.messageTemplate = dto.messageTemplate;
    if (dto.type !== undefined) template.type = dto.type;
    if (dto.actionUrl !== undefined) template.actionUrl = dto.actionUrl;
    if (dto.isEnabled !== undefined) template.isEnabled = dto.isEnabled;
    if (dto.sendPush !== undefined) template.sendPush = dto.sendPush;
    if (dto.sendInApp !== undefined) template.sendInApp = dto.sendInApp;
    if (dto.sendEmail !== undefined) template.sendEmail = dto.sendEmail;
    if (dto.emailSubjectTemplate !== undefined)
      template.emailSubjectTemplate = dto.emailSubjectTemplate;

    return this.templateRepository.save(template);
  }

  async resetTemplate(id: string): Promise<SubscriptionReminderTemplate> {
    const template = await this.getTemplateById(id);
    const defaultDef = DEFAULT_REMINDER_TEMPLATES[template.stage];
    if (!defaultDef) {
      throw new BadRequestException(
        `No default configuration found for stage ${template.stage}`,
      );
    }

    template.name = defaultDef.name;
    template.description = defaultDef.description;
    template.titleTemplate = defaultDef.titleTemplate;
    template.messageTemplate = defaultDef.messageTemplate;
    template.type = defaultDef.type;
    template.actionUrl = defaultDef.actionUrl;
    template.isEnabled = defaultDef.isEnabled;
    template.sendPush = defaultDef.sendPush;
    template.sendInApp = defaultDef.sendInApp;
    template.sendEmail = defaultDef.sendEmail;
    template.emailSubjectTemplate = defaultDef.emailSubjectTemplate ?? null;

    return this.templateRepository.save(template);
  }

  async previewTemplate(dto: PreviewReminderTemplateDto) {
    const defaultMockVariables = {
      businessName: 'Apex Electronics',
      ownerName: 'Alex Johnson',
      planName: 'Discovery Pro',
      daysLeft: 7,
      daysText: '7 days',
      clusterName: 'Ikeja Tech Hub',
      people: '1,840',
      businesses: '42',
      renewalUrl: SUBSCRIPTION_RENEWAL_URL,
    };

    const variables = { ...defaultMockVariables, ...(dto.variables || {}) };

    const renderedTitle = this.interpolate(dto.titleTemplate, variables);
    const renderedMessage = this.interpolate(dto.messageTemplate, variables);

    return {
      title: renderedTitle,
      message: renderedMessage,
      variablesUsed: variables,
    };
  }

  /**
   * Replace {{variableName}} tags in template strings with values from context.
   */
  private interpolate(template: string, variables: Record<string, any>): string {
    if (!template) return '';
    return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
      if (
        key in variables &&
        variables[key] !== undefined &&
        variables[key] !== null
      ) {
        return String(variables[key]);
      }
      return match;
    });
  }

  private async loadTemplatesMap(): Promise<
    Map<number, SubscriptionReminderTemplate>
  > {
    try {
      const list = await this.templateRepository.find();
      const map = new Map<number, SubscriptionReminderTemplate>();
      for (const t of list) {
        map.set(t.stage, t);
      }
      return map;
    } catch {
      return new Map();
    }
  }

  private async seedDefaultTemplates(): Promise<void> {
    try {
      for (const [stageStr, def] of Object.entries(DEFAULT_REMINDER_TEMPLATES)) {
        const stage = Number(stageStr);
        const exists = await this.templateRepository.findOne({
          where: { stage },
        });
        if (!exists) {
          const t = this.templateRepository.create({
            stage: def.stage,
            name: def.name,
            description: def.description,
            titleTemplate: def.titleTemplate,
            messageTemplate: def.messageTemplate,
            type: def.type,
            actionUrl: def.actionUrl,
            isEnabled: def.isEnabled,
            sendPush: def.sendPush,
            sendInApp: def.sendInApp,
            sendEmail: def.sendEmail,
            emailSubjectTemplate: def.emailSubjectTemplate ?? null,
            isDefault: true,
          });
          await this.templateRepository.save(t);
        }
      }
    } catch (err: any) {
      this.logger.warn(`Could not seed default templates: ${err.message}`);
    }
  }

  private renderReminderCopy(
    stage: number,
    daysLeft: number,
    isLapsed: boolean,
    sub: Subscription,
    owner: User,
    clusterStats?: ClusterStats,
    customTemplate?: SubscriptionReminderTemplate,
  ): ReminderRenderResult {
    const clusterName = clusterStats?.name ?? 'your area';
    const people = clusterStats?.people ?? 0;
    const businesses = clusterStats?.businesses ?? 0;
    const peopleText = `${people.toLocaleString()}`;
    const businessesText = `${businesses.toLocaleString()}`;
    const daysText = `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`;
    const ownerName =
      [owner.firstName, owner.lastName].filter(Boolean).join(' ') ||
      'Valued Merchant';
    const businessName =
      sub.business?.name ||
      (sub.business as any)?.businessName ||
      'Your Business';
    const planName = sub.plan?.name || 'Discovery Plan';

    const variables = {
      businessName,
      ownerName,
      planName,
      daysLeft,
      daysText,
      clusterName,
      people: peopleText,
      businesses: businessesText,
      renewalUrl: SUBSCRIPTION_RENEWAL_URL,
    };

    if (customTemplate) {
      return {
        title: this.interpolate(customTemplate.titleTemplate, variables),
        message: this.interpolate(customTemplate.messageTemplate, variables),
        type: customTemplate.type || (isLapsed ? 'error' : 'warning'),
        actionUrl: customTemplate.actionUrl || SUBSCRIPTION_RENEWAL_URL,
        sendInApp: customTemplate.sendInApp !== false,
        sendPush: customTemplate.sendPush !== false,
        sendEmail: customTemplate.sendEmail === true,
        emailSubjectTemplate: customTemplate.emailSubjectTemplate,
      };
    }

    // Default template fallbacks if not in DB
    const defaultDef = DEFAULT_REMINDER_TEMPLATES[stage];
    if (defaultDef) {
      return {
        title: this.interpolate(defaultDef.titleTemplate, variables),
        message: this.interpolate(defaultDef.messageTemplate, variables),
        type: defaultDef.type,
        actionUrl: defaultDef.actionUrl,
        sendInApp: defaultDef.sendInApp,
        sendPush: defaultDef.sendPush,
        sendEmail: defaultDef.sendEmail,
        emailSubjectTemplate: defaultDef.emailSubjectTemplate,
      };
    }

    // Generic fallback copy
    if (isLapsed) {
      return {
        title: `Your offers left the ${clusterName} deals feed`,
        message: `Your plan expired, so customers in ${clusterName} can no longer see your deals. ${businessesText} businesses there are reaching ${peopleText} shoppers. Renew to rejoin.`,
        type: 'error',
        actionUrl: SUBSCRIPTION_RENEWAL_URL,
        sendInApp: true,
        sendPush: true,
        sendEmail: true,
      };
    }

    return {
      title: `Your deals in ${clusterName} expire in ${daysLeft} days`,
      message: `${peopleText} people checked deals in ${clusterName} this month — renew now to stay visible to them.`,
      type: 'warning',
      actionUrl: SUBSCRIPTION_RENEWAL_URL,
      sendInApp: true,
      sendPush: true,
      sendEmail: daysLeft <= 3,
    };
  }

  // ------------------------------------------------------------------
  // Target selection
  // ------------------------------------------------------------------

  /**
   * Subscriptions about to expire: active/trial Discovery plans whose endDate
   * falls within the furthest reminder stage. Mirrors the feed gate's
   * subscription semantics (status active/trial + discoveryEnabled plan).
   */
  private async findExpiringSubscriptions(now: Date): Promise<Subscription[]> {
    const maxStage = Math.max(...this.stages);
    const windowEnd = this.addDays(now, maxStage);

    return this.subscriptionRepository
      .createQueryBuilder('sub')
      .innerJoinAndSelect('sub.plan', 'plan')
      .leftJoinAndSelect('sub.business', 'business')
      .where('sub.status IN (:...statuses)', {
        statuses: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL],
      })
      .andWhere('sub.deletedAt IS NULL')
      .andWhere('plan.discoveryEnabled = :discovery', { discovery: true })
      .andWhere('sub.endDate >= :now', { now })
      .andWhere('sub.endDate <= :windowEnd', { windowEnd })
      .getMany();
  }

  /**
   * Subscriptions that just lapsed: Discovery plans whose endDate (plus the
   * 24h renewal grace used by the feed gate) has passed within the lapsed
   * window. Whether the business has since renewed is checked separately in
   * runRenewalReminders via currentlyEligibleDiscoveryBusinesses.
   */
  private async findLapsedCandidates(now: Date): Promise<Subscription[]> {
    const lapsedSince = this.addDays(now, -this.lapsedDays);
    const gracePassed = this.addHours(now, -RENEWAL_GRACE_HOURS);

    return this.subscriptionRepository
      .createQueryBuilder('sub')
      .innerJoinAndSelect('sub.plan', 'plan')
      .leftJoinAndSelect('sub.business', 'business')
      .where('sub.deletedAt IS NULL')
      .andWhere('plan.discoveryEnabled = :discovery', { discovery: true })
      .andWhere('sub.endDate >= :lapsedSince', { lapsedSince })
      .andWhere('sub.endDate <= :gracePassed', { gracePassed })
      .getMany();
  }

  private async currentlyEligibleDiscoveryBusinesses(
    businessIds: string[],
    now: Date,
  ): Promise<Set<string>> {
    const rows = await this.subscriptionRepository
      .createQueryBuilder('sub')
      .select('DISTINCT sub.businessId', 'businessId')
      .innerJoin('sub.plan', 'plan')
      .where('sub.status IN (:...statuses)', {
        statuses: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL],
      })
      .andWhere('sub.deletedAt IS NULL')
      .andWhere('sub.businessId IN (:...businessIds)', { businessIds })
      .andWhere('plan.discoveryEnabled = :discovery', { discovery: true })
      .andWhere("sub.endDate + INTERVAL '24 hours' > :now", { now })
      .getRawMany<{ businessId: string }>();
    return new Set(rows.map((r) => r.businessId));
  }

  // ------------------------------------------------------------------
  // Cluster resolution + stats
  // ------------------------------------------------------------------

  /**
   * Maps each business to its primary cluster: the cluster of its main branch
   * if one exists, otherwise the first branch's cluster. Businesses without
   * any cluster membership are omitted (nothing to remind them about).
   */
  private async resolvePrimaryCluster(
    businessIds: string[],
  ): Promise<Map<string, string>> {
    const branches = await this.branchRepository.find({
      where: { businessId: In(businessIds) },
      select: ['id', 'businessId', 'clusterId', 'isMainBranch'],
    });

    const result = new Map<string, string>();
    for (const branch of branches) {
      if (!branch.clusterId) continue;
      const existing = result.get(branch.businessId);
      if (!existing) {
        result.set(branch.businessId, branch.clusterId);
      } else if (branch.isMainBranch) {
        result.set(branch.businessId, branch.clusterId);
      }
    }
    return result;
  }

  private async computeClusterStats(
    clusterIds: string[],
    now: Date,
  ): Promise<Map<string, ClusterStats>> {
    const clusters = await this.clusterRepository.find({
      where: { id: In(clusterIds) },
      select: ['id', 'name'],
    });
    const names = new Map(clusters.map((c) => [c.id, c.name]));

    const since = this.addDays(now, -this.customerLookbackDays);

    const peopleRows = await this.impressionRepository
      .createQueryBuilder('i')
      .select('i.clusterId', 'clusterId')
      .addSelect(
        'COUNT(DISTINCT COALESCE(i.sessionToken, i.customerId))',
        'people',
      )
      .where('i.clusterId IN (:...ids)', { ids: clusterIds })
      .andWhere('i.createdAt >= :since', { since })
      .groupBy('i.clusterId')
      .getRawMany<{ clusterId: string; people: string }>();

    const businessRows = await this.branchRepository
      .createQueryBuilder('b')
      .select('b.clusterId', 'clusterId')
      .addSelect('COUNT(DISTINCT b.businessId)', 'businesses')
      .where('b.clusterId IN (:...ids)', { ids: clusterIds })
      .andWhere('b.isActive = :active', { active: true })
      .groupBy('b.clusterId')
      .getRawMany<{ clusterId: string; businesses: string }>();

    const people = new Map(
      peopleRows.map((r) => [r.clusterId, Number(r.people)]),
    );
    const businesses = new Map(
      businessRows.map((r) => [r.clusterId, Number(r.businesses)]),
    );

    const stats = new Map<string, ClusterStats>();
    for (const id of clusterIds) {
      stats.set(id, {
        name: names.get(id) ?? 'your area',
        people: people.get(id) ?? 0,
        businesses: businesses.get(id) ?? 0,
      });
    }
    return stats;
  }

  private async resolveActiveOwners(
    businessIds: string[],
  ): Promise<Map<string, User>> {
    const businesses = await this.businessRepository.find({
      where: { id: In(businessIds) },
      select: ['id', 'ownerId'],
    });
    const ownerIds = [
      ...new Set(businesses.map((b) => b.ownerId).filter(Boolean)),
    ];
    if (ownerIds.length === 0) return new Map();

    const owners = await this.userRepository.find({
      where: { id: In(ownerIds), status: UserStatus.ACTIVE },
      select: ['id', 'email', 'firstName', 'lastName'],
    });
    return new Map(owners.map((o) => [o.id, o]));
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  private stageForDays(daysLeft: number): number {
    // Stages are stored descending (14,7,3). Pick the tightest stage whose
    // threshold is still >= daysLeft so 5 days maps to 7 and 2 days to 3.
    const ascending = [...this.stages].sort((a, b) => a - b);
    for (const stage of ascending) {
      if (daysLeft <= stage) return stage;
    }
    return Math.max(...this.stages);
  }

  private alreadyRemindedAtStage(sub: Subscription, stage: number): boolean {
    // Exact-stage dedupe: a lower (more urgent) stage is an escalation and
    // should still fire even if a higher stage was already delivered.
    return sub.lastRenewalReminderStage === stage;
  }

  private parseStages(raw: string | undefined): number[] {
    const parsed = (raw ?? '')
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n) && n > 0)
      .sort((a, b) => b - a);
    return parsed.length > 0
      ? parsed
      : ([...SUBSCRIPTION_REMINDER_STAGES] as number[]);
  }

  private daysUntil(date: Date, from: Date): number {
    return Math.max(
      0,
      Math.ceil((date.getTime() - from.getTime()) / MS_PER_DAY),
    );
  }

  private addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  private addHours(date: Date, hours: number): Date {
    const d = new Date(date);
    d.setHours(d.getHours() + hours);
    return d;
  }
}
