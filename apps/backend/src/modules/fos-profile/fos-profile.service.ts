import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { FosAuditLog } from '../fos-settings/entities/fos-config.entity';
import { UpdateProfileDto } from './dto/profile.dto';

@Injectable()
export class FosProfileService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(FosAuditLog)
    private readonly auditLogRepo: Repository<FosAuditLog>,
  ) {}

  private toProfile(user: User) {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatar: user.avatar ?? null,
      role: user.role,
      status: user.status,
    };
  }

  private userName(user: User): string {
    return (
      `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
    );
  }

  getProfile(user: User) {
    return this.toProfile(user);
  }

  async updateProfile(user: User, dto: UpdateProfileDto) {
    const changes: string[] = [];
    if (dto.firstName !== undefined) {
      if (dto.firstName !== user.firstName) changes.push('first name');
      user.firstName = dto.firstName;
    }
    if (dto.lastName !== undefined) {
      if (dto.lastName !== user.lastName) changes.push('last name');
      user.lastName = dto.lastName;
    }
    if (dto.avatar !== undefined) {
      if (dto.avatar !== user.avatar) changes.push('avatar');
      user.avatar = dto.avatar;
    }
    if (dto.email !== undefined && dto.email !== user.email) {
      const existing = await this.userRepo.findOne({
        where: { email: dto.email.toLowerCase() },
      });
      if (existing && existing.id !== user.id) {
        throw new ConflictException('A user with that email already exists');
      }
      user.email = dto.email.toLowerCase();
      changes.push('email');
    }

    const saved = await this.userRepo.save(user);

    if (changes.length > 0) {
      await this.auditLogRepo.save(
        this.auditLogRepo.create({
          timestamp: new Date(),
          user: this.userName(saved),
          action: 'Profile Updated',
          details: `Changed ${changes.join(', ')}`,
        }),
      );
    }

    return this.toProfile(saved);
  }

  async getActivity(user: User, limit: number) {
    const cap = Math.min(limit || 20, 100);
    const rows = await this.auditLogRepo.find({
      where: { user: this.userName(user) },
      order: { timestamp: 'DESC' },
      take: cap,
    });
    return {
      entries: rows.map((r) => ({
        id: r.id,
        timestamp: r.timestamp.toISOString(),
        user: r.user,
        action: r.action,
        details: r.details,
      })),
    };
  }
}
