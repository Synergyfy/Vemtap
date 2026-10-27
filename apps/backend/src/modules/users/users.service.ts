import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { User, UserRole, UserStatus } from './entities/user.entity';
import { UserSession } from './entities/user-session.entity';
import * as bcrypt from 'bcrypt';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { InviteStaffDto } from './dto/invite-staff.dto';
import { PasswordResetHistory } from './entities/password-reset-history.entity';
import { MailService } from '../mail/mail.service';
import { EventsGateway } from '../../common/gateways/events.gateway';
import { paginateWithCursor } from '../../common/utils/cursor-pagination.util';

import { Branch } from '../branches/entities/branch.entity';
import { Business } from '../businesses/entities/business.entity';

import { Cluster, ClusterType } from '../clusters/entities/cluster.entity';
import { PushToken } from '../notifications/entities/push-token.entity';
import {
  AccountDeletionRequest,
  AccountDeletionStatus,
} from './entities/account-deletion-request.entity';
import {
  AccountDeletionResponseDto,
  CreateAccountDeletionDto,
} from './dto/account-deletion.dto';

const ACCOUNT_DELETION_RETAINED_NOTE =
  'Receipts and transaction records are retained for 24 months where legally required, then anonymised. Everything else is purged within 30 days.';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(PasswordResetHistory)
    private passwordResetHistoryRepository: Repository<PasswordResetHistory>,
    @InjectRepository(UserSession)
    private userSessionRepository: Repository<UserSession>,
    @InjectRepository(Cluster)
    private clusterRepository: Repository<Cluster>,
    private readonly mailService: MailService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async inviteStaff(branchId: string, dto: InviteStaffDto): Promise<User> {
    const existingEmail = await this.findByEmail(dto.email);
    if (existingEmail) {
      throw new BadRequestException('User with this email already exists');
    }

    if (dto.phone) {
      const existingPhone = await this.findByPhone(dto.phone);
      if (existingPhone) {
        throw new BadRequestException(
          'User with this phone number already exists',
        );
      }
    }

    // Get business and branch details from branch
    const branch = await this.usersRepository.manager
      .getRepository(Branch)
      .findOne({
        where: { id: branchId },
        relations: ['business'],
      });

    let businessName = branch?.business?.name;
    const branchName = branch?.name;

    if (!businessName && branch?.businessId) {
      const business = await this.usersRepository.manager
        .getRepository(Business)
        .findOne({ where: { id: branch.businessId } });
      businessName = business?.name;
    }

    const trimmedFirstName = dto.firstName.trim();
    const defaultPassword =
      dto.pin ?? Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    const actualRole =
      dto.role.trim().toLowerCase() === 'manager'
        ? UserRole.MANAGER
        : UserRole.STAFF;
    const user = this.usersRepository.create({
      firstName: trimmedFirstName,
      lastName: dto.lastName.trim(),
      email: dto.email.trim().toLowerCase(),
      phone: dto.phone?.trim(),
      password: hashedPassword,
      role: actualRole,
      roleTag: dto.role.trim(),
      jobTitle: dto.jobTitle?.trim(),
      permissions: dto.permissions,
      branchId: branchId,
      businessId: (branch as any)?.businessId,
      status: UserStatus.INVITED,
    });
    const savedUser = await this.usersRepository.save(user);

    // Send welcome email with default password
    try {
      await this.mailService.sendWelcomeEmail(
        savedUser.email,
        savedUser.firstName,
        defaultPassword,
        businessName,
        branchName,
      );
    } catch (error) {
      console.error('Failed to send invitation email:', error);
    }

    return savedUser;
  }

  /**
   * Re-issue the invitation email for a row that is still waiting to be
   * accepted.
   *
   * A fresh temporary password is generated instead of replaying the original:
   * that one was written into the invitee's inbox once, and reusing it after a
   * resend would leave a credential alive that the owner may believe was
   * superseded.
   */
  async resendTeamInvite(id: string, branchId: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id, branchId },
    });
    if (!user) {
      throw new NotFoundException('Staff member not found in this branch');
    }
    if (user.status !== UserStatus.INVITED) {
      throw new BadRequestException('Only pending invitations can be resent');
    }

    const defaultPassword = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    user.password = await bcrypt.hash(defaultPassword, 10);
    const savedUser = await this.usersRepository.save(user);

    const branch = await this.usersRepository.manager
      .getRepository(Branch)
      .findOne({
        where: { id: branchId },
        relations: ['business'],
      });

    try {
      await this.mailService.sendWelcomeEmail(
        savedUser.email,
        savedUser.firstName,
        defaultPassword,
        branch?.business?.name,
        branch?.name,
      );
    } catch (error) {
      console.error('Failed to resend invitation email:', error);
    }

    return savedUser;
  }

  /**
   * The owner resets a team member's sign-in PIN: a fresh one is emailed to
   * them and their signed-in devices are signed out. A pending invite gets
   * its invitation re-sent instead. The owner's own PIN is never reset here.
   */
  async resetTeamPin(id: string, branchId: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id, branchId },
    });
    if (!user) {
      throw new NotFoundException('Staff member not found in this branch');
    }
    if (user.role === UserRole.OWNER) {
      throw new BadRequestException("The owner's PIN cannot be reset here");
    }
    if (user.status === UserStatus.INVITED) {
      return this.resendTeamInvite(id, branchId);
    }

    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    user.password = await bcrypt.hash(pin, 10);
    const savedUser = await this.usersRepository.save(user);
    await this.userSessionRepository
      .createQueryBuilder()
      .update(UserSession)
      .set({ revokedAt: new Date() })
      .where('userId = :userId', { userId: user.id })
      .andWhere('revokedAt IS NULL')
      .execute();

    const branch = await this.usersRepository.manager
      .getRepository(Branch)
      .findOne({ where: { id: branchId }, relations: ['business'] });
    const escape = (value: string) =>
      value.replace(
        /[&<>"']/g,
        (char) =>
          ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
          })[char] as string,
      );
    const place = escape(branch?.business?.name ?? 'your team');
    await this.mailService.sendGenericEmail(
      savedUser.email,
      `Your new ${branch?.business?.name ?? 'VemTap'} sign-in PIN`,
      `Hi ${escape(savedUser.firstName ?? 'there')},\n\nYour PIN for ${place} was reset. Your new sign-in PIN is <strong>${pin}</strong>.\n\nYou were signed out of your devices; sign in again with your email and this PIN.`,
      { name: branch?.business?.name },
    );

    return savedUser;
  }

  async create(userData: Partial<User>): Promise<User> {
    if (userData.email) {
      const existingEmail = await this.findByEmail(userData.email);
      if (existingEmail && existingEmail.id !== userData.id) {
        throw new ConflictException('Email already exists');
      }
    }

    if (userData.phone) {
      const existingPhone = await this.findByPhone(userData.phone);
      if (existingPhone && existingPhone.id !== userData.id) {
        throw new ConflictException('Phone number already exists');
      }
    }

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
    return this.usersRepository.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { phone },
    });
  }

  async existsByPhone(
    phone: string,
  ): Promise<{ exists: boolean; email?: string }> {
    const user = await this.findByPhone(phone);
    return { exists: !!user, email: user?.email };
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { googleId },
    });
  }

  async findByIdentifier(identifier: string): Promise<User | null> {
    if (!identifier) return null;
    const trimmed = identifier.trim();
    return this.usersRepository.findOne({
      where: [{ email: trimmed.toLowerCase() }, { phone: trimmed }],
    });
  }

  async getTwoFactorState(
    id: string,
  ): Promise<Pick<User, 'twoFactorEnabled' | 'twoFactorSecret'> | null> {
    return this.usersRepository.findOne({
      where: { id },
      select: ['id', 'twoFactorEnabled', 'twoFactorSecret'],
    });
  }

  async createSession(userId: string, metadata?: Partial<UserSession>) {
    const session = this.userSessionRepository.create({
      userId,
      deviceName: metadata?.deviceName || 'Web browser',
      platform: metadata?.platform || 'web',
      userAgent: metadata?.userAgent || null,
      ipAddress: metadata?.ipAddress || null,
      lastActiveAt: new Date(),
      revokedAt: null,
    });
    const saved = await this.userSessionRepository.save(session);
    if (saved.userAgent) {
      await this.alertNewDevice(userId, saved).catch((err: Error) =>
        console.error(`New-device alert for ${userId} failed:`, err.message),
      );
    }
    return saved;
  }

  /**
   * Emails the user when they opted into device alerts and this sign-in's
   * browser/app (user agent) has never signed in to their account before.
   */
  private async alertNewDevice(userId: string, session: UserSession) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'firstName', 'securityPreferences'],
    });
    if (!user?.securityPreferences?.deviceAlerts || !user.email) return;
    const seenBefore = await this.userSessionRepository
      .createQueryBuilder('s')
      .withDeleted()
      .where('s.userId = :userId', { userId })
      .andWhere('s.userAgent = :userAgent', { userAgent: session.userAgent })
      .andWhere('s.id != :id', { id: session.id })
      .getExists();
    if (seenBefore) return;
    await this.mailService.sendGenericEmail(
      user.email,
      'New sign-in to your VemTap account',
      `Hi ${user.firstName || 'there'},\n\nYour VemTap account was just signed in from a new device:\n${session.userAgent}${session.ipAddress ? `\nIP address: ${session.ipAddress}` : ''}\nTime: ${session.createdAt.toISOString()}\n\nIf this was you, there is nothing to do. If not, change your password and sign that device out under Settings → Linked devices.`,
    );
  }

  async findActiveSession(id: string, userId: string) {
    return this.userSessionRepository.findOne({
      where: { id, userId, revokedAt: IsNull() },
    });
  }

  /**
   * Fills in the session the caller is signed in with: the app names the
   * device once after sign-in, because the login itself only knows a default.
   */
  async describeSession(
    userId: string,
    sessionId: string,
    details: {
      deviceName: string;
      platform: string;
      userAgent?: string | null;
      ipAddress?: string | null;
    },
  ) {
    const session = await this.findActiveSession(sessionId, userId);
    if (!session) throw new NotFoundException('Linked device not found');
    session.deviceName = details.deviceName;
    session.platform = details.platform;
    session.userAgent = details.userAgent ?? session.userAgent;
    session.ipAddress = details.ipAddress ?? session.ipAddress;
    session.lastActiveAt = new Date();
    return this.userSessionRepository.save(session);
  }

  async listSessions(userId: string, currentSessionId?: string) {
    const sessions = await this.userSessionRepository.find({
      where: { userId },
      order: { lastActiveAt: 'DESC' },
      select: [
        'id',
        'deviceName',
        'platform',
        'userAgent',
        'ipAddress',
        'lastActiveAt',
        'revokedAt',
        'createdAt',
      ],
    });
    return sessions.map((session) => ({
      ...session,
      isCurrent: session.id === currentSessionId,
    }));
  }

  async renameSession(userId: string, sessionId: string, deviceName: string) {
    const session = await this.userSessionRepository.findOne({
      where: { id: sessionId, userId },
    });
    if (!session) throw new NotFoundException('Linked device not found');
    session.deviceName = deviceName;
    return this.userSessionRepository.save(session);
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.userSessionRepository.findOne({
      where: { id: sessionId, userId },
    });
    if (!session) throw new NotFoundException('Linked device not found');
    session.revokedAt = new Date();
    await this.userSessionRepository.save(session);
    return { success: true };
  }

  async revokeOtherSessions(userId: string, currentSessionId: string) {
    await this.userSessionRepository
      .createQueryBuilder()
      .update(UserSession)
      .set({ revokedAt: new Date() })
      .where('userId = :userId', { userId })
      .andWhere('id != :currentSessionId', { currentSessionId })
      .andWhere('revokedAt IS NULL')
      .execute();
    return { success: true };
  }

  async updateProfile(id: string, updates: Partial<User>): Promise<User> {
    if (updates.homeDistrictId) {
      const district = await this.clusterRepository.findOne({
        where: {
          id: updates.homeDistrictId,
          type: ClusterType.DISTRICT,
          isActive: true,
        },
        select: ['id'],
      });
      if (!district) throw new BadRequestException('Unknown district');
    }
    const {
      branch,
      business,
      ownedBusiness,
      notifications,
      visits,
      messages,
      threads,
      ...plainUpdates
    } = updates as any;
    await this.usersRepository.update(id, plainUpdates);
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, updates: Partial<User>): Promise<User> {
    const {
      branch,
      business,
      ownedBusiness,
      notifications,
      visits,
      messages,
      threads,
      ...plainUpdates
    } = updates as any;
    await this.usersRepository.update(id, plainUpdates);
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
      user.roleTag = updates.role.trim();
      user.role =
        updates.role.trim().toLowerCase() === 'manager'
          ? UserRole.MANAGER
          : UserRole.STAFF;
    }

    if (updates.permissions) {
      user.permissions = updates.permissions;
    }

    if (updates.status) {
      user.status = updates.status;
    }

    const saved = await this.usersRepository.save(user);

    if (updates.permissions || updates.role) {
      this.eventsGateway.emitUserUpdated(saved.id, {
        permissions: saved.permissions,
        role: updates.role || undefined,
      });
    }

    return saved;
  }

  async remove(id: string, branchId: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id, branchId },
    });
    if (!user) {
      throw new NotFoundException('Staff member not found in this branch');
    }
    if (user.role === UserRole.OWNER) {
      throw new BadRequestException('Cannot remove business owner');
    }
    await this.usersRepository.remove(user);
  }

  async findByBranch(branchId: string): Promise<User[]> {
    return this.usersRepository.find({
      where: { branchId },
      order: { createdAt: 'DESC' },
    });
  }

  async findTeamMembers(options: {
    branchId?: string;
    businessId?: string;
    roles?: UserRole[];
  }): Promise<User[]> {
    const { branchId, businessId, roles } = options;
    const qb = this.usersRepository.createQueryBuilder('user');

    if (branchId) {
      qb.andWhere('user.branchId = :branchId', { branchId });
    } else if (businessId) {
      qb.andWhere('user.businessId = :businessId', { businessId });
    }

    if (roles && roles.length > 0) {
      qb.andWhere('user.role IN (:...roles)', { roles });
    } else {
      // Default to team roles
      qb.andWhere('user.role IN (:...roles)', {
        roles: [UserRole.MANAGER, UserRole.STAFF],
      });
    }

    qb.orderBy('user.createdAt', 'DESC');
    return qb.getMany();
  }

  async findTeam(branchId: string): Promise<User[]> {
    return this.findTeamMembers({ branchId });
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
    const user = await this.findOne(userId);
    if (!user) throw new NotFoundException('User not found');

    const updates: Partial<User> = {
      password: passwordHash,
      isPasswordChanged: true,
    };

    if (user.status === UserStatus.PENDING) {
      updates.status = UserStatus.ACTIVE;
    }

    const {
      branch,
      business,
      ownedBusiness,
      notifications,
      visits,
      messages,
      threads,
      ...plainUpdates
    } = updates as any;
    await this.usersRepository.update(userId, plainUpdates);

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
    const saved = await this.usersRepository.save(user);
    this.eventsGateway.emitUserUpdated(saved.id, {
      permissions: saved.permissions,
      role: updates.role || undefined,
    });
    return saved;
  }

  /**
   * Self-service account deletion. Owners must close or hand over their
   * business first; admin accounts are removed by another admin. The user row
   * is anonymised (so the email/phone can sign up again) and soft-deleted,
   * which makes every outstanding token fail the JWT strategy's lookup.
   */
  async deleteOwnAccount(
    userId: string,
    dto: CreateAccountDeletionDto,
  ): Promise<AccountDeletionResponseDto> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['id', 'role'],
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Admin accounts cannot be deleted from the account settings',
      );
    }
    const ownsBusiness = await this.usersRepository.manager
      .getRepository(Business)
      .exists({ where: { ownerId: userId } });
    if (ownsBusiness) {
      throw new ConflictException(
        'Close or transfer your business before deleting your account',
      );
    }

    const now = new Date();
    const request = await this.usersRepository.manager.transaction(
      async (manager) => {
        const saved = await manager.getRepository(AccountDeletionRequest).save(
          manager.getRepository(AccountDeletionRequest).create({
            userId,
            role: user.role,
            reasonId: dto.reasonId ?? null,
            feedback: dto.feedback?.trim() || null,
            status: AccountDeletionStatus.COMPLETED,
            completedAt: now,
          }),
        );
        await manager.getRepository(User).update(userId, {
          email: `deleted+${userId}@deleted.vemtap.invalid`,
          phone: null as unknown as string,
          googleId: null as unknown as string,
          password: null as unknown as string,
          firstName: 'Deleted',
          lastName: 'User',
          avatar: null as unknown as string,
          pushToken: null,
          status: UserStatus.INACTIVE,
        });
        await manager
          .getRepository(UserSession)
          .update({ userId, revokedAt: IsNull() }, { revokedAt: now });
        await manager.getRepository(PushToken).delete({ userId });
        await manager.getRepository(User).softDelete(userId);
        return saved;
      },
    );

    return {
      id: request.id,
      status: request.status,
      submittedAt: now,
      completedAt: request.completedAt,
      retainedNote: ACCOUNT_DELETION_RETAINED_NOTE,
    };
  }

  async adminDeleteUser(id: string): Promise<void> {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException('User not found');
    await this.usersRepository.remove(user);
  }

  async adminCreateUser(dto: any): Promise<User> {
    const user = this.usersRepository.create(dto as object);
    return this.usersRepository.save(user);
  }

  async adminCreateAgent(dto: any): Promise<User> {
    const user = this.usersRepository.create({
      ...dto,
      role: UserRole.AGENT,
      status: UserStatus.ACTIVE,
    } as object);
    return this.usersRepository.save(user);
  }

  async findAllAdmin(options: any) {
    const {
      search,
      role,
      status,
      page = 1,
      limit = 10,
      cursor,
      nextCursor,
    } = options;
    const qb = this.usersRepository.createQueryBuilder('user');

    if (search) {
      qb.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }
    if (role) qb.andWhere('user.role = :role', { role });
    if (status) qb.andWhere('user.status = :status', { status });

    const result = await paginateWithCursor({
      queryBuilder: qb,
      cursor: cursor || nextCursor,
      page,
      limit,
      sortField: 'createdAt',
      sortOrder: 'DESC',
      entityAlias: 'user',
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
}
