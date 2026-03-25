import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, FindOptionsWhere } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { Visit } from './entities/visit.entity';
import { Device, DeviceStatus } from '../devices/entities/device.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { VisitorQueryDto } from './dto/visitor-query.dto';
import {
  VisitorResponseDto,
  PaginatedVisitorResponseDto,
  NewVisitorResponseDto,
  ReturningVisitorResponseDto,
} from './dto/visitor-response.dto';
import { VisitorStatsResponseDto } from './dto/visitor-stats.dto';
import { CreateVisitorDto } from './dto/create-visitor.dto';
import { VisitorSignupDto } from './dto/visitor-signup.dto';
import { MessagingEngineService } from '../messaging/services/messaging-engine.service';
import { AutomationService } from '../messaging/services/automation.service';
import { TriggerType } from '../messaging/enums/automation.enum';
import { Channel } from '../messaging/enums/channel.enum';
import { CampaignsService } from '../campaigns/campaigns.service';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { MessageLog } from '../messaging/entities/message-log.entity';
import { BranchesService } from '../branches/branches.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { PointTransaction } from '../loyalty/entities/point-transaction.entity';
import { RedemptionCode } from '../loyalty/entities/redemption-code.entity';
import { Reward } from '../loyalty/entities/reward.entity';

export class RecordVisitResponse {
  message: string;
  visit: {
    id: string;
    createdAt: Date;
  };
  loyalty: any | null;
  context: {
    branchId: string;
  };
}

export class SendCampaignBody {
  channel: Channel;
  message: string;
}

import { VisitedBranchesQueryDto } from './dto/visited-branches-query.dto';
import { PaginatedVisitedBranchResponseDto } from './dto/visited-branch-response.dto';
import { AdminVisitorActivitiesQueryDto } from './dto/admin-visitor-activities-query.dto';
import { PaginatedVisitResponseDto } from './dto/visit-response.dto';

