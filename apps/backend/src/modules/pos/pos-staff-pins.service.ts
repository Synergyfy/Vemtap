import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { PosStaffPin } from './entities/pos-staff-pin.entity';
import { PosOverrideLog } from './entities/pos-override-log.entity';
import { PosOverrideAction } from './entities/pos-enums';
import { User, UserRole } from '../users/entities/user.entity';
import {
  PosOverrideQueryDto,
  SetPosStaffPinDto,
  VerifyPosOverrideDto,
} from './dto/pos-staff-pin.dto';

const POS_STAFF_ROLES = [UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF];
const OVERRIDE_TOKEN_TTL_SECONDS = 120;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
/** Bounds the bcrypt work per verify; a business has a handful of supervisors. */
const MAX_SUPERVISORS_CHECKED = 50;

interface OverrideClaims {
  typ: 'pos_override';
  sub: string;
  biz: string;
  act: PosOverrideAction;
  ref?: string;
}

@Injectable()
export class PosStaffPinsService {
  constructor(
    @InjectRepository(PosStaffPin)
    private readonly pinRepository: Repository<PosStaffPin>,
    @InjectRepository(PosOverrideLog)
    private readonly overrideLogRepository: Repository<PosOverrideLog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  /** Team members who can work the till, with their PIN status. Two queries. */
  async list(businessId: string) {
    const staff = await this.userRepository.find({
      where: { businessId, role: In(POS_STAFF_ROLES) },
      select: ['id', 'firstName', 'lastName', 'email', 'role', 'branchId'],
      order: { firstName: 'ASC' },
    });
    const pins = staff.length
      ? await this.pinRepository.find({
          where: { businessId, userId: In(staff.map((user) => user.id)) },
        })
      : [];
    const pinByUser = new Map(pins.map((pin) => [pin.userId, pin]));

    return {
      data: staff.map((user) => {
        const pin = pinByUser.get(user.id);
        return {
          userId: user.id,
          name: this.name(user),
          role: user.role,
          branchId: user.branchId ?? null,
          hasPin: !!pin,
          isSupervisor: pin?.isSupervisor ?? false,
          lockedUntil:
            pin?.lockedUntil && pin.lockedUntil > new Date()
              ? pin.lockedUntil
              : null,
        };
      }),
    };
  }

  async set(businessId: string, userId: string, dto: SetPosStaffPinDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId, businessId, role: In(POS_STAFF_ROLES) },
      select: ['id'],
    });
    if (!user) throw new NotFoundException('Team member not found');

    const pinHash = await bcrypt.hash(dto.pin, 10);
    const existing = await this.pinRepository.findOne({
      where: { businessId, userId },
    });
    const pin = existing ?? this.pinRepository.create({ businessId, userId });
    pin.pinHash = pinHash;
    pin.failedAttempts = 0;
    pin.lockedUntil = null;
    if (dto.isSupervisor !== undefined) pin.isSupervisor = dto.isSupervisor;
    const saved = await this.pinRepository.save(pin);
    return {
      userId: saved.userId,
      hasPin: true,
      isSupervisor: saved.isSupervisor,
    };
  }

  async remove(businessId: string, userId: string) {
    const result = await this.pinRepository.softDelete({ businessId, userId });
    if (!result.affected)
      throw new NotFoundException('No PIN set for this user');
    return { message: 'PIN removed' };
  }

  count(businessId: string) {
    return this.pinRepository.count({ where: { businessId } });
  }

  /**
   * A supervisor types their PIN on the cashier's till. The PIN is checked
   * against this business's unlocked supervisor PINs; a match is logged and
   * returns a two-minute token for that one action. Failed attempts count
   * against every candidate, so guessing locks the supervisor PINs.
   */
  async verify(requester: User, dto: VerifyPosOverrideDto) {
    const candidates = await this.pinRepository.find({
      where: { businessId: requester.businessId, isSupervisor: true },
      relations: ['user'],
      take: MAX_SUPERVISORS_CHECKED,
    });
    const now = new Date();
    const unlocked = candidates.filter(
      (pin) => !pin.lockedUntil || pin.lockedUntil <= now,
    );
    if (!unlocked.length) {
      throw new ForbiddenException(
        'No supervisor PIN is available. Ask the owner to set one.',
      );
    }

    let match: PosStaffPin | undefined;
    for (const pin of unlocked) {
      if (await bcrypt.compare(dto.pin, pin.pinHash)) {
        match = pin;
        break;
      }
    }

    if (!match) {
      await this.pinRepository
        .createQueryBuilder()
        .update(PosStaffPin)
        .set({
          failedAttempts: () => '"failedAttempts" + 1',
          lockedUntil: () =>
            `CASE WHEN "failedAttempts" + 1 >= ${MAX_FAILED_ATTEMPTS} THEN now() + interval '${LOCK_MINUTES} minutes' ELSE "lockedUntil" END`,
        })
        .where('id IN (:...ids)', { ids: unlocked.map((pin) => pin.id) })
        .execute();
      throw new UnauthorizedException('Incorrect supervisor PIN');
    }

    if (match.failedAttempts) {
      await this.pinRepository.update(
        { id: match.id },
        { failedAttempts: 0, lockedUntil: null },
      );
    }

    await this.overrideLogRepository.save(
      this.overrideLogRepository.create({
        businessId: requester.businessId,
        branchId: requester.branchId ?? null,
        action: dto.action,
        supervisorId: match.userId,
        requestedById: requester.id,
        referenceId: dto.referenceId ?? null,
        reason: dto.reason ?? null,
      }),
    );

    const claims: OverrideClaims = {
      typ: 'pos_override',
      sub: match.userId,
      biz: requester.businessId,
      act: dto.action,
      ...(dto.referenceId ? { ref: dto.referenceId } : {}),
    };
    const overrideToken = await this.jwtService.signAsync(claims, {
      expiresIn: OVERRIDE_TOKEN_TTL_SECONDS,
    });
    return {
      overrideToken,
      expiresAt: new Date(now.getTime() + OVERRIDE_TOKEN_TTL_SECONDS * 1000),
      supervisorName: match.user ? this.name(match.user) : 'Supervisor',
    };
  }

  /**
   * Throws unless `token` is a live override for this business and action
   * (and this reference, when the token was bound to one).
   */
  async assertOverride(
    token: string | undefined,
    businessId: string,
    action: PosOverrideAction,
    referenceId?: string,
  ): Promise<void> {
    if (!token) {
      throw new ForbiddenException(
        `A supervisor PIN is required to ${action.replace('_', ' ')}`,
      );
    }
    let claims: OverrideClaims;
    try {
      claims = await this.jwtService.verifyAsync<OverrideClaims>(token);
    } catch {
      throw new ForbiddenException('Supervisor approval expired. Ask again.');
    }
    const valid =
      claims.typ === 'pos_override' &&
      claims.biz === businessId &&
      claims.act === action &&
      (!claims.ref || !referenceId || claims.ref === referenceId);
    if (!valid) {
      throw new ForbiddenException('Supervisor approval does not cover this');
    }
  }

  async listOverrides(businessId: string, query: PosOverrideQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const [rows, total] = await this.overrideLogRepository.findAndCount({
      where: query.action
        ? { businessId, action: query.action }
        : { businessId },
      relations: ['supervisor', 'requestedBy'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data: rows.map((row) => ({
        id: row.id,
        action: row.action,
        createdAt: row.createdAt,
        branchId: row.branchId,
        referenceId: row.referenceId,
        reason: row.reason,
        supervisorId: row.supervisorId,
        supervisorName: row.supervisor ? this.name(row.supervisor) : null,
        requestedById: row.requestedById,
        requestedByName: row.requestedBy ? this.name(row.requestedBy) : null,
      })),
      total,
      page,
      limit,
    };
  }

  private name(user: Pick<User, 'firstName' | 'lastName' | 'email'>) {
    return (
      `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email
    );
  }
}
