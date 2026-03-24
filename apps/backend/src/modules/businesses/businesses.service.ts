import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Business, BusinessStatus } from './entities/business.entity';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { AdminCreateBusinessDto } from './dto/admin-create-business.dto';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { ImportCustomersDto } from './dto/import-customers.dto';
import { MailService } from '../mail/mail.service';
import { Branch } from '../branches/entities/branch.entity';
import { Visit } from '../visitors/entities/visit.entity';
import { DevicesService } from '../devices/devices.service';
import { Reward } from '../loyalty/entities/reward.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

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
  ) {}

  async create(
    businessData: Partial<Business> & {
      logoUrl?: string;
      address?: string;
      website?: string;
      state?: string;
      city?: string;
      whatsappNumber?: string;
      officialEmail?: string;
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
      whatsappNumber,
      officialEmail,
      phone,
      ...businessBaseData
    } = businessData;

    const business = this.businessesRepository.create({
      ...businessBaseData,
      officialEmail,
      phone,
      logoUrl,
      address,
      website,
      state,
      city,
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
      website,
      whatsappNumber,
      officialEmail: officialEmail,
      phone: phone,
    } as any); // Cast to any because the repository might not be updated yet in TS context
    const savedBranch = (await this.branchRepository.save(
      mainBranch,
    )) as unknown as Branch;

    // Link owner to the main branch
    if (businessData.ownerId) {
      await this.usersRepository.update(businessData.ownerId, {
        branchId: savedBranch.id,
      });
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
      where: { uniqueCode, status: BusinessStatus.ACTIVE },
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
    Object.assign(business, updateBusinessDto);
    return this.businessesRepository.save(business);
  }

  async importCustomers(branchId: string, importDto: ImportCustomersDto) {
    const defaultPassword = '123456';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
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
            defaultPassword,
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
    qb.skip((page - 1) * limit).take(limit);
    qb.orderBy('business.createdAt', 'DESC');

    const [businesses, total] = await qb.getManyAndCount();

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
      data: businesses,
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

  async findSuspendedAdmin(query: { page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 10;

    const [businesses, total] = await this.businessesRepository.findAndCount({
      where: { status: BusinessStatus.SUSPENDED },
      relations: ['owner', 'category', 'subcategory'],
      order: { suspendedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: businesses,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findPendingVerificationAdmin(query: { page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 10;

    // 1. Get businesses that are NOT verified
    const [items, total] = await this.businessesRepository.findAndCount({
      where: { isVerified: false },
      relations: ['owner', 'category', 'subcategory'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

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
        page,
        lastPage: Math.ceil(total / limit),
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
      existingUser.engagement = dto.engagement;
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
        engagement: dto.engagement,
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
    } as any);

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
}
