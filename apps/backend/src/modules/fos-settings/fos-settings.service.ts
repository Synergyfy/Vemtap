import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { Setting } from '../settings/entities/setting.entity';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';

type FosSettingsField =
  | 'currency'
  | 'timezone'
  | 'dateFormat'
  | 'theme'
  | 'paystackSecretKey'
  | 'termiiApiKey';

function maskSecret(value: string | null | undefined): string {
  if (!value) return '';
  if (value.length <= 8) return `${value.slice(0, 4)}****`;
  return `${value.slice(0, 7)}****`;
}

@Injectable()
export class FosSettingsService {
  constructor(
    @InjectRepository(Setting)
    private readonly settingRepo: Repository<Setting>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  private async getSettingsEntity(): Promise<Setting> {
    const settings = await this.settingRepo.find({
      order: { createdAt: 'ASC' },
      take: 1,
    });
    if (!settings[0]) {
      const created = this.settingRepo.create({});
      return this.settingRepo.save(created);
    }
    return settings[0];
  }

  private toFosSettings(settings: Setting) {
    return {
      currency: settings.defaultCurrency,
      timezone: settings.timezone,
      dateFormat: settings.dateFormat,
      theme: settings.theme,
      paystackSecretKey: maskSecret(settings.paystackSecretKey),
      termiiApiKey: maskSecret(settings.termiiApiKey),
    };
  }

  async getSettings() {
    const settings = await this.getSettingsEntity();
    return { settings: this.toFosSettings(settings) };
  }

  async updateSettings(dto: Partial<Record<FosSettingsField, string>>) {
    const settings = await this.getSettingsEntity();
    if (dto.currency !== undefined) settings.defaultCurrency = dto.currency;
    if (dto.timezone !== undefined) settings.timezone = dto.timezone;
    if (dto.dateFormat !== undefined) settings.dateFormat = dto.dateFormat;
    if (dto.theme !== undefined) settings.theme = dto.theme;
    if (dto.paystackSecretKey !== undefined)
      settings.paystackSecretKey = dto.paystackSecretKey;
    if (dto.termiiApiKey !== undefined)
      settings.termiiApiKey = dto.termiiApiKey;
    const saved = await this.settingRepo.save(settings);
    return { settings: this.toFosSettings(saved) };
  }

  async getTeam() {
    const members = await this.userRepo.find({
      where: [{ role: UserRole.ADMIN }, { role: UserRole.SUPER_ADMIN }],
      order: { createdAt: 'ASC' },
    });
    return {
      members: members.map((m) => ({
        id: m.id,
        name: `${m.firstName || ''} ${m.lastName || ''}`.trim() || m.email,
        email: m.email,
        role: m.role,
        status: m.status,
        type: 'INTERNAL',
      })),
    };
  }

  async inviteMember(dto: { email: string; name?: string; role?: string }) {
    const email = dto.email.toLowerCase();
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('A user with that email already exists');
    }

    const role =
      dto.role === UserRole.SUPER_ADMIN || dto.role === 'SUPER_ADMIN'
        ? UserRole.SUPER_ADMIN
        : UserRole.ADMIN;

    const nameParts = (dto.name || '').trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || email.split('@')[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    const password =
      process.env.DEFAULT_INVITE_PASSWORD ||
      randomBytes(9).toString('base64url').slice(0, 12);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const hashedPassword: string = await bcrypt.hash(password, 10);

    const user = await this.userRepo.save(
      this.userRepo.create({
        email,
        firstName,
        lastName,
        password: hashedPassword,
        role,
        status: UserStatus.ACTIVE,
      }),
    );

    return {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`.trim() || user.email,
      email: user.email,
      role: user.role,
      status: user.status,
      type: 'INTERNAL',
      password,
    };
  }

  async removeMember(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Team member ${id} not found`);
    }
    if (user.role === UserRole.SUPER_ADMIN) {
      const superAdminCount = await this.userRepo.count({
        where: { role: UserRole.SUPER_ADMIN },
      });
      if (superAdminCount <= 1) {
        throw new ConflictException(
          'Cannot remove the last SUPER_ADMIN account',
        );
      }
    }
    await this.userRepo.remove(user);
    return { message: 'Team member removed successfully' };
  }
}
