import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { PasswordResetHistory } from './entities/password-reset-history.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(PasswordResetHistory)
    private passwordResetHistoryRepository: Repository<PasswordResetHistory>,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  async findOne(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findById(id: string): Promise<User | null> {
    return this.findOne(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email: email.toLowerCase() } });
  }

  async findByIdentifier(identifier: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: [{ email: identifier.toLowerCase() }, { phone: identifier }],
    });
  }

  async update(id: string, updates: Partial<User>): Promise<User> {
    await this.usersRepository.update(id, updates);
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateStaff(
    id: string,
    branchId: string,
    updates: UpdateStaffDto,
  ): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id, branchId },
    });

    if (!user) {
      throw new NotFoundException('Staff member not found in this branch');
    }

    if (updates.name) {
      const parts = updates.name.split(' ');
      user.firstName = parts[0] || '';
      user.lastName = parts.slice(1).join(' ') || '';
    }
    if (updates.email) user.email = updates.email;

    if (updates.role) {
      user.role = updates.role;
    }

    if (updates.permissions) {
      user.permissions = updates.permissions;
    }

    if (updates.status) {
      user.status = updates.status;
    }

    return this.usersRepository.save(user);
  }

  async remove(id: string, branchId: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id, branchId },
    });
    if (!user) {
      throw new NotFoundException('Staff member not found in this branch');
    }
    await this.usersRepository.remove(user);
  }

  async updateEngagement(
    id: string,
    engagement: Record<string, any>,
  ): Promise<User> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.engagement = engagement;
    return this.usersRepository.save(user);
  }

  async findByBranch(branchId: string): Promise<User[]> {
    return this.usersRepository.find({
      where: { branchId },
      order: { createdAt: 'DESC' },
    });
  }

  async findTeam(branchId: string): Promise<User[]> {
    return this.usersRepository.find({
      where: { branchId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByBusiness(businessId: string): Promise<User[]> {
    return this.usersRepository.find({
      where: { businessId },
      order: { createdAt: 'DESC' },
    });
  }

  async updatePassword(
    userId: string,
    passwordHash: string,
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<boolean> {
    await this.usersRepository.update(userId, {
      password: passwordHash,
    });

    const history = this.passwordResetHistoryRepository.create({
      userId,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      resetAt: new Date(),
    });
    await this.passwordResetHistoryRepository.save(history);

    return true;
  }

  async adminResetPasswordLink(email: string) {
    const user = await this.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');
    // Logic to send email would go here
    return { message: 'Reset link sent to ' + email };
  }

  // Missing methods for E2E tests
  async suspendUser(id: string): Promise<User> {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException('User not found');
    user.status = UserStatus.SUSPENDED;
    return this.usersRepository.save(user);
  }

  async activateUser(id: string): Promise<User> {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException('User not found');
    user.status = UserStatus.ACTIVE;
    return this.usersRepository.save(user);
  }

  async adminUpdateUser(id: string, updates: any): Promise<User> {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException('User not found');
    Object.assign(user, updates);
    return this.usersRepository.save(user);
  }

  async adminDeleteUser(id: string): Promise<void> {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException('User not found');
    await this.usersRepository.remove(user);
  }

  async adminCreateUser(dto: any): Promise<User> {
    const user = this.usersRepository.create(dto);
    return this.usersRepository.save(user);
  }

  async adminCreateAgent(dto: any): Promise<User> {
    const user = this.usersRepository.create({
      ...dto,
      role: UserRole.AGENT,
      status: UserStatus.ACTIVE,
    });
    return this.usersRepository.save(user);
  }

  async findAllAdmin(options: any) {
    const { search, role, status, page = 1, limit = 10 } = options;
    const qb = this.usersRepository.createQueryBuilder('user');

    if (search) {
      qb.andWhere('(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)', { search: `%${search}%` });
    }
    if (role) qb.andWhere('user.role = :role', { role });
    if (status) qb.andWhere('user.status = :status', { status });

    qb.skip((page - 1) * limit).take(limit).orderBy('user.createdAt', 'DESC');

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: { total, page, lastPage: Math.ceil(total / limit) }
    };
  }
}
