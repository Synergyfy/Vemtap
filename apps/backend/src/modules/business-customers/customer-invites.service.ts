import { randomBytes } from 'crypto';
import {
  BadRequestException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../businesses/entities/business.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { MailService } from '../mail/mail.service';
import { formatPhoneNumber } from '../../common/utils/phone.util';
import { CustomerInvite } from './entities/customer-invite.entity';
import {
  CreateCustomerInviteDto,
  CustomerInviteResponseDto,
  InviteRegistrationDto,
  InviteRegistrationResponseDto,
  PublicCustomerInviteDto,
} from './dto/customer-invites.dto';

const INVITE_TTL_DAYS = 30;
const INVITE_TAG = 'invite';

/**
 * Customer invite links: a business shares `/join/{uniqueCode}?invite=TOKEN`
 * and whoever opens it can leave their details. Each registration lands in the
 * business's contacts (the audience campaigns and segments read), tagged
 * `invite`; giving an email also sends a "you've joined" email.
 */
@Injectable()
export class CustomerInvitesService {
  constructor(
    @InjectRepository(CustomerInvite)
    private readonly invites: Repository<CustomerInvite>,
    @InjectRepository(Business)
    private readonly businesses: Repository<Business>,
    @InjectRepository(Branch)
    private readonly branches: Repository<Branch>,
    @InjectRepository(Contact)
    private readonly contacts: Repository<Contact>,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  private appUrl() {
    return (
      this.config.get<string>('VEMTAP_APP_URL') ?? 'https://vemtap.com'
    ).replace(/\/+$/, '');
  }

  async create(
    businessId: string,
    userId: string,
    dto: CreateCustomerInviteDto,
  ): Promise<CustomerInviteResponseDto> {
    if (!businessId) throw new BadRequestException('Business ID is required');
    const business = await this.businesses.findOne({
      where: { id: businessId },
      select: ['id', 'name', 'uniqueCode'],
    });
    if (!business) throw new NotFoundException('Business not found');

    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000);
    const invite = await this.invites.save(
      this.invites.create({
        businessId,
        createdById: userId,
        token: randomBytes(16).toString('base64url'),
        channels: dto.channels?.length ? dto.channels : null,
        expiresAt,
      }),
    );
    return {
      token: invite.token,
      url: `${this.appUrl()}/join/${encodeURIComponent(business.uniqueCode)}?invite=${encodeURIComponent(invite.token)}`,
      expiresAt,
      merchantName: business.name,
    };
  }

  /** The invite and its business in one query; `404` when either is gone. */
  private async load(token: string) {
    const invite = await this.invites
      .createQueryBuilder('invite')
      .innerJoinAndMapOne(
        'invite.business',
        Business,
        'business',
        'business.id = invite.businessId AND business.deletedAt IS NULL',
      )
      .where('invite.token = :token', { token })
      .getOne();
    if (!invite) throw new NotFoundException('Invite not found');
    const business = (invite as CustomerInvite & { business: Business })
      .business;
    const valid = !invite.revokedAt && invite.expiresAt.getTime() > Date.now();
    return { invite, business, valid };
  }

  async describe(token: string): Promise<PublicCustomerInviteDto> {
    const { business, valid } = await this.load(token);
    return {
      merchantId: business.id,
      merchantName: business.name,
      merchantSlug: business.uniqueCode,
      logoUrl: business.logoUrl ?? null,
      valid,
    };
  }

  private async loadValid(token: string) {
    const loaded = await this.load(token);
    if (!loaded.valid) {
      throw new GoneException(
        'This invite link is no longer valid. Ask the business for a new one.',
      );
    }
    return loaded;
  }

  /**
   * Adds or refreshes the contact: matched on phone when one is given,
   * otherwise on email, within this business only.
   */
  private async upsertContact(
    business: Business,
    details: { name?: string; phone?: string; email?: string },
  ) {
    const existing = await this.contacts.findOne({
      where: details.phone
        ? { businessId: business.id, phone: details.phone }
        : { businessId: business.id, email: details.email },
    });
    if (existing) {
      existing.name = details.name ?? existing.name;
      existing.email = details.email ?? existing.email;
      existing.optOut = false;
      existing.tags = Array.from(
        new Set([...(existing.tags ?? []), INVITE_TAG]),
      );
      return this.contacts.save(existing);
    }
    const mainBranch = await this.branches.findOne({
      where: { businessId: business.id, isMainBranch: true },
      select: ['id'],
    });
    return this.contacts.save(
      this.contacts.create({
        businessId: business.id,
        branchId: mainBranch?.id,
        name: details.name,
        phone: details.phone,
        email: details.email,
        tags: [INVITE_TAG],
      }),
    );
  }

  private sendJoinedEmail(email: string, business: Business) {
    void this.mail.sendGenericEmail(
      email,
      `You've joined ${business.name} on VemTap`,
      `Hi there,\n\nYou're now on ${business.name}'s customer list, so you'll hear about their deals and rewards first.\n\nCreate your free VemTap account to claim deals and track your rewards: ${this.appUrl()}/get-started`,
    );
  }

  async register(
    token: string,
    dto: InviteRegistrationDto,
  ): Promise<InviteRegistrationResponseDto> {
    const { invite, business } = await this.loadValid(token);
    const email = dto.email?.trim().toLowerCase() || undefined;
    await this.upsertContact(business, {
      name: dto.fullName.trim(),
      phone: formatPhoneNumber(dto.phone.trim()),
      email,
    });
    await this.invites.increment({ id: invite.id }, 'registrations', 1);
    if (email) this.sendJoinedEmail(email, business);
    return {
      status: email ? 'pending_email' : 'registered',
      merchantName: business.name,
    };
  }

  async registerEmail(
    token: string,
    rawEmail: string,
  ): Promise<InviteRegistrationResponseDto> {
    const { invite, business } = await this.loadValid(token);
    const email = rawEmail.trim().toLowerCase();
    await this.upsertContact(business, { email });
    await this.invites.increment({ id: invite.id }, 'registrations', 1);
    this.sendJoinedEmail(email, business);
    return { status: 'pending_email', merchantName: business.name };
  }
}
