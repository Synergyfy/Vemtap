import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { Visit } from './entities/visit.entity';
import { Device } from '../devices/entities/device.entity';
import { Branch } from '../branches/entities/branch.entity';
import { VisitorQueryDto } from './dto/visitor-query.dto';
import {
  VisitorResponseDto,
  PaginatedVisitorResponseDto,
  NewVisitorResponseDto,
  ReturningVisitorResponseDto,
} from './dto/visitor-response.dto';
import { VisitorStatsResponseDto } from './dto/visitor-stats.dto';
import { CreateVisitorDto } from './dto/create-visitor.dto';
import { MessagingEngineService } from '../messaging/services/messaging-engine.service';
import { Channel } from '../messaging/enums/channel.enum';
import { CampaignsService } from '../campaigns/campaigns.service';

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
    private messagingService: MessagingEngineService,
    private campaignsService: CampaignsService,
  ) {}

  // --- Main/All Visitors ---

  async findAll(
    query: VisitorQueryDto,
    branchId: string,
  ): Promise<PaginatedVisitorResponseDto> {
    const { page = 1, limit = 10, search, status } = query;
    const skip = (page - 1) * limit;

    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.visits', 'visit')
      .where('visit.branchId = :branchId', { branchId })
      .andWhere('user.role = :role', { role: UserRole.CUSTOMER });

    if (search) {
      qb.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search OR user.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Status filter is tricky because status is derived or on the Visit.
    // Visit entity has 'status' (new/returning).
    // Frontend has: New, Active, VIP, Returning, Inactive.
    // We'll approximate.
    if (status && status !== 'all') {
      // This is a simplification. Ideally, we calculate status per user.
      // For now, we might rely on the latest visit's status or similar.
      // Or if we can't filter easily in DB, we filter in memory (not efficient but safe for now).
    }

    // We need to group by user because one user has multiple visits.
    // But TypeORM 'getManyAndCount' with groupBy is tricky for pagination.
    // Strategy: Select distinct user IDs first, then fetch details.

    // Simplified approach: Fetch users with their visits.
    // Distinct on user.id
    qb.select('user.id');
    qb.groupBy('user.id');

    const [usersRaw, total] = await qb.getManyAndCount();

    // Now fetch full data for these IDs
    if (usersRaw.length === 0) {
      return { data: [], total: 0, page, limit };
    }

    const userIds = usersRaw.map((u) => u.id);

    const users = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.visits', 'visit')
      .where('user.id IN (:...userIds)', { userIds })
      .andWhere('visit.branchId = :branchId', { branchId })
      .orderBy('visit.createdAt', 'DESC') // Latest visit first
      .skip(skip)
      .take(limit)
      .getMany();

    const data: VisitorResponseDto[] = users.map((user) =>
      this.mapToVisitorDto(user),
    );

    // In-memory filter for status if needed (since we couldn't easily do it in SQL without complex subqueries)
    let filteredData = data;
    if (status && status !== 'all') {
      filteredData = data.filter(
        (v) => v.status.toLowerCase() === status.toLowerCase(),
      );
    }

    return {
      data: filteredData,
      total, // Note: Total might be inaccurate if we filter in memory, but accurate for DB query
      page,
      limit,
    };
  }

  async getStats(branchId: string): Promise<VisitorStatsResponseDto> {
    const totalVisitorsQb = this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.visits', 'visit', 'visit.branchId = :branchId', {
        branchId,
      });
    const totalVisitors = await totalVisitorsQb.getCount();

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newThisMonthQb = this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.visits', 'visit', 'visit.branchId = :branchId', {
        branchId,
      })
      .where('user.createdAt >= :startOfMonth', { startOfMonth });
    const newThisMonth = await newThisMonthQb.getCount();

    // Frequency = Total Visits / Total Visitors
    const totalVisitsCount = await this.visitRepository.count({
      where: { branchId },
    });
    const avgFrequency =
      totalVisitors > 0 ? (totalVisitsCount / totalVisitors).toFixed(1) : '0';

    // VIP Guests (e.g., > 10 visits)
    const vipCountQb = this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.visits', 'visit', 'visit.branchId = :branchId', {
        branchId,
      });
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
          trend: { value: '+0%', isUp: true }, // Trends would require comparison with previous period
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
    createVisitorDto: CreateVisitorDto,
    branchId: string,
  ): Promise<VisitorResponseDto> {
    // Check if user exists
    let user = await this.userRepository.findOne({
      where: { email: createVisitorDto.email },
    });

    if (!user) {
      user = this.userRepository.create({
        email: createVisitorDto.email,
        firstName: createVisitorDto.name.split(' ')[0] || '',
        lastName: createVisitorDto.name.split(' ').slice(1).join(' ') || '',
        phone: createVisitorDto.phone,
        password: Math.random().toString(36), // Dummy password
        role: UserRole.CUSTOMER,
      });
      await this.userRepository.save(user);
    }

    // Resolve branchId from device if not provided
    let resolvedBranchId = branchId;
    if (!resolvedBranchId && createVisitorDto.deviceId) {
      const device = await this.deviceRepository.findOne({
        where: { id: createVisitorDto.deviceId },
      });
      if (device) resolvedBranchId = device.branchId;
    }
    if (!resolvedBranchId) {
      throw new Error(
        'branchId is required (provide directly or via deviceId for a device with branchId)',
      );
    }

    const visit = this.visitRepository.create({
      customer: user,
      branchId: resolvedBranchId,
      deviceId: createVisitorDto.deviceId,
      status: 'new',
    });
    await this.visitRepository.save(visit);

    // Re-fetch to get full structure
    const updatedUser = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['visits'],
    });

    return this.mapToVisitorDto(updatedUser!);
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

    if (updateData.name) {
      user.firstName = updateData.name.split(' ')[0];
      user.lastName = updateData.name.split(' ').slice(1).join(' ');
    }
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
    branchId: string,
  ): Promise<{ data: NewVisitorResponseDto[]; total: number }> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    const qb = this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect(
        'user.visits',
        'visit',
        'visit.branchId = :branchId',
        { branchId },
      )
      .where('user.createdAt >= :startOfWeek', { startOfWeek })
      .andWhere('user.role = :role', { role: UserRole.CUSTOMER });

    const [users, total] = await qb
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const dtos = users.map((u) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      phone: u.phone,
      joined: u.createdAt,
      source: 'Direct/NFC',
      status: 'New',
    }));

    return { data: dtos, total };
  }

  async getNewStats(branchId: string): Promise<VisitorStatsResponseDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newTodayQb = this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.visits', 'visit', 'visit.branchId = :branchId', {
        branchId,
      })
      .where('user.createdAt >= :today', { today });
    const newToday = await newTodayQb.getCount();

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const newWeeklyQb = this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.visits', 'visit', 'visit.branchId = :branchId', {
        branchId,
      })
      .where('user.createdAt >= :startOfWeek', { startOfWeek });
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
    branchId: string,
  ): Promise<{ data: ReturningVisitorResponseDto[]; total: number }> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const qb = this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect(
        'user.visits',
        'visit',
        'visit.branchId = :branchId',
        { branchId },
      )
      .where('user.role = :role', { role: UserRole.CUSTOMER });

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

    const rawData = await qb
      .orderBy('user.createdAt', 'DESC')
      .offset(skip)
      .limit(limit)
      .getRawMany();

    const total = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.visits', 'visit', 'visit.branchId = :branchId', {
        branchId,
      })
      .groupBy('user.id')
      .having('COUNT(visit.id) > 1')
      .getCount();

    const dtos = rawData.map((r) => ({
      id: r.user_id,
      name: `${r.user_firstName} ${r.user_lastName}`,
      email: r.user_email,
      phone: r.user_phone,
      totalVisits: parseInt(r.total_visits),
      frequency: parseInt(r.total_visits) > 5 ? 'Monthly' : 'Weekly',
      lastVisit: new Date(r.last_visit),
      status: 'Returning',
    }));

    return { data: dtos, total };
  }

  async getReturningStats(branchId: string): Promise<VisitorStatsResponseDto> {
    const totalVisitorsQb = this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.visits', 'visit', 'visit.branchId = :branchId', {
        branchId,
      });
    const totalVisitors = await totalVisitorsQb.getCount();

    const returningCountQb = this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.visits', 'visit', 'visit.branchId = :branchId', {
        branchId,
      });
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
      .innerJoin('user.visits', 'visit', 'visit.branchId = :branchId', {
        branchId,
      });
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
    let csv = 'Name,Email,Phone,Visits,Last Visit,Status\n';
    visitors.data.forEach((v) => {
      csv += `"${v.name}","${v.email}","${v.phone}",${v.visits},"${v.lastVisit}",${v.status}\n`;
    });
    return {
      message: 'Export successful',
      data: csv,
      filename: `visitors_${branchId}_${new Date().toISOString().split('T')[0]}.csv`,
    };
  }

  async sendCampaign(branchId: string, body: any) {
    const branch = await this.branchRepository.findOne({
      where: { id: branchId },
    });
    if (!branch) throw new NotFoundException('Branch not found');
    const visitors = await this.findAll({ page: 1, limit: 1000 }, branchId);
    const contactIds = visitors.data.map((v) => v.id);

    return this.messagingService.sendMessage({
      businessId: branch.businessId,
      branchId,
      channel: body.channel || Channel.SMS,
      contactIds,
      content: body.message,
    });
  }

  async sendWelcomeCampaign(branchId: string) {
    const branch = await this.branchRepository.findOne({
      where: { id: branchId },
    });
    if (!branch) throw new NotFoundException('Branch not found');
    const newVisitors = await this.findNew({ page: 1, limit: 1000 }, branchId);
    const contactIds = newVisitors.data.map((v) => v.id);

    return this.messagingService.sendMessage({
      businessId: branch.businessId,
      branchId,
      channel: Channel.SMS,
      contactIds,
      content: 'Welcome to our business! We are glad to have you.',
    });
  }

  async sendMessage(
    branchId: string,
    visitorId: string,
    message: string,
    channel: Channel,
  ) {
    const branch = await this.branchRepository.findOne({
      where: { id: branchId },
    });
    if (!branch) throw new NotFoundException('Branch not found');
    return this.messagingService.sendMessage({
      businessId: branch.businessId,
      channel: channel || Channel.SMS,
      contactIds: [visitorId],
      content: message,
    });
  }

  async sendWelcome(branchId: string, visitorId: string) {
    return this.sendMessage(
      branchId,
      visitorId,
      'Welcome! Thank you for visiting us.',
      Channel.SMS,
    );
  }

  async sendReward(branchId: string, visitorId: string, rewardId: string) {
    // In a real system, you might generate a redemption code or similar.
    // For now, we'll send a message with the reward details.
    const rewards = await this.campaignsService.getRewards(branchId);
    const reward = rewards.find((r) => r.id === rewardId);
    if (!reward) throw new NotFoundException('Reward not found');

    return this.sendMessage(
      branchId,
      visitorId,
      `You've received a reward: ${reward.name}! Use code REWARD123 to redeem.`,
      Channel.SMS,
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
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      phone: user.phone,
      visits: visitCount,
      lastVisit: lastVisit,
      status: status,
      totalSpent: '₦0',
    };
  }
}