@Injectable()
export class VisitorsService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Visit)
    private visitRepository: Repository<Visit>,
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>,
    @InjectRepository(Contact)
    private contactRepository: Repository<Contact>,
    private dataSource: DataSource,
    private messagingService: MessagingEngineService,
    private campaignsService: CampaignsService,
    private automationService: AutomationService,
    private mailService: MailService,
    private branchesService: BranchesService,
    private loyaltyService: LoyaltyService,
  ) {}

  async getVisitedBranches(
    customerId: string,
    query: VisitedBranchesQueryDto,
  ): Promise<PaginatedVisitedBranchResponseDto> {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const qb = this.visitRepository
      .createQueryBuilder('visit')
      .innerJoinAndSelect('visit.branch', 'branch')
      .where('visit.customerId = :customerId', { customerId });

    if (search) {
      qb.andWhere('branch.name ILIKE :search', { search: `%${search}%` });
    }

    qb.select([
      'branch.id as id',
      'branch.name as name',
      'branch.address as address',
      'branch.city as city',
      'branch.logoUrl as "logoUrl"',
      'branch.businessId as "businessId"',
      'MAX(visit.createdAt) as "lastVisitedAt"',
      'COUNT(visit.id) as "visitCount"',
    ]);

    qb.groupBy('branch.id')
      .orderBy('"lastVisitedAt"', 'DESC')
      .offset(skip)
      .limit(limit);

    const rawData = await qb.getRawMany();

    // For total count, we need another query to count grouped branches
    const countQb = this.visitRepository
      .createQueryBuilder('visit')
      .innerJoin('visit.branch', 'branch')
      .where('visit.customerId = :customerId', { customerId });

    if (search) {
      countQb.andWhere('branch.name ILIKE :search', { search: `%${search}%` });
    }

    const total = await countQb
      .select('COUNT(DISTINCT visit.branchId)', 'count')
      .getRawOne();

    return {
      data: rawData.map((row) => ({
        id: row.id,
        name: row.name,
        address: row.address,
        city: row.city,
        logoUrl: row.logoUrl,
        businessId: row.businessId,
        lastVisitedAt: new Date(row.lastVisitedAt),
        visitCount: parseInt(row.visitCount, 10),
      })),
      total: parseInt(total.count, 10),
      page,
      limit,
    };
  }

  async checkBranchAccess(user: User, branchId: string): Promise<boolean> {
    return this.branchesService.checkBranchAccess(user, branchId);
  }

  // --- Main/All Visitors ---

  async findAll(
    query: VisitorQueryDto,
    branchId?: string,
    businessId?: string,
  ): Promise<PaginatedVisitorResponseDto> {
    const { page = 1, limit = 10, search, status } = query;
    const skip = (page - 1) * limit;

    const qb = this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.visits', 'visit')
      .where('user.role = :role', { role: UserRole.CUSTOMER });

    if (branchId) {
      qb.andWhere('visit.branchId = :branchId', { branchId });
    } else if (businessId) {
      qb.andWhere('visit.businessId = :businessId', { businessId });
    }

    if (search) {
      qb.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search OR user.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.select('user.id');
    qb.groupBy('user.id');

    const [usersRaw, total] = await qb.getManyAndCount();

    if (usersRaw.length === 0) {
      return { data: [], total: 0, page, limit };
    }

    const userIds = usersRaw.map((u) => u.id);

    const fullQb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.visits', 'visit')
      .where('user.id IN (:...userIds)', { userIds });

    if (branchId) {
      fullQb.andWhere('visit.branchId = :branchId', { branchId });
    } else if (businessId) {
      fullQb.andWhere('visit.businessId = :businessId', { businessId });
    }

    const users = await fullQb
      .orderBy('visit.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    const data: VisitorResponseDto[] = users.map((user) =>
      this.mapToVisitorDto(user),
    );

    let filteredData = data;
    if (status && status !== 'all') {
      filteredData = data.filter(
        (v) => v.status.toLowerCase() === status.toLowerCase(),
      );
    }

    return {
      data: filteredData,
      total,
      page,
      limit,
    };
  }

  async getStats(
    branchId?: string,
    businessId?: string,
  ): Promise<VisitorStatsResponseDto> {
    const contextWhere: any = {};
    if (branchId) contextWhere.branchId = branchId;
    else if (businessId) contextWhere.businessId = businessId;

    // Total unique visitors in this context
    const totalVisitorsRaw = await this.visitRepository
      .createQueryBuilder('visit')
      .where(contextWhere)
      .select('COUNT(DISTINCT visit.customerId)', 'count')
      .getRawOne();
    const totalVisitors = parseInt(totalVisitorsRaw?.count || '0', 10);

    // Total visits in this context
    const totalVisitsCount = await this.visitRepository.count({
      where: contextWhere,
    });

    // New Visitors in this context: Customers whose FIRST visit in this branch/business was this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newVisitorsRaw = await this.visitRepository
      .createQueryBuilder('visit')
      .select('visit.customerId')
      .where(contextWhere)
      .groupBy('visit.customerId')
      .having('MIN(visit.createdAt) >= :startOfMonth', { startOfMonth })
      .getRawMany();
    const newVisitorsCount = newVisitorsRaw.length;

    // Returning Visitors: Customers with more than 1 visit in this context
    const returningVisitorsRaw = await this.visitRepository
      .createQueryBuilder('visit')
      .select('visit.customerId')
      .where(contextWhere)
      .groupBy('visit.customerId')
      .having('COUNT(visit.id) > 1')
      .getRawMany();
    const returningCount = returningVisitorsRaw.length;

    const avgFrequency =
      totalVisitors > 0 ? (totalVisitsCount / totalVisitors).toFixed(1) : '0';

    return {
      stats: [
        {
          label: 'Total Visitors',
          value: totalVisitors.toLocaleString(),
          icon: 'users',
          color: 'blue',
          trend: { value: '+0%', isUp: true },
        },
        {
          label: 'New This Month',
          value: newVisitorsCount.toLocaleString(),
          icon: 'user-plus',
          color: 'green',
          trend: { value: '+0%', isUp: true },
        },
        {
          label: 'Avg. Frequency',
          value: avgFrequency,
          icon: 'repeat',
          color: 'purple',
          trend: { value: '0', isUp: true },
        },
        {
          label: 'Returning Visitors',
          value: returningCount.toLocaleString(),
          icon: 'refresh-cw',
          color: 'orange',
          trend: { value: '0', isUp: true },
        },
      ],
    };
  }

  async create(
    createVisitorDto: CreateVisitorDto | VisitorSignupDto,
    branchId: string,
  ): Promise<VisitorResponseDto> {
    const dto = createVisitorDto as CreateVisitorDto & {
      deviceId?: string;
    };

    // Check by email
    let user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    // Check by phone if provided and user not found by email
    if (!user && dto.phone) {
      user = await this.userRepository.findOne({
        where: { phone: dto.phone },
      });
      if (user && user.email !== dto.email) {
        throw new BadRequestException(
          'A user with this phone number already exists with a different email',
        );
      }
    }

    const defaultPassword = '123456';

    if (!user) {
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      user = this.userRepository.create({
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        password: hashedPassword,
        role: UserRole.CUSTOMER,
        uniqueCode: `CUST-${Math.floor(100000 + Math.random() * 900000)}`,
      });
      await this.userRepository.save(user);

      await this.mailService.sendWelcomeEmail(
        user.email,
        `${user.firstName} ${user.lastName}`.trim() || 'Visitor',
        defaultPassword,
      );
    }

    const branch = await this.branchRepository.findOne({
      where: { id: branchId },
    });
    if (!branch) {
      throw new NotFoundException(`Branch with ID ${branchId} not found`);
    }

    const visit = this.visitRepository.create({
      customer: user,
      branchId,
      businessId: branch.businessId,
      deviceId: dto.deviceId,
      status: 'new',
    } as any) as unknown as Visit;
    await this.visitRepository.save(visit);

    let contact = await this.contactRepository.findOne({
      where: [
        { branchId, email: user.email },
        { branchId, phone: user.phone },
      ],
    });

    if (!contact) {
      contact = this.contactRepository.create({
        branchId,
        businessId: branch.businessId,
        email: user.email,
        phone: user.phone,
        name: `${user.firstName} ${user.lastName}`,
        optInChannels: [Channel.SMS, Channel.EMAIL, Channel.WHATSAPP],
      } as any) as unknown as Contact;
      await this.contactRepository.save(contact);
    }

    const visitCount = await this.visitRepository.count({
      where: { customer: { id: user.id }, branchId },
    });

    const triggerType =
      visitCount === 1 ? TriggerType.FIRST_TAG : TriggerType.REPEAT_TAG;

    await this.automationService.trigger(triggerType, {
      branchId,
      customerId: user.id,
    });

    const updatedUser = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['visits'],
      order: {
        visits: {
          createdAt: 'DESC',
        },
      },
    });

    return this.mapToVisitorDto(updatedUser!);
  }

  async recordVisit(
    userId: string,
    deviceCode: string,
  ): Promise<RecordVisitResponse> {
    const user = await this.userRepository.findOne({
      where: { id: userId, role: UserRole.CUSTOMER },
    });
    if (!user) {
      throw new NotFoundException('Customer not found');
    }

    const device = await this.deviceRepository.findOne({
      where: { code: deviceCode, status: DeviceStatus.ACTIVE },
      relations: ['branch'],
    });
    if (!device) {
      throw new NotFoundException(
        `Active device with code ${deviceCode} not found`,
      );
    }

    const branchId = device.branchId;
    const businessId = device.branch?.businessId;

    const visit = this.visitRepository.create({
      customer: user,
      branchId,
      businessId,
      deviceId: device.id,
      status: 'returning',
    } as any) as unknown as Visit;
    await this.visitRepository.save(visit);

    device.totalScans += 1;
    await this.deviceRepository.save(device);

    let contact = await this.contactRepository.findOne({
      where: [
        { branchId, email: user.email },
        { branchId, phone: user.phone },
      ],
    });

    if (!contact) {
      contact = this.contactRepository.create({
        branchId,
        businessId,
        email: user.email,
        phone: user.phone,
        name: `${user.firstName} ${user.lastName}`.trim(),
        optInChannels: [Channel.SMS, Channel.EMAIL, Channel.WHATSAPP],
      } as any) as unknown as Contact;
      await this.contactRepository.save(contact);
    }

    const visitCount = await this.visitRepository.count({
      where: {
        customer: { id: user.id },
        branchId,
      },
    });

    await this.automationService.trigger(
      visitCount === 1 ? TriggerType.FIRST_TAG : TriggerType.REPEAT_TAG,
      {
        branchId,
        customerId: userId,
      },
    );

    // Points awarding logic should be moved to a generic "award points on tap" if needed,
    // but based on requirements, points are given by staff or via code.
    // However, if we want to keep the "tap to earn points" feature, we can award 1 point.
    const loyaltyResult: any = null;
    // For now, points are manual or via code as per the new requirements.

    return {
      message: 'Visit recorded successfully',
      visit: {
        id: visit.id,
        createdAt: visit.createdAt,
      },
      loyalty: loyaltyResult,
      context: {
        branchId,
      },
    };
  }

  async findOne(
    id: string,
    branchId?: string,
    businessId?: string,
  ): Promise<VisitorResponseDto> {
    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.visits', 'visit')
      .where('user.id = :id', { id });

    if (branchId) {
      qb.andWhere('visit.branchId = :branchId', { branchId });
    } else if (businessId) {
      qb.andWhere('visit.businessId = :businessId', { businessId });
    }

    const user = await qb.orderBy('visit.createdAt', 'DESC').getOne();

    if (!user) {
      // If user exists but has no visits in this context, we still return the user if they exist globally
      const baseUser = await this.userRepository.findOne({ where: { id } });
      if (!baseUser) throw new NotFoundException('Visitor not found');
      return this.mapToVisitorDto(baseUser);
    }

    return this.mapToVisitorDto(user);
  }

  async update(
    id: string,
    updateData: Partial<CreateVisitorDto>,
  ): Promise<VisitorResponseDto> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Visitor not found');

    if (updateData.firstName) user.firstName = updateData.firstName;
    if (updateData.lastName) user.lastName = updateData.lastName;
    if (updateData.email) user.email = updateData.email;
    if (updateData.phone) user.phone = updateData.phone;

    await this.userRepository.save(user);
    // Note: We return findOne without context here as update is generally global,
    // but the controller will call findOne with context if needed next time.
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.userRepository.softDelete(id);
  }

  // --- New Visitors ---

  async findNew(
    query: VisitorQueryDto,
    branchId?: string,
    businessId?: string,
  ): Promise<{ data: NewVisitorResponseDto[]; total: number }> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    const qb = this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.visits', 'visit')
      .where('user.createdAt >= :startOfWeek', { startOfWeek })
      .andWhere('user.role = :role', { role: UserRole.CUSTOMER });

    if (branchId) {
      qb.andWhere('visit.branchId = :branchId', { branchId });
    } else if (businessId) {
      qb.andWhere('visit.businessId = :businessId', { businessId });
    }

    const [users, total] = await qb
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const dtos = users.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phone: u.phone,
      joined: u.createdAt,
      source: 'Direct/NFC',
      status: 'New',
    }));

    return { data: dtos, total };
  }

  async getNewStats(
    branchId?: string,
    businessId?: string,
  ): Promise<VisitorStatsResponseDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newTodayQb = this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.visits', 'visit')
      .andWhere('user.role = :role', { role: UserRole.CUSTOMER })
      .andWhere('user.createdAt >= :today', { today });

    if (branchId) {
      newTodayQb.andWhere('visit.branchId = :branchId', { branchId });
    } else if (businessId) {
      newTodayQb.andWhere('visit.businessId = :businessId', { businessId });
    }

    const newToday = await newTodayQb.getCount();

    const startOfWeek = new Date();
    startOfWeek.setDate(1);
    startOfWeek.setHours(0, 0, 0, 0);
    const newWeeklyQb = this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.visits', 'visit')
      .andWhere('user.role = :role', { role: UserRole.CUSTOMER })
      .andWhere('user.createdAt >= :startOfWeek', { startOfWeek });

    if (branchId) {
      newWeeklyQb.andWhere('visit.branchId = :branchId', { branchId });
    } else if (businessId) {
      newWeeklyQb.andWhere('visit.businessId = :businessId', { businessId });
    }

    const newWeekly = await newWeeklyQb.getCount();

    return {
      stats: [
        {
          label: 'New Today',
          value: newToday.toLocaleString(),
          icon: 'user-plus',
          color: 'green',
          trend: { value: '0%', isUp: true },
        },
        {
          label: 'New This Week',
          value: newWeekly.toLocaleString(),
          icon: 'calendar',
          color: 'blue',
          trend: { value: '0%', isUp: true },
        },
        {
          label: 'Conversion Rate',
          value: '100%',
          icon: 'trending-up',
          color: 'purple',
          trend: { value: '0%', isUp: true },
        },
        {
          label: 'Top Source',
          value: 'NFC Tag',
          icon: 'tag',
          color: 'yellow',
          trend: { value: 'N/A', isUp: true },
        },
      ],
    };
  }

  // --- Returning Visitors ---

  async findReturning(
    query: VisitorQueryDto,
    branchId?: string,
    businessId?: string,
  ): Promise<{ data: ReturningVisitorResponseDto[]; total: number }> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const qb = this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.visits', 'visit')
      .andWhere('user.role = :role', { role: UserRole.CUSTOMER });

    if (branchId) {
      qb.andWhere('visit.branchId = :branchId', { branchId });
    } else if (businessId) {
      qb.andWhere('visit.businessId = :businessId', { businessId });
    }

    qb.groupBy('user.id')
      .having('COUNT(visit.id) > 1')
      .select([
        'user.id',
        'user.firstName',
        'user.lastName',
        'user.email',
        'user.phone',
        'COUNT(visit.id) as total_visits',
        'MAX(visit.createdAt) as last_visit',
      ]);

    const rawData: Array<{
      user_id: string;
      user_firstName: string;
      user_lastName: string;
      user_email: string;
      user_phone: string;
      total_visits: string;
      last_visit: string;
    }> = await qb
      .orderBy('user.createdAt', 'DESC')
      .offset(skip)
      .limit(limit)
      .getRawMany();

    const totalQb = this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.visits', 'visit')
      .andWhere('user.role = :role', { role: UserRole.CUSTOMER });

    if (branchId) {
      totalQb.andWhere('visit.branchId = :branchId', { branchId });
    } else if (businessId) {
      totalQb.andWhere('visit.businessId = :businessId', { businessId });
    }

    const total = await totalQb
      .groupBy('user.id')
      .having('COUNT(visit.id) > 1')
      .getCount();

    const dtos = rawData.map((r) => ({
      id: r.user_id,
      firstName: r.user_firstName,
      lastName: r.user_lastName,
      email: r.user_email,
      phone: r.user_phone,
      totalVisits: parseInt(r.total_visits, 10),
      frequency: parseInt(r.total_visits, 10) > 5 ? 'Monthly' : 'Weekly',
      lastVisit: new Date(r.last_visit),
      status: 'Returning',
    }));

    return { data: dtos, total };
  }

  async getReturningStats(
    branchId?: string,
    businessId?: string,
  ): Promise<VisitorStatsResponseDto> {
    const totalVisitorsQb = this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.visits', 'visit')
      .andWhere('user.role = :role', { role: UserRole.CUSTOMER });

    if (branchId) {
      totalVisitorsQb.andWhere('visit.branchId = :branchId', { branchId });
    } else if (businessId) {
      totalVisitorsQb.andWhere('visit.businessId = :businessId', {
        businessId,
      });
    }

    const totalVisitors = await totalVisitorsQb.getCount();

    const returningCountQb = this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.visits', 'visit')
      .andWhere('user.role = :role', { role: UserRole.CUSTOMER });

    if (branchId) {
      returningCountQb.andWhere('visit.branchId = :branchId', { branchId });
    } else if (businessId) {
      returningCountQb.andWhere('visit.businessId = :businessId', {
        businessId,
      });
    }

    const returningCount = await returningCountQb
      .groupBy('user.id')
      .having('COUNT(visit.id) > 1')
      .getCount();

    const rate =
      totalVisitors > 0
        ? ((returningCount / totalVisitors) * 100).toFixed(1)
        : '0';

    const vipCountQb = this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.visits', 'visit')
      .andWhere('user.role = :role', { role: UserRole.CUSTOMER });

    if (branchId) {
      vipCountQb.andWhere('visit.branchId = :branchId', { branchId });
    } else if (businessId) {
      vipCountQb.andWhere('visit.businessId = :businessId', { businessId });
    }

    const vipCount = await vipCountQb
      .groupBy('user.id')
      .having('COUNT(visit.id) > 10')
      .getCount();

    return {
      stats: [
        {
          label: 'Returning Rate',
          value: `${rate}%`,
          icon: 'repeat',
          color: 'blue',
          trend: { value: '0%', isUp: true },
        },
        {
          label: 'Total Returning',
          value: returningCount.toLocaleString(),
          icon: 'users',
          color: 'green',
          trend: { value: '0%', isUp: true },
        },
        {
          label: 'VIP Members',
          value: vipCount.toLocaleString(),
          icon: 'star',
          color: 'yellow',
          trend: { value: '0%', isUp: true },
        },
        {
          label: 'Repeat Factor',
          value: 'High',
          icon: 'trending-up',
          color: 'purple',
          trend: { value: 'N/A', isUp: true },
        },
      ],
    };
  }

  // --- Actions ---

  async export(branchId: string) {
    const visitors = await this.findAll({ page: 1, limit: 1000 }, branchId);
    let csv = 'First Name,Last Name,Email,Phone,Visits,Last Visit,Status\n';
    visitors.data.forEach((v) => {
      csv += `"${v.firstName}","${v.lastName}","${v.email}","${v.phone}",${v.visits},"${v.lastVisit.toISOString()}",${v.status}\n`;
    });
    return {
      message: 'Export successful',
      data: csv,
      filename: `visitors_${branchId}_${new Date().toISOString().split('T')[0]}.csv`,
    };
  }

  async sendCampaign(branchId: string, body: SendCampaignBody) {
    const visitors = await this.findAll({ page: 1, limit: 1000 }, branchId);
    const contactIds = visitors.data.map((v) => v.id);

    const channel = body.channel || Channel.SMS;
    const content = body.message;

    return this.messagingService.sendMessage({
      branchId,
      channel,
      customerIds: contactIds,
      content,
    });
  }

  async sendWelcomeCampaign(branchId: string) {
    const newVisitors = await this.findNew({ page: 1, limit: 1000 }, branchId);
    const contactIds = newVisitors.data.map((v) => v.id);

    return this.messagingService.sendMessage({
      branchId,
      channel: Channel.SMS,
      customerIds: contactIds,
      content: 'Welcome to our business! We are glad to have you.',
    });
  }

  async sendMessage(
    visitorId: string,
    message: string,
    channel: Channel,
    branchId: string,
  ) {
    return this.messagingService.sendMessage({
      branchId,
      channel: channel || Channel.SMS,
      customerIds: [visitorId],
      content: message,
    });
  }

  async sendWelcome(visitorId: string, branchId: string) {
    return this.sendMessage(
      visitorId,
      'Welcome! Thank you for visiting us.',
      Channel.SMS,
      branchId,
    );
  }

  async sendReward(visitorId: string, rewardId: string, branchId: string) {
    const rewards = await this.loyaltyService.getBranchRewards(branchId);
    const reward = rewards.find((r) => r.id === rewardId);

    if (!reward) throw new NotFoundException('Reward not found');

    return this.sendMessage(
      visitorId,
      `You've received a reward: ${reward.name}! Use code REWARD123 to redeem.`,
      Channel.SMS,
      branchId,
    );
  }

  async resetBusinessData(branchId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(Visit, { branchId });
      await manager.delete(MessageLog, { branchId });
      await manager.delete(Contact, { branchId });
      await manager.delete(PointTransaction, { branchId });
      await manager.delete(RedemptionCode, { branchId });
      // Rewards are not deleted usually, but if needed:
      // await manager.delete(Reward, { branchId });
    });
  }

  private mapToVisitorDto(user: User): VisitorResponseDto {
    const visits = user.visits || [];
    // Assuming visits are ordered DESC (latest first) from query
    const lastVisit = visits.length > 0 ? visits[0].createdAt : user.createdAt;
    const visitCount = visits.length;

    let status = 'New';
    if (visitCount > 10) status = 'VIP';
    else if (visitCount > 1) status = 'Returning';
    else if (visitCount === 1) status = 'New';
    else status = 'Inactive';

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      visits: visitCount,
      lastVisit: lastVisit,
      status: status,
      totalSpent: '₦0',
    };
  }

  async findAdminVisitorActivities(
    query: AdminVisitorActivitiesQueryDto,
  ): Promise<PaginatedVisitResponseDto> {
    const { page = 1, limit = 10, search, branchId, businessId } = query;
    const skip = (page - 1) * limit;

    const qb = this.visitRepository
      .createQueryBuilder('visit')
      .leftJoinAndSelect('visit.customer', 'customer')
      .leftJoinAndSelect('visit.branch', 'branch')
      .leftJoinAndSelect('branch.business', 'business');

    if (branchId) {
      qb.andWhere('visit.branchId = :branchId', { branchId });
    }

    if (businessId) {
      qb.andWhere('visit.businessId = :businessId', { businessId });
    }

    if (search) {
      qb.andWhere(
        '(customer.firstName ILIKE :search OR customer.lastName ILIKE :search OR customer.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [visits, total] = await qb
      .orderBy('visit.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: visits.map((visit) => ({
        id: visit.id,
        createdAt: visit.createdAt,
        status: visit.status,
        customer: {
          id: visit.customer?.id,
          firstName: visit.customer?.firstName,
          lastName: visit.customer?.lastName,
          email: visit.customer?.email,
          phone: visit.customer?.phone,
        },
        branch: {
          id: visit.branch?.id,
          name: visit.branch?.name,
        },
        business: {
          id: visit.branch?.business?.id,
          name: visit.branch?.business?.name,
        },
      })),
      total,
      page,
      limit,
    };
  }
}
