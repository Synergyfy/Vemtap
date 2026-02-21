import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Like } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { Visit } from './entities/visit.entity';
import { VisitorQueryDto } from './dto/visitor-query.dto';
import {
  VisitorResponseDto,
  PaginatedVisitorResponseDto,
  NewVisitorResponseDto,
  ReturningVisitorResponseDto,
} from './dto/visitor-response.dto';
import { VisitorStatsResponseDto } from './dto/visitor-stats.dto';
import { CreateVisitorDto } from './dto/create-visitor.dto';

@Injectable()
export class VisitorsService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Visit)
    private visitRepository: Repository<Visit>,
  ) {}

  // --- Main/All Visitors ---

  async findAll(
    query: VisitorQueryDto,
    businessId: string,
  ): Promise<PaginatedVisitorResponseDto> {
    const { page = 1, limit = 10, search, status } = query;
    const skip = (page - 1) * limit;

    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.visits', 'visit')
      // In a real app, we filter by business context.
      // Assuming 'visit.businessId' links user to this business.
      // Or user.businessId if they are staff? No, visitors are customers.
      // We want users who have visited THIS business.
      .where('visit.businessId = :businessId', { businessId })
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
      .andWhere('visit.businessId = :businessId', { businessId })
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

  async getStats(businessId: string): Promise<VisitorStatsResponseDto> {
    // Mock implementation for stats based on real counts where possible
    const totalVisitors = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.visits', 'visit', 'visit.businessId = :businessId', {
        businessId,
      })
      .getCount();

    // Mock other stats for visual completeness as per frontend
    return {
      stats: [
        {
          label: 'Total Visitors',
          value: totalVisitors.toString(),
          icon: 'users',
          color: 'blue',
          trend: { value: '+12%', isUp: true },
        },
        {
          label: 'New This Month',
          value: '12',
          icon: 'user-plus',
          color: 'green',
          trend: { value: '+5%', isUp: true },
        },
        {
          label: 'Avg. Frequency',
          value: '3.2',
          icon: 'repeat',
          color: 'purple',
          trend: { value: '-2%', isUp: false },
        },
        {
          label: 'VIP Guests',
          value: '5',
          icon: 'star',
          color: 'yellow',
          trend: { value: '+8%', isUp: true },
        },
      ],
    };
  }

  async create(
    createVisitorDto: CreateVisitorDto,
    businessId: string,
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

    // Create a visit to link to this business
    const visit = this.visitRepository.create({
      customer: user,
      businessId: businessId,
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
    businessId: string,
  ): Promise<{ data: NewVisitorResponseDto[]; total: number }> {
    // Logic: Users whose FIRST visit was recent (e.g. today/this week)
    // For simplicity, returning mock data or simple query
    const users = await this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect(
        'user.visits',
        'visit',
        'visit.businessId = :businessId',
        { businessId },
      )
      .orderBy('visit.createdAt', 'DESC')
      .take(query.limit || 10)
      .getMany();

    const dtos = users.map((u) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      phone: u.phone,
      joined: u.visits[0]?.createdAt || new Date(),
      source: 'NFC Tag', // Mock
      status: 'New',
    }));

    return { data: dtos, total: dtos.length };
  }

  async getNewStats(): Promise<VisitorStatsResponseDto> {
    return {
      stats: [
        {
          label: 'New Today',
          value: '18',
          icon: 'user-plus',
          color: 'green',
          trend: { value: '+20%', isUp: true },
        },
        {
          label: 'New This Week',
          value: '124',
          icon: 'calendar',
          color: 'blue',
          trend: { value: '+15%', isUp: true },
        },
        {
          label: 'Conversion Rate',
          value: '68%',
          icon: 'trending-up',
          color: 'purple',
          trend: { value: '+2%', isUp: true },
        },
        {
          label: 'Wait Time',
          value: '2m',
          icon: 'timer',
          color: 'yellow',
          trend: { value: '-30s', isUp: true },
        },
      ],
    };
  }

  // --- Returning Visitors ---

  async findReturning(
    query: VisitorQueryDto,
    businessId: string,
  ): Promise<{ data: ReturningVisitorResponseDto[]; total: number }> {
    // Logic: Users with > 1 visit
    // Mocking for now
    const users = await this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect(
        'user.visits',
        'visit',
        'visit.businessId = :businessId',
        { businessId },
      )
      .getMany(); // Ineffecient for real scale, good for prototype

    const returning = users.filter((u) => u.visits.length > 1);

    const dtos = returning.map((u) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      phone: u.phone,
      totalVisits: u.visits.length,
      frequency: 'Weekly', // Mock
      lastVisit: u.visits[u.visits.length - 1].createdAt,
      status: 'Returning',
    }));

    return { data: dtos, total: dtos.length };
  }

  async getReturningStats(): Promise<VisitorStatsResponseDto> {
    return {
      stats: [
        {
          label: 'Returning Rate',
          value: '74%',
          icon: 'repeat',
          color: 'blue',
          trend: { value: '+4%', isUp: true },
        },
        {
          label: 'Repeat Customers',
          value: '1,842',
          icon: 'users',
          color: 'green',
          trend: { value: '+12%', isUp: true },
        },
        {
          label: 'VIP Members',
          value: '156',
          icon: 'star',
          color: 'yellow',
          trend: { value: '+8%', isUp: true },
        },
        {
          label: 'Churn Risk',
          value: '12',
          icon: 'alert-triangle',
          color: 'red',
          trend: { value: '-2', isUp: true },
        },
      ],
    };
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
      totalSpent: '₦' + (visitCount * 5000).toLocaleString(), // Mock calculation
    };
  }
}
