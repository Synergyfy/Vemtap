import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Repository, In, IsNull, Not } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Business, BusinessStatus } from './entities/business.entity';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { AdminCreateBusinessDto } from './dto/admin-create-business.dto';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { ImportCustomersDto } from './dto/import-customers.dto';
import { MailService } from '../mail/mail.service';
import { Branch } from '../branches/entities/branch.entity';
import { Visit } from '../visitors/entities/visit.entity';
import { DevicesService } from '../devices/devices.service';
import { Reward } from '../loyalty/entities/reward.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { paginateWithCursor } from '../../common/utils/cursor-pagination.util';
import {
  Subscription,
  SubscriptionStatus,
} from '../subscriptions/entities/subscription.entity';
import { Plan } from '../subscriptions/entities/plan.entity';
import { MessageLog } from '../messaging/entities/message-log.entity';
import { FinancialTransaction } from '../fos-core/entities/financial-transaction.entity';
import {
  GEOCODING_QUEUE,
  GeocodingJobData,
} from './processors/geocoding.processor';

@Injectable()
export class BusinessesService {
  constructor(
    @InjectRepository(Business)
    private businessesRepository: Repository<Business>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>,
    @InjectRepository(Visit)
    private visitRepository: Repository<Visit>,
    @InjectRepository(Reward)
    private rewardRepository: Repository<Reward>,
    private readonly mailService: MailService,
    private readonly devicesService: DevicesService,
    @Inject(forwardRef(() => SubscriptionsService))
    private readonly subscriptionsService: SubscriptionsService,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Plan)
    private planRepository: Repository<Plan>,
    @InjectQueue(GEOCODING_QUEUE)
    private readonly geocodingQueue: Queue<GeocodingJobData>,
  ) {}

  async create(
    businessData: Partial<Business> & {
      logoUrl?: string;
      address?: string;
      website?: string;
      state?: string;
      city?: string;
      latitude?: number;
      longitude?: number;
      whatsappNumber?: string;
      officialEmail?: string;
      engagement?: Record<string, any>;
    },
  ): Promise<Business> {
    if (businessData.ownerId) {
      const existingByOwner = await this.findByOwner(businessData.ownerId);
      if (existingByOwner) {
        throw new ConflictException('Owner already has a business');
      }
    }

    if (businessData.phone) {
      const existingByPhone = await this.findByPhone(businessData.phone);
      if (existingByPhone) {
        throw new ConflictException(
          'Business with this phone number already exists',
        );
      }
    }

    // Extract branch specific data
    const {
      logoUrl,
      address,
      website,
      state,
      city,
      latitude,
      longitude,
      whatsappNumber,
      officialEmail,
      phone,
      engagement,
      ...businessBaseData
    } = businessData;

    const business = this.businessesRepository.create({
      ...businessBaseData,
      name: businessBaseData.name?.trim() || 'My Business',
      officialEmail,
      phone,
      logoUrl,
      address,
      website,
      state,
      city,
      latitude,
      longitude,
      whatsappNumber,
    } as Partial<Business>);
    const savedBusiness = await this.businessesRepository.save(business);

    // Automatically create Main Branch
    const mainBranch = this.branchRepository.create({
      name: 'Main Branch',
      businessId: savedBusiness.id,
      isMainBranch: true,
      logoUrl,
      address,
      state,
      city,
      latitude,
      longitude,
      website,
      whatsappNumber,
      officialEmail: officialEmail,
      phone: phone,
      engagement,
    } as any); // Cast to any because the repository might not be updated yet in TS context
    const savedBranch = (await this.branchRepository.save(
      mainBranch,
    )) as unknown as Branch;

    // Link owner to the business and its main branch
    if (businessData.ownerId) {
      await this.usersRepository.update(businessData.ownerId, {
        businessId: savedBusiness.id,
        branchId: savedBranch.id,
        status: UserStatus.ACTIVE,
      });
      console.log(
        `[BUSINESS] Linked owner ${businessData.ownerId} to business ${savedBusiness.id} and branch ${savedBranch.id}`,
      );
    }

    // Automatically generate a device for the Main Branch
    try {
      await this.devicesService.createAutoDevice(savedBranch.id);
    } catch (error) {
      console.error(
        `Failed to auto-generate device for business ${savedBusiness.id} main branch:`,
        error,
      );
    }

    return savedBusiness;
  }

  async findByOwner(ownerId: string): Promise<Business | null> {
    return this.businessesRepository.findOne({ where: { ownerId } });
  }

  async findByPhone(phone: string): Promise<Business | null> {
    return this.businessesRepository.findOne({ where: { phone } });
  }

  async findById(id: string): Promise<Business> {
    const business = await this.businessesRepository.findOne({
      where: { id },
      relations: ['branches', 'category', 'subcategory'],
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    return business;
  }

  async findByCode(uniqueCode: string): Promise<any> {
    const business = await this.businessesRepository.findOne({
      where: { uniqueCode, status: Not(BusinessStatus.SUSPENDED) },
      relations: ['branches', 'category', 'subcategory', 'owner'],
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const { owner, ...businessData } = business;

    // Filter owner sensitive data
    let safeOwner: any = null;
    if (owner) {
      safeOwner = {
        id: owner.id,
        firstName: owner.firstName,
        lastName: owner.lastName,
        email: owner.email,
        phone: owner.phone,
        role: owner.role,
        jobTitle: owner.jobTitle,
        status: owner.status,
      };
    }

    // Fetch active rewards across all branches and business level
    let activeRewards: Reward[] = [];
    if (businessData.branches && businessData.branches.length > 0) {
      const branchIds = businessData.branches.map((b) => b.id);

      const [branchRewards, businessRewards] = await Promise.all([
        this.rewardRepository.find({
          where: { branchId: In(branchIds), isActive: true },
        }),
        this.rewardRepository.find({
          where: { businessId: business.id, isActive: true },
        }),
      ]);

      activeRewards = [...branchRewards, ...businessRewards];

      // Remove duplicates if any happen to overlap
      const uniqueMap = new Map();
      activeRewards.forEach((r) => uniqueMap.set(r.id, r));
      activeRewards = Array.from(uniqueMap.values());
    } else {
      activeRewards = await this.rewardRepository.find({
        where: { businessId: business.id, isActive: true },
      });
    }

    return {
      ...businessData,
      owner: safeOwner,
      rewards: activeRewards,
    };
  }

  async update(
    id: string,
    updateBusinessDto: UpdateBusinessDto,
  ): Promise<Business> {
    const business = await this.findById(id);

    // Map frontend aliases to entity field names
    if (updateBusinessDto.about && !updateBusinessDto.description) {
      (updateBusinessDto as any).description = updateBusinessDto.about;
    }
    if (updateBusinessDto.businessHours && !updateBusinessDto.openingHours) {
      (updateBusinessDto as any).openingHours = updateBusinessDto.businessHours;
    }

    // Merge individual social fields into socials object
    const socialFields = [
      'facebookUrl',
      'instagramUrl',
      'tiktokUrl',
      'xUrl',
      'linkedinUrl',
    ] as const;
    const hasIndividualSocials = socialFields.some(
      (f) => !!(updateBusinessDto as any)[f],
    );
    if (hasIndividualSocials) {
      const existingSocials = business.socials || {};
      for (const field of socialFields) {
        const value = (updateBusinessDto as any)[field];
        if (value) {
          const key = field.replace('Url', '').toLowerCase();
          existingSocials[key] = value;
        }
      }
      (updateBusinessDto as any).socials = existingSocials;
    }

    // Clean up alias fields before assign to avoid TypeORM warnings
    delete (updateBusinessDto as any).about;
    delete (updateBusinessDto as any).businessHours;
    for (const field of socialFields) {
      delete (updateBusinessDto as any)[field];
    }

    Object.assign(business, updateBusinessDto);
    const saved = await this.businessesRepository.save(business);

    if (
      updateBusinessDto.latitude !== undefined ||
      updateBusinessDto.longitude !== undefined
    ) {
      const mainBranch = await this.findMainBranch(id);
      if (mainBranch) {
        if (updateBusinessDto.latitude !== undefined) {
          mainBranch.latitude = updateBusinessDto.latitude;
        }
        if (updateBusinessDto.longitude !== undefined) {
          mainBranch.longitude = updateBusinessDto.longitude;
        }
        await this.branchRepository.save(mainBranch);
      }
    }

    return saved;
  }

  async enqueueGeocode(businessId: string): Promise<void> {
    const business = await this.findById(businessId);
    const mainBranch = await this.findMainBranch(businessId);

    if (!mainBranch) {
      throw new NotFoundException('Main branch not found for this business');
    }

    await this.geocodingQueue.add(
      'geocode-address',
      {
        businessId,
        branchId: mainBranch.id,
        addressLine: business.address,
        city: business.city,
        state: business.state,
        country: 'Nigeria',
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );
  }

  @Cron('*/10 * * * *')
  async backfillMissingGeocodes() {
    const BATCH_SIZE = 10;

    const branches = await this.branchRepository.find({
      where: { latitude: IsNull() },
      take: BATCH_SIZE,
      order: { createdAt: 'ASC' },
    });

    if (branches.length === 0) return;

    for (const branch of branches) {
      const business = await this.businessesRepository.findOne({
        where: { id: branch.businessId },
        select: ['id', 'address', 'city', 'state'],
      });
      if (!business) continue;

      const addressLine = branch.address || business.address;
      const city = branch.city || business.city;
      if (!addressLine) continue;

      await this.geocodingQueue.add('geocode-address', {
        businessId: business.id,
        branchId: branch.id,
        addressLine,
        city,
        state: business.state,
        country: 'Nigeria',
        updateBusiness: branch.isMainBranch,
      });
    }
  }

  async importCustomers(branchId: string, importDto: ImportCustomersDto) {
    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const customerData of importDto.customers) {
      try {
        const email = customerData.email.toLowerCase();
        const existingUser = await this.usersRepository.findOne({
          where: { email },
        });

        if (existingUser) {
          results.skipped++;
          continue;
        }

        // Each imported customer gets a unique random password (emailed to
        // them) — never a shared constant.
        const tempPassword = randomBytes(9).toString('base64url').slice(0, 12);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const newUser = this.usersRepository.create({
          firstName: customerData.firstName,
          lastName: customerData.lastName,
          email: email,
          phone: customerData.phone,
          password: hashedPassword,
          role: UserRole.CUSTOMER,
          status: UserStatus.PENDING,
          isPasswordChanged: false,
          branchId,
        });

        await this.usersRepository.save(newUser);

        // Send Welcome Email asynchronously
        this.mailService
          .sendWelcomeEmail(
            email,
            `${customerData.firstName} ${customerData.lastName}`,
            tempPassword,
          )
          .catch((err) =>
            console.error(`Failed to send welcome email to ${email}:`, err),
          );

        results.imported++;
      } catch (error) {
        results.errors.push(
          `Error importing ${customerData.email}: ${error.message}`,
        );
      }
    }

    return results;
  }

  // --- Admin Methods ---

  async findAllAdmin(query: {
    search?: string;
    status?: BusinessStatus;
    isVerified?: boolean;
    page?: number;
    limit?: number;
  }) {
    const qb = this.businessesRepository
      .createQueryBuilder('business')
      .leftJoinAndSelect('business.owner', 'owner')
      .leftJoinAndSelect(
        'business.branches',
        'mainBranch',
        'mainBranch.isMainBranch = :isMain',
        { isMain: true },
      )
      .leftJoinAndSelect('business.category', 'category')
      .leftJoinAndSelect('business.subcategory', 'subcategory')
      .loadRelationCountAndMap('business.totalBranches', 'business.branches');

    if (query.status) {
      const normalizedStatus = String(
        query.status,
      ).toLowerCase() as BusinessStatus;
      qb.andWhere('business.status = :status', { status: normalizedStatus });
    }

    if (query.isVerified !== undefined) {
      qb.andWhere('business.isVerified = :isVerified', {
        isVerified: query.isVerified,
      });
    }

    if (query.search) {
      qb.andWhere(
        '(business.name ILIKE :search OR owner.email ILIKE :search OR owner.firstName ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const cursor = (query as any).cursor || (query as any).nextCursor;

    const result = await paginateWithCursor({
      queryBuilder: qb,
      cursor,
      page,
      limit,
      sortField: 'createdAt',
      sortOrder: 'DESC',
      entityAlias: 'business',
    });

    const businesses = result.data;
    const total = result.total;

    const fosFields = await this.buildFosBusinessFields(
      businesses.map((b) => b.id),
    );

    const data = businesses.map((b) => ({
      ...b,
      status: String(b.status).toUpperCase(),
      joinDate: b.createdAt
        ? new Date(b.createdAt).toISOString().split('T')[0]
        : null,
      ownerName: b.owner
        ? `${b.owner.firstName || ''} ${b.owner.lastName || ''}`.trim() ||
          b.owner.email
        : null,
      ...(fosFields.get(b.id) || {}),
    }));

    // Stats
    const activeCount = await this.businessesRepository.count({
      where: { status: BusinessStatus.ACTIVE },
    });
    const pendingCount = await this.businessesRepository.count({
      where: { status: BusinessStatus.PENDING },
    });
    const suspendedCount = await this.businessesRepository.count({
      where: { status: BusinessStatus.SUSPENDED },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const approvedToday = await this.businessesRepository
      .createQueryBuilder('business')
      .where('business.status = :status', { status: BusinessStatus.ACTIVE })
      .andWhere('business.updatedAt >= :today', { today: todayStart })
      .getCount();

    // Calculate Average Wait Time for businesses approved today (Postgres)
    const waitTimeData = await this.businessesRepository
      .createQueryBuilder('business')
      .select(
        'AVG(EXTRACT(EPOCH FROM (business.updatedAt - business.createdAt)))',
        'avgSeconds',
      )
      .where('business.status = :status', { status: BusinessStatus.ACTIVE })
      .andWhere('business.updatedAt >= :today', { today: todayStart })
      .getRawOne<{ avgSeconds: string | null }>();

    const avgWaitHours = waitTimeData?.avgSeconds
      ? (parseFloat(waitTimeData.avgSeconds) / 3600).toFixed(1)
      : '0.0';

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
      stats: {
        total: activeCount + pendingCount + suspendedCount,
        active: activeCount,
        pending: pendingCount,
        suspended: suspendedCount,
        approvedToday,
        avgWaitTime: avgWaitHours,
      },
    };
  }

  /**
   * Enriches businesses with FOS-facing fields: plan, MRR, renewal date,
   * SMS/email usage and (future) agent linkage. Derived from subscriptions
   * and message_logs so the FOS admin UI doesn't have to compute them.
   */
  private async buildFosBusinessFields(ids: string[]) {
    const fields = new Map<
      string,
      {
        plan: string | null;
        mrr: number;
        renewalDate: string | null;
        lastPaymentDate: string | null;
        agentId: string | null;
        agentName: string | null;
        smsUsed: number;
        emailUsed: number;
      }
    >();
    if (ids.length === 0) return fields;

    const subscriptions = await this.subscriptionRepository.find({
      where: { businessId: In(ids), status: SubscriptionStatus.ACTIVE },
      relations: ['plan'],
      order: { endDate: 'DESC' },
    });

    for (const sub of subscriptions) {
      if (!fields.has(sub.businessId)) {
        fields.set(sub.businessId, {
          plan: sub.plan?.name ?? null,
          mrr: this.toNumber(sub.plan?.monthlyPrice ?? 0),
          renewalDate: sub.endDate
            ? new Date(sub.endDate).toISOString().split('T')[0]
            : null,
          lastPaymentDate: null,
          agentId: null,
          agentName: null,
          smsUsed: 0,
          emailUsed: 0,
        });
      }
    }

    let usageRaw: { businessId: string; channel: string; units: string }[] = [];
    try {
      usageRaw = await this.businessesRepository.manager
        .createQueryBuilder()
        .select('br."businessId"', 'businessId')
        .addSelect('ml.channel', 'channel')
        .addSelect('COALESCE(SUM(ml.units), 0)', 'units')
        .from(MessageLog, 'ml')
        .innerJoin(Branch, 'br', 'br.id = ml."branchId"')
        .where('br."businessId" IN (:...ids)', { ids })
        .groupBy('br."businessId"')
        .addGroupBy('ml.channel')
        .getRawMany();
    } catch (error) {
      // best-effort aggregation; usage falls back to zero when unavailable
    }

    for (const row of usageRaw) {
      const entry = fields.get(row.businessId) ?? {
        plan: null,
        mrr: 0,
        renewalDate: null,
        lastPaymentDate: null,
        agentId: null,
        agentName: null,
        smsUsed: 0,
        emailUsed: 0,
      };
      const units = parseInt(row.units || '0', 10) || 0;
      if (String(row.channel).toUpperCase() === 'SMS') {
        entry.smsUsed += units;
      } else if (String(row.channel).toUpperCase() === 'EMAIL') {
        entry.emailUsed += units;
      }
      fields.set(row.businessId, entry);
    }

    return fields;
  }

  /**
   * Admin detail for a single business in the FOS shape, including the
   * business's financial transaction history.
   */
  async getAdminDetail(id: string) {
    const business = await this.businessesRepository.findOne({
      where: { id },
      relations: ['owner', 'category', 'subcategory', 'branches'],
    });
    if (!business) {
      throw new NotFoundException(`Business with id ${id} not found`);
    }

    const fosFields = await this.buildFosBusinessFields([id]);
    const field = fosFields.get(id) ?? {
      plan: null,
      mrr: 0,
      renewalDate: null,
      lastPaymentDate: null,
      agentId: null,
      agentName: null,
      smsUsed: 0,
      emailUsed: 0,
    };

    let transactions: {
      id: string;
      type: string;
      amount: number;
      profit: number;
      date: string;
    }[] = [];
    try {
      transactions = await this.businessesRepository.manager
        .createQueryBuilder()
        .select('ft.id', 'id')
        .addSelect('ft.type', 'type')
        .addSelect('ft.amount', 'amount')
        .addSelect('ft.profit', 'profit')
        .addSelect('ft.date', 'date')
        .from(FinancialTransaction, 'ft')
        .where('ft."businessId" = :id', { id })
        .orderBy('ft.date', 'DESC')
        .getRawMany();
      transactions = transactions.map((t) => ({
        ...t,
        amount: this.toNumber(t.amount),
        profit: this.toNumber(t.profit),
      }));
    } catch (error) {
      // best-effort aggregation; transaction history falls back to empty
    }

    const ownerName = business.owner
      ? `${business.owner.firstName || ''} ${business.owner.lastName || ''}`.trim() ||
        business.owner.email
      : null;

    return {
      id: business.id,
      name: business.name,
      owner: ownerName,
      plan: field.plan,
      mrr: field.mrr,
      status: String(business.status).toUpperCase(),
      joinDate: business.createdAt
        ? new Date(business.createdAt).toISOString().split('T')[0]
        : null,
      renewalDate: field.renewalDate,
      lastPaymentDate: field.lastPaymentDate,
      agentId: field.agentId,
      agentName: field.agentName,
      smsUsed: field.smsUsed,
      emailUsed: field.emailUsed,
      transactions,
    };
  }

  async findSuspendedAdmin(query: {
    page?: number;
    limit?: number;
    cursor?: string;
  }) {
    const qb = this.businessesRepository
      .createQueryBuilder('business')
      .leftJoinAndSelect('business.owner', 'owner')
      .leftJoinAndSelect('business.category', 'category')
      .leftJoinAndSelect('business.subcategory', 'subcategory')
      .where('business.status = :status', { status: BusinessStatus.SUSPENDED });

    const result = await paginateWithCursor({
      queryBuilder: qb,
      cursor: query.cursor,
      page: query.page,
      limit: query.limit,
      sortField: 'suspendedAt',
      sortOrder: 'DESC',
      entityAlias: 'business',
    });

    return {
      data: result.data,
      cursor: result.cursor,
      nextCursor: result.nextCursor,
      prevCursor: result.prevCursor,
      hasNextPage: result.hasNextPage,
      meta: {
        total: result.total,
        page: result.page,
        lastPage: result.meta.lastPage,
      },
    };
  }

  async findPendingVerificationAdmin(query: {
    page?: number;
    limit?: number;
    cursor?: string;
  }) {
    const qb = this.businessesRepository
      .createQueryBuilder('business')
      .leftJoinAndSelect('business.owner', 'owner')
      .leftJoinAndSelect('business.category', 'category')
      .leftJoinAndSelect('business.subcategory', 'subcategory')
      .where('business.isVerified = :isVerified', { isVerified: false });

    const result = await paginateWithCursor({
      queryBuilder: qb,
      cursor: query.cursor,
      page: query.page,
      limit: query.limit,
      sortField: 'createdAt',
      sortOrder: 'DESC',
      entityAlias: 'business',
    });

    const items = result.data;
    const total = result.total;

    // 2. Stats for verification
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const verifiedToday = await this.businessesRepository
      .createQueryBuilder('business')
      .where('business.isVerified = :verified', { verified: true })
      .andWhere('business.verifiedAt >= :today', { today: todayStart })
      .getCount();

    // 3. Average Wait Time for verification (from creation to verifiedAt)
    const waitTimeData = await this.businessesRepository
      .createQueryBuilder('business')
      .select(
        'AVG(EXTRACT(EPOCH FROM (business.verifiedAt - business.createdAt)))',
        'avgSeconds',
      )
      .where('business.isVerified = :verified', { verified: true })
      .andWhere('business.verifiedAt >= :today', { today: todayStart })
      .getRawOne<{ avgSeconds: string | null }>();

    const avgWaitHours = waitTimeData?.avgSeconds
      ? (parseFloat(waitTimeData.avgSeconds) / 3600).toFixed(1)
      : '0.0';

    return {
      data: items,
      meta: {
        total,
        page: result.page,
        lastPage: Math.ceil(total / (result.limit || 10)),
        cursor: result.cursor,
        nextCursor: result.nextCursor,
      },
      stats: {
        totalPending: total,
        verifiedToday,
        avgWaitTime: avgWaitHours,
      },
    };
  }

  async adminCreate(dto: AdminCreateBusinessDto): Promise<Business> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: dto.ownerEmail.toLowerCase() },
    });

    if (existingUser && existingUser.status !== UserStatus.PENDING) {
      throw new ConflictException('A user with that email already exists');
    }

    if (dto.ownerPhone) {
      const existingUserByPhone = await this.usersRepository.findOne({
        where: { phone: dto.ownerPhone },
      });

      if (
        existingUserByPhone &&
        (!existingUser || existingUserByPhone.id !== existingUser.id)
      ) {
        throw new BadRequestException(
          'A user with that phone number already exists',
        );
      }
    }

    if (dto.businessNumber) {
      const existingBusinessByPhone = await this.findByPhone(
        dto.businessNumber,
      );
      if (existingBusinessByPhone) {
        throw new BadRequestException(
          'A business with this phone number already exists',
        );
      }
    }

    const hashedPassword = await bcrypt.hash(dto.ownerPassword, 10);
    let user: User;

    if (existingUser) {
      existingUser.firstName = dto.ownerFirstName;
      existingUser.lastName = dto.ownerLastName;
      existingUser.password = hashedPassword;
      existingUser.phone = dto.ownerPhone || existingUser.phone;
      user = await this.usersRepository.save(existingUser);
    } else {
      user = this.usersRepository.create({
        firstName: dto.ownerFirstName,
        lastName: dto.ownerLastName,
        email: dto.ownerEmail.toLowerCase(),
        password: hashedPassword,
        role: UserRole.OWNER,
        status: UserStatus.ACTIVE,
        phone: dto.ownerPhone,
      });
      user = await this.usersRepository.save(user);
    }

    const goalString = Array.isArray(dto.goals)
      ? dto.goals.join(', ')
      : (dto.goals as any);

    const business = await this.create({
      name: dto.name,
      ownerId: user.id,
      status: dto.status || BusinessStatus.ACTIVE,
      categoryId: dto.categoryId,
      subcategoryId: dto.subcategoryId,
      otherSubcategoryName: dto.otherSubcategoryName,
      monthlyVisitors: dto.visitors,
      goal: goalString,
      logoUrl: dto.logoUrl,
      address: dto.address,
      website: dto.website,
      state: dto.state,
      city: dto.city,
      whatsappNumber: dto.whatsappNumber,
      officialEmail: dto.officialEmail,
      phone: dto.businessNumber,
      isRegistered: dto.isRegistered,
      registrationNumber: dto.registrationNumber,
      documents: dto.documents,
      engagement: dto.engagement,
    });

    // Ensure user status is active and linked to branch (linked during this.create)
    user.status = UserStatus.ACTIVE;
    await this.usersRepository.save(user);

    // Automatically generate a device for the Main Branch (already handled in this.create)

    // Auto-subscribe to free plan
    try {
      await this.subscriptionsService.subscribeToFreePlan(business.id);
    } catch (error) {
      console.error(
        'Failed to auto-subscribe to free plan during admin create:',
        error,
      );
    }

    return business;
  }

  async adminDelete(id: string): Promise<void> {
    const business = await this.findById(id);
    await this.businessesRepository.remove(business);
  }

  async approve(id: string): Promise<Business> {
    const business = await this.findById(id);
    business.status = BusinessStatus.ACTIVE;
    return this.businessesRepository.save(business);
  }

  async verify(id: string): Promise<Business> {
    const business = await this.findById(id);
    business.isVerified = true;
    business.verifiedAt = new Date();
    return this.businessesRepository.save(business);
  }

  async unverify(id: string): Promise<Business> {
    const business = await this.findById(id);
    business.isVerified = false;
    business.verifiedAt = null;
    return this.businessesRepository.save(business);
  }

  async reject(id: string): Promise<void> {
    const business = await this.findById(id);
    await this.businessesRepository.remove(business);
  }

  async suspend(id: string, reason: string): Promise<Business> {
    const business = await this.findById(id);
    business.status = BusinessStatus.SUSPENDED;
    business.suspensionReason = reason;
    business.suspendedAt = new Date();
    return this.businessesRepository.save(business);
  }

  async reactivate(id: string): Promise<Business> {
    const business = await this.findById(id);
    business.status = BusinessStatus.ACTIVE;
    business.suspensionReason = null as any;
    business.suspendedAt = null as any;
    return this.businessesRepository.save(business);
  }

  async getBusinessStatsForAdmin(businessId: string) {
    const business = await this.findById(businessId);

    const branches = await this.branchRepository.find({
      where: { businessId },
    });
    const branchIds = branches.map((b) => b.id);

    const totalBranches = branches.length;

    let totalTaps = 0;
    let totalVisitors = 0;
    let recentVisits: Visit[] = [];

    if (branchIds.length > 0) {
      totalTaps = await this.visitRepository.count({
        where: { branchId: In(branchIds) },
      });

      const totalVisitorsRaw = (await this.visitRepository
        .createQueryBuilder('visit')
        .where('visit.branchId IN (:...branchIds)', { branchIds })
        .select('COUNT(DISTINCT visit.customerId)', 'count')
        .getRawOne()) as { count: string };
      totalVisitors = parseInt(totalVisitorsRaw?.count || '0');

      recentVisits = await this.visitRepository.find({
        where: { branchId: In(branchIds) },
        relations: ['customer', 'branch'],
        order: { createdAt: 'DESC' },
        take: 5,
      });
    }

    return {
      businessName: business.name,
      totalVisitors,
      totalTaps,
      totalBranches,
      recentActivity: recentVisits.map((visit) => ({
        id: visit.id,
        visitorName:
          `${visit.customer?.firstName || ''} ${visit.customer?.lastName || ''}`.trim(),
        branchName: visit.branch?.name || 'Main Office',
        status: visit.status,
        timestamp: visit.createdAt,
      })),
    };
  }

  async findMainBranch(businessId: string): Promise<Branch | null> {
    return this.branchRepository.findOne({
      where: { businessId, isMainBranch: true },
    });
  }

  private toNumber(value: number | string): number {
    return Number(value) || 0;
  }

  async getStats() {
    const [totalBusinesses, activeBusinesses, churnedCount, statusRaw] =
      await Promise.all([
        this.businessesRepository.count(),
        this.businessesRepository.count({ where: { status: 'active' as any } }),
        this.businessesRepository.count({
          where: { status: 'suspended' as any },
        }),
        this.businessesRepository
          .createQueryBuilder('b')
          .select('b.status', 'status')
          .addSelect('COUNT(b.id)', 'count')
          .groupBy('b.status')
          .getRawMany<{ status: string; count: string }>(),
      ]);

    const statusDistribution = statusRaw.map((r) => ({
      status: String(r.status).toUpperCase(),
      count: parseInt(r.count, 10),
    }));

    const churnRate =
      totalBusinesses > 0
        ? Math.round((churnedCount / totalBusinesses) * 1000) / 10
        : 0;

    const activeSubscriptions = await this.subscriptionRepository.find({
      where: { status: SubscriptionStatus.ACTIVE },
      relations: ['plan'],
    });

    const totalMrr = activeSubscriptions.reduce(
      (sum, sub) => sum + this.toNumber(sub.plan?.monthlyPrice ?? 0),
      0,
    );

    const planMap = new Map<string, { count: number; totalMrr: number }>();
    for (const sub of activeSubscriptions) {
      const planName = sub.plan?.name ?? 'UNKNOWN';
      const entry = planMap.get(planName) ?? { count: 0, totalMrr: 0 };
      entry.count += 1;
      entry.totalMrr += this.toNumber(sub.plan?.monthlyPrice ?? 0);
      planMap.set(planName, entry);
    }

    const planDistribution = Array.from(planMap.entries()).map(
      ([plan, data]) => ({
        plan,
        count: data.count,
        totalMrr: data.totalMrr,
      }),
    );

    let bestSellingPlan: {
      plan: string;
      totalMrr: number;
      businessCount: number;
    } | null = null;

    if (planDistribution.length > 0) {
      const sorted = [...planDistribution].sort(
        (a, b) => b.totalMrr - a.totalMrr,
      );
      bestSellingPlan = {
        plan: sorted[0].plan,
        totalMrr: sorted[0].totalMrr,
        businessCount: sorted[0].count,
      };
    }

    return {
      activeBusinesses,
      totalMrr: Math.round(totalMrr * 100) / 100,
      churnRate,
      churnedCount,
      totalBusinesses,
      bestSellingPlan,
      planDistribution,
      statusDistribution,
    };
  }
}
