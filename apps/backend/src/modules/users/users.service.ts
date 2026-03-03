import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from './entities/user.entity';
import { PasswordResetHistory } from './entities/password-reset-history.entity';
import { UpdateStaffDto } from './dto/update-staff.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(PasswordResetHistory)
    private passwordResetHistoryRepository: Repository<PasswordResetHistory>,
  ) { }

  findOne(id: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email: email.toLowerCase() });
  }

  async findByIdentifier(identifier: string): Promise<User | null> {
    const lowerIdentifier = identifier.toLowerCase();
    return this.usersRepository.findOne({
      where: [
        { email: lowerIdentifier },
        { phone: identifier },
      ],
    });
  }

  async create(userData: Partial<User>): Promise<User> {
    if (userData.email) {
      userData.email = userData.email.toLowerCase();
    }
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  async updateProfile(id: string, updates: Partial<User>): Promise<User> {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException('User not found');
    Object.assign(user, updates);
    return this.usersRepository.save(user);
  }

  async findByBusiness(
    businessId: string,
    branchId?: string,
    roles?: UserRole[],
  ): Promise<User[]> {
    const qb = this.usersRepository.createQueryBuilder('user');
    qb.where('user.businessId = :businessId', { businessId });

    if (branchId) {
      qb.andWhere('user.branchId = :branchId', { branchId });
    }

    if (roles && roles.length > 0) {
      qb.andWhere('user.role IN (:...roles)', { roles });
    } else {
      // Default to staff and managers for this method's typical usage in listing team members
      qb.andWhere('user.role IN (:...roles)', {
        roles: [UserRole.STAFF, UserRole.MANAGER],
      });
    }

    qb.orderBy('user.createdAt', 'DESC');
    return qb.getMany();
  }

  async updateStaff(
    id: string,
    businessId: string,
    updates: UpdateStaffDto,
  ): Promise<User> {
    const user = await this.findOne(id);
    if (!user || user.businessId !== businessId) {
      throw new NotFoundException('Staff member not found');
    }

    if (
      updates.role &&
      updates.role === UserRole.OWNER &&
      user.role !== UserRole.OWNER
    ) {
      // Prevent changing non-owner to owner directly without checks?
      // Assuming minimal checks for now as per MVP.
    }

    // Use Object.assign to copy properties from updates to user
    Object.assign(user, updates);

    return this.usersRepository.save(user);
  }

  async remove(id: string, businessId: string): Promise<void> {
    const user = await this.findOne(id);
    if (!user || user.businessId !== businessId) {
      throw new NotFoundException('Staff member not found');
    }
    if (user.role === UserRole.OWNER) {
      throw new BadRequestException('Cannot remove the business owner');
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

  // --- Admin Methods ---

  async findAllAdmin(query: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const qb = this.usersRepository.createQueryBuilder('user');

    if (query.role && query.role !== 'all') {
      const roleMap: any = {
        admin: UserRole.ADMIN,
        business_owner: UserRole.OWNER,
        manager: UserRole.MANAGER,
        staff: UserRole.STAFF,
        customer: UserRole.CUSTOMER,
      };
      qb.andWhere('user.role = :role', {
        role: roleMap[query.role] || query.role,
      });
    }

    if (query.status && query.status !== 'all') {
      const statusValue =
        query.status.charAt(0).toUpperCase() + query.status.slice(1);
      qb.andWhere('user.status = :status', { status: statusValue });
    }

    if (query.search) {
      qb.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    qb.skip((page - 1) * limit).take(limit);
    qb.orderBy('user.createdAt', 'DESC');

    const [users, total] = await qb.getManyAndCount();

    const stats = {
      total: await this.usersRepository.count(),
      owners: await this.usersRepository.count({
        where: { role: UserRole.OWNER },
      }),
      customers: await this.usersRepository.count({
        where: { role: UserRole.CUSTOMER },
      }),
      staff: await this.usersRepository.count({
        where: { role: UserRole.STAFF },
      }),
    };

    return {
      data: users.map((user) => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        role: user.role === UserRole.OWNER ? 'Business Owner' : user.role,
        status: user.status.toLowerCase(),
        permissions: user.permissions || [],
        lastLogin: user.lastActive
          ? new Date(user.lastActive).toLocaleString()
          : 'Never',
        joined: new Date(user.createdAt).toISOString().split('T')[0],
      })),
      meta: { total, page, lastPage: Math.ceil(total / limit) },
      stats,
    };
  }

  async adminCreateUser(userData: any): Promise<User> {
    const defaultPassword = await bcrypt.hash('DefaultPass1!', 10);

    const parts = (userData.name || '').split(' ');
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';

    const roleMapping: Record<string, UserRole> = {
      Admin: UserRole.ADMIN,
      admin: UserRole.ADMIN,
      'Business Owner': UserRole.OWNER,
      business_owner: UserRole.OWNER,
      Staff: UserRole.STAFF,
      staff: UserRole.STAFF,
      Customer: UserRole.CUSTOMER,
      customer: UserRole.CUSTOMER,
    };

    const statusMapping: Record<string, UserStatus> = {
      active: UserStatus.ACTIVE,
      Active: UserStatus.ACTIVE,
      pending: UserStatus.PENDING,
      Pending: UserStatus.PENDING,
      suspended: UserStatus.SUSPENDED,
      Suspended: UserStatus.SUSPENDED,
    };

    const userRole = roleMapping[userData.role] || UserRole.CUSTOMER;
    const userStatus = statusMapping[userData.status] || UserStatus.ACTIVE;

    const user = this.usersRepository.create({
      email: userData.email,
      firstName,
      lastName,
      role: userRole,
      status: userStatus,
      password: defaultPassword,
    });
    return this.usersRepository.save(user);
  }

  async adminUpdateUser(id: string, updates: any): Promise<User> {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException('User not found');

    if (updates.name) {
      const parts = updates.name.split(' ');
      user.firstName = parts[0] || '';
      user.lastName = parts.slice(1).join(' ') || '';
    }
    if (updates.email) user.email = updates.email;

    if (updates.role) {
      const roleMapping: Record<string, UserRole> = {
        Admin: UserRole.ADMIN,
        admin: UserRole.ADMIN,
        'Business Owner': UserRole.OWNER,
        business_owner: UserRole.OWNER,
        Staff: UserRole.STAFF,
        staff: UserRole.STAFF,
        Customer: UserRole.CUSTOMER,
        customer: UserRole.CUSTOMER,
      };
      if (roleMapping[updates.role]) user.role = roleMapping[updates.role];
    }

    if (updates.status) {
      const statusMapping: Record<string, UserStatus> = {
        active: UserStatus.ACTIVE,
        Active: UserStatus.ACTIVE,
        pending: UserStatus.PENDING,
        Pending: UserStatus.PENDING,
        suspended: UserStatus.SUSPENDED,
        Suspended: UserStatus.SUSPENDED,
      };
      if (statusMapping[updates.status])
        user.status = statusMapping[updates.status];
    }

    if (updates.permissions) {
      user.permissions = updates.permissions;
    }

    return this.usersRepository.save(user);
  }

  async adminDeleteUser(id: string): Promise<void> {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException('User not found');
    user.status = UserStatus.SUSPENDED; // Disable account = array of suspended
    await this.usersRepository.save(user);
  }

  async adminResetPasswordLink(email: string) {
    const user = await this.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    // In actual implementation, send a real email using emailService.
    return true;
  }

  async updatePassword(
    userId: string,
    newPasswordHash: string,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const user = await this.findOne(userId);
    if (!user) throw new NotFoundException('User not found');

    user.password = newPasswordHash;
    await this.usersRepository.save(user);

    // Log history
    const history = this.passwordResetHistoryRepository.create({
      userId,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      resetAt: new Date(),
    });
    await this.passwordResetHistoryRepository.save(history);

    return true;
  }
}
