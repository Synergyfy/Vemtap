import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  FindOptionsWhere,
  LessThan,
  MoreThanOrEqual,
} from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { ImpersonationToken } from './entities/impersonation-token.entity';
import { CustomerImpersonationToken } from './entities/customer-impersonation-token.entity';
import { AuditLog } from './entities/audit-log.entity';
import {
  AdminCreateAgentDto,
  GenerateImpersonationTokenDto,
  GenerateCustomerImpersonationTokenDto,
  AuditLogFilterDto,
} from './dto/administration.dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { BackendModule } from '../../common/enums/backend-module.enum';

@Injectable()
export class AdministrationService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ImpersonationToken)
    private readonly tokenRepository: Repository<ImpersonationToken>,
    @InjectRepository(CustomerImpersonationToken)
    private readonly customerTokenRepository: Repository<CustomerImpersonationToken>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async listAgents(filter: { page?: number; limit?: number }) {
    const page = filter.page || 1;
    const limit = filter.limit || 10;

    const [data, total] = await this.userRepository.findAndCount({
      where: { role: UserRole.AGENT },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'status', 'permissions', 'createdAt'],
    });

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async createAgent(dto: AdminCreateAgentDto): Promise<User> {
    const existingEmail = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (existingEmail) throw new BadRequestException('Email already in use');

    const existingPhone = await this.userRepository.findOne({
      where: { phone: dto.phone },
    });
    if (existingPhone)
      throw new BadRequestException('Phone number already in use');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const agent = this.userRepository.create({
      ...dto,
      password: hashedPassword,
      role: UserRole.AGENT,
      status: UserStatus.ACTIVE,
      permissions: dto.permissions,
    });

    return this.userRepository.save(agent);
  }

  async generateToken(
    actorId: string,
    dto: GenerateImpersonationTokenDto,
  ): Promise<ImpersonationToken> {
    const actor = await this.userRepository.findOne({
      where: { id: actorId },
    });
    if (!actor) throw new NotFoundException('Actor not found');

    if (actor.role !== UserRole.ADMIN && actor.role !== UserRole.AGENT) {
      throw new BadRequestException('Only admins and agents can impersonate');
    }

    const expiry = new Date(dto.expiresAt);
    if (expiry <= new Date()) {
      throw new BadRequestException('expiresAt must be in the future');
    }
    const MAX_HOURS = parseInt(process.env.MAX_IMPERSONATION_HOURS || '72', 10);
    const maxExpiry = new Date(Date.now() + MAX_HOURS * 60 * 60 * 1000);
    if (expiry > maxExpiry) {
      throw new BadRequestException(`Token expiry cannot exceed ${MAX_HOURS} hours from now`);
    }

    // Invalidate existing active tokens for this actor-target pair (optional, but cleaner)
    await this.tokenRepository.update(
      {
        actorId: actorId,
        targetBranchId: dto.targetBranchId,
        isActive: true,
      },
      { isActive: false },
    );

    const token = this.tokenRepository.create({
      token: uuidv4(),
      actorId: actorId,
      targetBranchId: dto.targetBranchId,
      expiresAt: new Date(dto.expiresAt),
    });

    return this.tokenRepository.save(token);
  }

  async validateToken(tokenStr: string): Promise<ImpersonationToken> {
    const token = await this.tokenRepository.findOne({
      where: {
        token: tokenStr,
        isActive: true,
        expiresAt: MoreThanOrEqual(new Date()),
      },
      relations: ['actor', 'targetBranch', 'targetBranch.business'],
    });

    if (!token)
      throw new BadRequestException('Invalid or expired impersonation token');
    return token;
  }

  async generateCustomerToken(
    actorId: string,
    dto: GenerateCustomerImpersonationTokenDto,
  ): Promise<CustomerImpersonationToken> {
    const actor = await this.userRepository.findOne({ where: { id: actorId } });
    if (!actor) throw new NotFoundException('Actor not found');
    if (actor.role !== UserRole.ADMIN && actor.role !== UserRole.AGENT) {
      throw new BadRequestException('Only admins and agents can impersonate customers');
    }

    const customer = await this.userRepository.findOne({
      where: { id: dto.targetCustomerId, role: UserRole.CUSTOMER },
    });
    if (!customer) throw new NotFoundException('Target customer not found');

    const expiry = new Date(dto.expiresAt);
    if (expiry <= new Date()) {
      throw new BadRequestException('expiresAt must be in the future');
    }
    const MAX_HOURS = parseInt(process.env.MAX_IMPERSONATION_HOURS || '72', 10);
    const maxExpiry = new Date(Date.now() + MAX_HOURS * 60 * 60 * 1000);
    if (expiry > maxExpiry) {
      throw new BadRequestException(`Token expiry cannot exceed ${MAX_HOURS} hours from now`);
    }

    // Invalidate existing active tokens for this actor-customer pair
    await this.customerTokenRepository.update(
      { actorId, targetCustomerId: dto.targetCustomerId, isActive: true },
      { isActive: false },
    );

    const token = this.customerTokenRepository.create({
      token: uuidv4(),
      actorId,
      targetCustomerId: dto.targetCustomerId,
      targetBranchId: dto.targetBranchId,
      expiresAt: expiry,
    });

    return this.customerTokenRepository.save(token);
  }

  async validateCustomerToken(tokenStr: string): Promise<CustomerImpersonationToken> {
    const token = await this.customerTokenRepository.findOne({
      where: {
        token: tokenStr,
        isActive: true,
        expiresAt: MoreThanOrEqual(new Date()),
      },
      relations: ['actor', 'targetCustomer'],
    });

    if (!token)
      throw new BadRequestException('Invalid or expired customer impersonation token');
    return token;
  }

  async getActorPermissions(actorId: string) {
    const actor = await this.userRepository.findOne({
      where: { id: actorId },
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'permissions', 'status'],
    });

    if (!actor) throw new NotFoundException('Actor not found');

    if (actor.role !== UserRole.ADMIN && actor.role !== UserRole.AGENT) {
      throw new ForbiddenException('Only admins and agents can view impersonation permissions');
    }

    const permissions: string[] = actor.role === UserRole.ADMIN
      ? Object.values(BackendModule)
      : (actor.permissions || []);

    return {
      id: actor.id,
      email: actor.email,
      firstName: actor.firstName,
      lastName: actor.lastName,
      role: actor.role,
      status: actor.status,
      permissions,
      hasFullAccess: actor.role === UserRole.ADMIN || permissions.includes(BackendModule.ALL),
    };
  }

  async listActorTokens(actorId: string) {
    return this.tokenRepository.find({
      where: { actorId, isActive: true, expiresAt: MoreThanOrEqual(new Date()) },
      relations: ['targetBranch', 'targetBranch.business'],
      order: { createdAt: 'DESC' },
    });
  }

  async revokeToken(tokenId: string) {
    const result = await this.tokenRepository.update({ id: tokenId }, { isActive: false });
    if (result.affected === 0) throw new NotFoundException('Token not found');
    return { message: 'Token revoked successfully' };
  }

  async getAuditLogs(filter: AuditLogFilterDto) {
    const where: FindOptionsWhere<AuditLog> = {};
    if (filter.actorId) where.actorId = filter.actorId;
    if (filter.businessId) where.businessId = filter.businessId;
    if (filter.branchId) where.branchId = filter.branchId;
    if (filter.module) where.module = filter.module;

    const page = filter.page || 1;
    const limit = filter.limit || 10;

    const [data, total] = await this.auditLogRepository.findAndCount({
      where,
      relations: ['actor', 'business', 'branch'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async logAction(logData: Partial<AuditLog>) {
    const log = this.auditLogRepository.create(logData);
    return this.auditLogRepository.save(log);
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredTokens() {
    await this.tokenRepository.update(
      { isActive: true, expiresAt: LessThan(new Date()) },
      { isActive: false },
    );
    await this.customerTokenRepository.update(
      { isActive: true, expiresAt: LessThan(new Date()) },
      { isActive: false },
    );
  }
}
