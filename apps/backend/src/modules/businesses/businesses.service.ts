import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business, BusinessStatus } from './entities/business.entity';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { AdminCreateBusinessDto } from './dto/admin-create-business.dto';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { ImportCustomersDto } from './dto/import-customers.dto';
import { MailService } from '../mail/mail.service';
import { Branch } from '../branches/entities/branch.entity';
import { Visit } from '../visitors/entities/visit.entity';

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
    private readonly mailService: MailService,
  ) { }

  async create(businessData: Partial<Business>): Promise<Business> {
    if (businessData.ownerId) {
      const existing = await this.findByOwner(businessData.ownerId);
      if (existing) {
        throw new ConflictException('Owner already has a business');
      }
    }
    const business = this.businessesRepository.create(businessData);
    return this.businessesRepository.save(business);
  }

  async findByOwner(ownerId: string): Promise<Business | null> {
    return this.businessesRepository.findOne({ where: { ownerId } });
  }

  async findById(id: string): Promise<Business> {
    const business = await this.businessesRepository.findOne({
      where: { id },
      relations: ['rewards', 'branches'],
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    return business;
  }

  async update(
    id: string,
    updateBusinessDto: UpdateBusinessDto,
  ): Promise<Business> {
    const business = await this.findById(id);
    Object.assign(business, updateBusinessDto);
    return this.businessesRepository.save(business);
  }

  async importCustomers(businessId: string, importDto: ImportCustomersDto) {
    const defaultPassword = 'mypassword';
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
          status: UserStatus.ACTIVE,
          businessId,
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
    page?: number;
    limit?: number;
  }) {
    const qb = this.businessesRepository
      .createQueryBuilder('business')
      .leftJoinAndSelect('business.owner', 'owner')
      .leftJoinAndSelect('business.devices', 'devices');

    if (query.status) {
      const normalizedStatus = String(
        query.status,
      ).toLowerCase() as BusinessStatus;
      qb.andWhere('business.status = :status', { status: normalizedStatus });
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
      .getRawOne();

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

  async adminCreate(dto: AdminCreateBusinessDto): Promise<Business> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: dto.ownerEmail },
    });

    if (existingUser) {
      throw new ConflictException('A user with that email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.ownerPassword, 10);
    const ownerUser = this.usersRepository.create({
      firstName: dto.ownerFirstName,
      lastName: dto.ownerLastName,
      email: dto.ownerEmail,
      password: hashedPassword,
      phone: dto.ownerPhone,
      role: UserRole.OWNER,
    });

    const savedUser = await this.usersRepository.save(ownerUser);

    const business = this.businessesRepository.create({
      name: dto.name,
      ownerId: savedUser.id,
      type: dto.type,
      status: dto.status || BusinessStatus.ACTIVE,
      logoUrl: dto.logoUrl,
      address: dto.address,
      website: dto.website,
      whatsappNumber: dto.whatsappNumber,
      officialEmail: dto.officialEmail,
    });

    const savedBusiness = await this.businessesRepository.save(business);

    // Link businessId back to user for proper context
    savedUser.businessId = savedBusiness.id;
    await this.usersRepository.save(savedUser);

    return savedBusiness;
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

  async reject(id: string): Promise<void> {
    const business = await this.findById(id);
    // Hard delete or set status to something else if you don't wanna delete. Here we hard delete from queue.
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

    const totalBranches = await this.branchRepository.count({
      where: { businessId },
    });

    const totalTaps = await this.visitRepository.count({
      where: { businessId },
    });

    const totalVisitors = await this.visitRepository
      .createQueryBuilder('visit')
      .where('visit.businessId = :businessId', { businessId })
      .select('COUNT(DISTINCT visit.customerId)', 'count')
      .getRawOne();

    return {
      businessName: business.name,
      totalVisitors: parseInt(totalVisitors?.count || '0'),
      totalTaps,
      totalBranches,
    };
  }
}
