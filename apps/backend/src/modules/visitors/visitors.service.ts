import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    private messagingService: MessagingEngineService,
    private campaignsService: CampaignsService,
    private automationService: AutomationService,
    private mailService: MailService,
  ) { }

  // --- Main/All Visitors ---

  async findAll(
    query: VisitorQueryDto,
    businessId: string,
    branchId?: string,
  ): Promise<PaginatedVisitorResponseDto> {
    const { page = 1, limit = 10, search, status } = query;
    const skip = (page - 1) * limit;

    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.visits', 'visit')
      .andWhere('user.role = :role', { role: UserRole.CUSTOMER });

    if (branchId) {
      qb.andWhere('visit.branchId = :branchId', { branchId });
    } else {
      qb.andWhere('visit.businessId = :businessId', { businessId });
    }

    if (search) {
      qb.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search OR user.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Simplified approach: Fetch users with their visits.
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
    } else {
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
    businessId: string,
    branchId?: string,
  ): Promise<VisitorStatsResponseDto> {
    const totalVisitorsQb = this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.visits', 'visit');

    if (branchId) {
      totalVisitorsQb.andWhere('visit.branchId = :branchId', { branchId });
    } else {
      totalVisitorsQb.andWhere('visit.businessId = :businessId', { businessId });
    }
    const totalVisitors = await totalVisitorsQb.getCount();

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newThisMonthQb = this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.visits', 'visit')
      .where('user.createdAt >= :startOfMonth', { startOfMonth });

    if (branchId) {
      newThisMonthQb.andWhere('visit.branchId = :branchId', { branchId });
    } else {
      newThisMonthQb.andWhere('visit.businessId = :businessId', { businessId });
    }
    const newThisMonth = await newThisMonthQb.getCount();

    // Frequency = Total Visits / Total Visitors
    const visitWhere: any = {};
    if (branchId) visitWhere.branchId = branchId;
    else visitWhere.businessId = businessId;

    const totalVisitsCount = await this.visitRepository.count({
      where: visitWhere,
    });
    const avgFrequency =
      totalVisitors > 0 ? (totalVisitsCount / totalVisitors).toFixed(1) : '0';

    // VIP Guests (e.g., > 10 visits)
    const vipCountQb = this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.visits', 'visit');

    if (branchId) {
      vipCountQb.andWhere('visit.branchId = :branchId', { branchId });
    } else {
      vipCountQb.andWhere('visit.businessId = :businessId', { businessId });
    }

    const vipCount = await vipCountQb
      .groupBy('user.id')
      .having('COUNT(visit.id) > 10')
      .getCount();

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
          value: newThisMonth.toLocaleString(),
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
          label: 'VIP Guests',
          value: vipCount.toLocaleString(),
          icon: 'star',
          color: 'yellow',
          trend: { value: '0', isUp: true },
        },
      ],
    };
  }

  async create(
    createVisitorDto: CreateVisitorDto | VisitorSignupDto,
    businessId?: string,
    branchId?: string,
  ): Promise<VisitorResponseDto> {
    const dto = createVisitorDto as any; // Cast for easier access to optional fields
    // Check if user exists
    let user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      const hashedPassword = await bcrypt.hash('mypassword', 10);
      user = this.userRepository.create({
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        password: hashedPassword,
        role: UserRole.CUSTOMER,
      });
      await this.userRepository.save(user);

      // Send Welcome Email
      await this.mailService.sendWelcomeEmail(
        user.email,
        `${user.firstName} ${user.lastName}`.trim() || 'Visitor',
      );
    }

    // Resolve branchId and businessId
    let resolvedBranchId = branchId || dto.branchId;
    let resolvedBusinessId = businessId;

    if (dto.deviceId) {
      const device = await this.deviceRepository.findOne({
        where: { id: dto.deviceId },
      });
      if (device) {
        if (!resolvedBranchId) resolvedBranchId = device.branchId;
        if (!resolvedBusinessId) resolvedBusinessId = device.businessId;
      }
    }

    if (resolvedBranchId && !resolvedBusinessId) {
      const branch = await this.branchRepository.findOne({
        where: { id: resolvedBranchId },
      });
      if (branch) resolvedBusinessId = branch.businessId;
    }

    // Only proceed with business-specific logic if businessId is resolved
    if (resolvedBusinessId) {
      // Validate that branch exists IF provided
      if (resolvedBranchId) {
        const branch = await this.branchRepository.findOne({
          where: { id: resolvedBranchId },
        });
        if (!branch) {
          throw new NotFoundException(
            `Branch with ID ${resolvedBranchId} not found`,
          );
        }
      }

      const visit = this.visitRepository.create({
        customer: user,
        businessId: resolvedBusinessId,
        branchId: resolvedBranchId,
        deviceId: dto.deviceId,
        status: 'new',
      });
      await this.visitRepository.save(visit);

      // Contact Sync
      let contact = await this.contactRepository.findOne({
        where: [
          { businessId: resolvedBusinessId, email: user.email },
          { businessId: resolvedBusinessId, phone: user.phone },
        ],
      });

      if (!contact) {
        contact = this.contactRepository.create({
          businessId: resolvedBusinessId,
          email: user.email,
          phone: user.phone,
          name: `${user.firstName} ${user.lastName}`,
          optInChannels: [Channel.SMS, Channel.EMAIL, Channel.WHATSAPP],
        });
        await this.contactRepository.save(contact);
      }

      const visitWhere: any = { customer: { id: user.id } };
      if (resolvedBranchId) visitWhere.branchId = resolvedBranchId;
      else visitWhere.businessId = resolvedBusinessId;

      const visitCount = await this.visitRepository.count({
        where: visitWhere,
      });

      const triggerType =
        visitCount === 1 ? TriggerType.FIRST_TAG : TriggerType.REPEAT_TAG;

      await this.automationService.trigger(triggerType, {
        businessId: resolvedBusinessId,
        branchId: resolvedBranchId,
        contactId: contact.id,
      });
    }

    // Re-fetch to get full structure
    const updatedUser = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['visits'],
    });

    return this.mapToVisitorDto(updatedUser!);
  }

  async recordVisit(
    userId: string,
    deviceCode: string,
  ): Promise<any> {
    // 1. Identify customer
    const user = await this.userRepository.findOne({
      where: { id: userId, role: UserRole.CUSTOMER },
    });
    if (!user) {
      throw new NotFoundException('Customer not found');
    }

    // 2. Resolve device context
    const device = await this.deviceRepository.findOne({
      where: { code: deviceCode, status: DeviceStatus.ACTIVE },
    });
    if (!device) {
      throw new NotFoundException(`Active device with code ${deviceCode} not found`);
    }

    const businessId = device.businessId;
    const branchId = device.branchId;

    // 3. Record visit
    const visit = this.visitRepository.create({
      customer: user,
      businessId,
      branchId,
      deviceId: device.id,
      status: 'returning',
    });
    await this.visitRepository.save(visit);

    // Increment device scans
    device.totalScans += 1;
    await this.deviceRepository.save(device);

    // 4. Contact Sync/Automation
    let contact = await this.contactRepository.findOne({
      where: [
        { businessId, email: user.email },
        { businessId, phone: user.phone },
      ],
    });

    if (!contact) {
      contact = this.contactRepository.create({
        businessId,
        email: user.email,
        phone: user.phone,
        name: `${user.firstName} ${user.lastName}`.trim(),
        optInChannels: [Channel.SMS, Channel.EMAIL, Channel.WHATSAPP],
      });
      await this.contactRepository.save(contact);
    }

    const visitCount = await this.visitRepository.count({
      where: {
        customer: { id: user.id },
        ...(branchId ? { branchId } : { businessId }),
      },
    });

    await this.automationService.trigger(
      visitCount === 1 ? TriggerType.FIRST_TAG : TriggerType.REPEAT_TAG,
      {
        businessId,
        branchId,
        contactId: contact.id,
      },
    );

    // 5. Loyalty Integration (Branch context takes precedence)
    const activeRule = branchId
      ? await this.campaignsService.findActiveRule(branchId)
      : null;

    let loyaltyResult = null;
    if (activeRule) {
      // Check if user has a profile in this branch/campaign
      const profile = await this.campaignsService.findProfile(user.id, branchId!);

      if (profile) {
        loyaltyResult = await this.campaignsService.earnPoints(branchId!, {
          userId: user.id,
          isVisit: true,
        });
      }
    }

    return {
      message: 'Visit recorded successfully',
      visit: {
        id: visit.id,
        createdAt: visit.createdAt,
      },
      loyalty: loyaltyResult,
      context: {
        businessId,
        branchId,
      },
    };
  }

  async findOne(id: string): Promise<VisitorResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['visits'],
    });
    if (!user) throw new NotFoundException('Visitor not found');
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
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    // Soft delete or just remove relationship?
    // Typically we don't delete users easily, but for the requirement:
    await this.userRepository.softDelete(id);
  }

  // --- New Visitors ---

  async findNew(
    query: VisitorQueryDto,
    businessId: string,
    branchId?: string,
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
    } else {
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
    businessId: string,
    branchId?: string,
  ): Promise<VisitorStatsResponseDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newTodayQb = this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.visits', 'visit')
      .where('user.createdAt >= :today', { today });

    if (branchId) {
      newTodayQb.andWhere('visit.branchId = :branchId', { branchId });
    } else {
      newTodayQb.andWhere('visit.businessId = :businessId', { businessId });
    }
    const newToday = await newTodayQb.getCount();

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const newWeeklyQb = this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.visits', 'visit')
      .where('user.createdAt >= :startOfWeek', { startOfWeek });

    if (branchId) {
      newWeeklyQb.andWhere('visit.branchId = :branchId', { branchId });
    } else {
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
    businessId: string,
    branchId?: string,
  ): Promise<{ data: ReturningVisitorResponseDto[]; total: number }> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const qb = this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.visits', 'visit')
      .where('user.role = :role', { role: UserRole.CUSTOMER });

    if (branchId) {
      qb.andWhere('visit.branchId = :branchId', { branchId });
    } else {
      qb.andWhere('visit.businessId = :businessId', { businessId });
    }

    // Users with > 1 visit
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

    const rawData: any[] = await qb
      .orderBy('user.createdAt', 'DESC')
      .offset(skip)
      .limit(limit)
      .getRawMany();

    const totalQb = this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.visits', 'visit');

    if (branchId) {
      totalQb.andWhere('visit.branchId = :branchId', { branchId });
    } else {
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
      totalVisits: parseInt(r.total_visits),
      frequency: parseInt(r.total_visits) > 5 ? 'Monthly' : 'Weekly',
      lastVisit: new Date(r.last_visit),
      status: 'Returning',
    }));

    return { data: dtos, total };
  }

  async getReturningStats(
    businessId: string,
    branchId?: string,
  ): Promise<VisitorStatsResponseDto> {
    const totalVisitorsQb = this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.visits', 'visit');

    if (branchId) {
      totalVisitorsQb.andWhere('visit.branchId = :branchId', { branchId });
    } else {
      totalVisitorsQb.andWhere('visit.businessId = :businessId', { businessId });
    }
    const totalVisitors = await totalVisitorsQb.getCount();

    const returningCountQb = this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.visits', 'visit');

    if (branchId) {
      returningCountQb.andWhere('visit.branchId = :branchId', { branchId });
    } else {
      returningCountQb.andWhere('visit.businessId = :businessId', { businessId });
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
      .innerJoin('user.visits', 'visit');

    if (branchId) {
      vipCountQb.andWhere('visit.branchId = :branchId', { branchId });
    } else {
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

  async export(businessId: string, branchId?: string) {
    const visitors = await this.findAll(
      { page: 1, limit: 1000 },
      businessId,
      branchId,
    );
    let csv = 'First Name,Last Name,Email,Phone,Visits,Last Visit,Status\n';
    visitors.data.forEach((v) => {
      csv += `"${v.firstName}","${v.lastName}","${v.email}","${v.phone}",${v.visits},"${v.lastVisit.toISOString()}",${v.status}\n`;
    });
    return {
      message: 'Export successful',
      data: csv,
      filename: `visitors_${branchId || businessId}_${new Date().toISOString().split('T')[0]}.csv`,
    };
  }

  async sendCampaign(businessId: string, body: any, branchId?: string) {
    const visitors = await this.findAll(
      { page: 1, limit: 1000 },
      businessId,
      branchId,
    );
    const contactIds = visitors.data.map((v) => v.id);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const channel = (body.channel as Channel) || Channel.SMS;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const content = body.message as string;

    return this.messagingService.sendMessage({
      businessId,
      branchId,
      channel,
      contactIds,
      content,
    });
  }

  async sendWelcomeCampaign(businessId: string, branchId?: string) {
    const newVisitors = await this.findNew(
      { page: 1, limit: 1000 },
      businessId,
      branchId,
    );
    const contactIds = newVisitors.data.map((v) => v.id);

    return this.messagingService.sendMessage({
      businessId,
      branchId,
      channel: Channel.SMS,
      contactIds,
      content: 'Welcome to our business! We are glad to have you.',
    });
  }

  async sendMessage(
    businessId: string,
    visitorId: string,
    message: string,
    channel: Channel,
    branchId?: string,
  ) {
    return this.messagingService.sendMessage({
      businessId,
      branchId,
      channel: channel || Channel.SMS,
      contactIds: [visitorId],
      content: message,
    });
  }

  async sendWelcome(businessId: string, visitorId: string, branchId?: string) {
    return this.sendMessage(
      businessId,
      visitorId,
      'Welcome! Thank you for visiting us.',
      Channel.SMS,
      branchId,
    );
  }

  async sendReward(
    businessId: string,
    visitorId: string,
    rewardId: string,
    branchId?: string,
  ) {
    // In a real system, you might generate a redemption code or similar.
    // For now, we'll send a message with the reward details.
    // If branchId is missing, we might have trouble finding the reward if rewards are branch-specific.
    // Assuming we can find rewards by business too if needed, but for now we follow the existing pattern.
    const rewards = branchId
      ? await this.campaignsService.getRewards(branchId)
      : [];
    const reward = rewards.find((r) => r.id === rewardId);
    // if (!reward) throw new NotFoundException('Reward not found');

    return this.sendMessage(
      businessId,
      visitorId,
      `You've received a reward! Use code REWARD123 to redeem.`,
      Channel.SMS,
      branchId,
    );
  }

  // --- Helpers ---

  private mapToVisitorDto(user: User): VisitorResponseDto {
    const visits = user.visits || [];
    const lastVisit =
      visits.length > 0 ? visits[visits.length - 1].createdAt : new Date();
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
}
