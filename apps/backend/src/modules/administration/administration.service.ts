import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, LessThan, MoreThanOrEqual } from 'typeorm';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { ImpersonationToken } from './entities/impersonation-token.entity';
import { AuditLog } from './entities/audit-log.entity';
import { AdminCreateAgentDto, GenerateImpersonationTokenDto, AuditLogFilterDto } from './dto/administration.dto';
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
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async createAgent(dto: AdminCreateAgentDto): Promise<User> {
    const existingEmail = await this.userRepository.findOne({ where: { email: dto.email.toLowerCase() } });
    if (existingEmail) throw new BadRequestException('Email already in use');

    const existingPhone = await this.userRepository.findOne({ where: { phone: dto.phone } });
    if (existingPhone) throw new BadRequestException('Phone number already in use');

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

  async generateToken(dto: GenerateImpersonationTokenDto): Promise<ImpersonationToken> {
    const actor = await this.userRepository.findOne({ where: { id: dto.actorId } });
    if (!actor) throw new NotFoundException('Actor not found');
    
    if (actor.role !== UserRole.ADMIN && actor.role !== UserRole.AGENT) {
      throw new BadRequestException('Only admins and agents can impersonate');
    }

    // Invalidate existing active tokens for this actor-target pair (optional, but cleaner)
    await this.tokenRepository.update(
      { actorId: dto.actorId, targetBranchId: dto.targetBranchId, isActive: true },
      { isActive: false }
    );

    const token = this.tokenRepository.create({
      token: uuidv4(),
      actorId: dto.actorId,
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

    if (!token) throw new BadRequestException('Invalid or expired impersonation token');
    return token;
  }

  async getAuditLogs(filter: AuditLogFilterDto) {
    const where: FindOptionsWhere<AuditLog> = {};
    if (filter.actorId) where.actorId = filter.actorId;
    if (filter.businessId) where.businessId = filter.businessId;
    if (filter.branchId) where.branchId = filter.branchId;
    if (filter.module) where.module = filter.module;

    const [data, total] = await this.auditLogRepository.findAndCount({
      where,
      relations: ['actor', 'business', 'branch'],
      order: { createdAt: 'DESC' },
      skip: (filter.page - 1) * filter.limit,
      take: filter.limit,
    });

    return {
      data,
      meta: {
        total,
        page: filter.page,
        lastPage: Math.ceil(total / filter.limit),
      },
    };
  }

  async logAction(logData: Partial<AuditLog>) {
    const log = this.auditLogRepository.create(logData);
    return this.auditLogRepository.save(log);
  }
}
