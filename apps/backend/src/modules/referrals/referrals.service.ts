import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { BusinessesService } from '../businesses/businesses.service';
import { AffiliatesService } from '../affiliates/affiliates.service';
import { ExternalAffiliateService } from '../affiliates/external-affiliate.service';
import { Business } from '../businesses/entities/business.entity';

/** How long after sign-up a referral code can still be claimed. */
const CLAIM_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Tries allowed when a generated personal code collides with an existing one. */
const MAX_CODE_ATTEMPTS = 5;

/** Unambiguous alphabet — no I, O, 0 or 1. Used for personal customer codes. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export type ReferralAudience = 'customer' | 'business';

/** One entry on the referral list as it is shared with the code owner. */
export interface ReferralEntry {
  id: string;
  name: string;
  type: 'customer' | 'business';
  joinedAt: Date;
}

/** Name shown for a referred person: first name plus last initial only. */
function maskName(user: Pick<User, 'firstName' | 'lastName'>): string {
  const firstName = (user.firstName || '').trim();
  const lastName = (user.lastName || '').trim();
  return lastName
    ? `${firstName} ${lastName.charAt(0).toUpperCase()}.`
    : firstName;
}

@Injectable()
export class ReferralsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => BusinessesService))
    private readonly businessesService: BusinessesService,
    @Inject(forwardRef(() => AffiliatesService))
    private readonly affiliatesService: AffiliatesService,
    private readonly externalAffiliateService: ExternalAffiliateService,
  ) {}

  /**
   * The signed-in user's own referral code plus who has used it so far.
   * Owners get their business uniqueCode, agents their affiliate code and
   * everyone else a personal code, issued on first call.
   */
  async getMe(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.role === UserRole.OWNER || user.role === UserRole.MANAGER) {
      const business = await this.businessesService.findByOwner(userId);
      const code = business?.uniqueCode ?? '';
      if (!code) return this.buildResponse(code, 'business', []);

      const [referredBusinesses, referredUsers] = await Promise.all([
        this.dataSource
          .getRepository(Business)
          .find({
            where: { referralCode: code },
            order: { createdAt: 'DESC' },
          }),
        this.findUsersByCode(code),
      ]);

      return this.buildResponse(code, 'business', [
        ...referredBusinesses.map(
          (referred): ReferralEntry => ({
            id: referred.id,
            name: referred.name,
            type: 'business',
            joinedAt: referred.createdAt,
          }),
        ),
        ...referredUsers.map(
          (referred): ReferralEntry => ({
            id: referred.id,
            name: maskName(referred),
            type: 'customer',
            joinedAt: referred.createdAt,
          }),
        ),
      ]);
    }

    if (user.role === UserRole.AGENT) {
      const profile = await this.affiliatesService.getOrCreateProfile(userId);
      const referredUsers = await this.findUsersByCode(profile.referralCode);
      return this.buildResponse(
        profile.referralCode,
        'business',
        referredUsers.map(
          (referred): ReferralEntry => ({
            id: referred.id,
            name: maskName(referred),
            type: 'customer',
            joinedAt: referred.createdAt,
          }),
        ),
      );
    }

    const code = await this.ensureMyReferralCode(user);
    const referredUsers = await this.findUsersByCode(code);
    return this.buildResponse(
      code,
      'customer',
      referredUsers.map(
        (referred): ReferralEntry => ({
          id: referred.id,
          name: maskName(referred),
          type: 'customer',
          joinedAt: referred.createdAt,
        }),
      ),
    );
  }

  /**
   * Lets a just-created account apply one referral code before it is lost.
   */
  async claim(code: string, userId: string) {
    const referralCode = (code || '').trim().toUpperCase();
    if (!referralCode) {
      throw new BadRequestException('A referral code is required');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const signedUpAt = new Date(user.createdAt).getTime();
    if (Date.now() - signedUpAt > CLAIM_WINDOW_MS) {
      throw new BadRequestException(
        'Referral codes can only be claimed in the first 24 hours after signing up',
      );
    }

    if (user.referralCode) {
      throw new BadRequestException(
        'A referral code has already been applied to this account',
      );
    }

    if (await this.isOwnCode(user, referralCode)) {
      throw new BadRequestException('You cannot use your own referral code');
    }

    if (!(await this.codeResolves(referralCode))) {
      throw new BadRequestException('That referral code is not valid');
    }

    await this.resolveAndApplyReferral(referralCode, userId);
    return { message: 'Referral code applied' };
  }

  /**
   * Resolves a referral code entered at sign-up (or claimed afterwards) and
   * applies the affiliate / B2B redemption. Codes are looked up in order:
   * agent affiliate code, business uniqueCode, then a user's personal code.
   * The inbound code is recorded on the signed-up user so referrer counts
   * work; agent referrals additionally earn commission through the existing
   * affiliate flow. Unknown codes are ignored silently — they must never
   * block sign-up.
   */
  async resolveAndApplyReferral(
    code: string,
    userId: string,
    options: { affiliateRequiresBusiness?: boolean } = {},
  ): Promise<void> {
    const referralCode = (code || '').trim().toUpperCase();
    if (!referralCode) return;

    // `referralCode` stands for "the code I signed up with"; sign-up paths
    // usually persist it while creating the user, so only fill it in when
    // empty (e.g. claimed codes, invited users).
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user && !user.referralCode) {
      user.referralCode = referralCode;
      await this.userRepository.save(user);
    }

    const affiliate = await this.affiliatesService.findByReferralCode(
      referralCode,
    );
    if (affiliate) {
      const business = await this.businessesService.findByOwner(userId);
      // An account-only upgrade records nothing yet — the code stays on the
      // user for when their business is created.
      if (!options.affiliateRequiresBusiness || business) {
        await this.affiliatesService.recordReferral(
          affiliate.id,
          business?.id,
          userId,
        );
      }
      return;
    }

    await this.handleB2BReferralAndPartnership(referralCode, userId);
  }

  /**
   * Applies the business-coded side of a redemption: a business uniqueCode
   * links the referral back to the referring business (and auto-establishes
   * their branch partnership); a personal code only needed the inbound
   * recording above; anything else falls back to external affiliate
   * validation. Shared by the previous auth-service flows.
   */
  private async handleB2BReferralAndPartnership(
    referralCode: string,
    referredUserId: string,
  ) {
    try {
      const business = await this.businessesService.findByOwner(referredUserId);
      if (!business) return;

      // Check if referring code belongs to a business
      let referringBusiness: Business | null = null;
      try {
        referringBusiness = await this.dataSource.manager.findOne(Business, {
          where: { uniqueCode: referralCode },
          relations: ['branches'],
        });
      } catch (e) {
        // Not a business
      }

      if (referringBusiness) {
        // Record the referral code on the referred business
        await this.businessesService.update(business.id, {
          referralCode,
        });

        // Fetch fresh branches
        const referredUser = await this.userRepository.findOne({
          where: { id: referredUserId },
        });
        const referringBranchId = referringBusiness.branches?.[0]?.id;
        const referredBranchId = referredUser?.branchId;

        if (referringBranchId && referredBranchId) {
          const manager = this.dataSource.manager;

          // Check if partnership already exists
          const existingPartnership = await manager.findOne('partnerships', {
            where: [
              {
                initiatorBranchId: referringBranchId,
                recipientBranchId: referredBranchId,
              },
              {
                initiatorBranchId: referredBranchId,
                recipientBranchId: referringBranchId,
              },
            ],
          });

          if (!existingPartnership) {
            await manager.insert('partnerships', {
              initiatorBranchId: referringBranchId,
              recipientBranchId: referredBranchId,
              status: 'Accepted',
            });
            console.log(
              `[PARTNERSHIP] Auto-established B2B partnership between branch ${referringBranchId} and branch ${referredBranchId}`,
            );
          }
        }
      } else {
        // A personal code only counts the sign-up itself (already recorded)
        // — otherwise fall back to external affiliate validation.
        const personalReferrer = await this.userRepository.findOne({
          where: { myReferralCode: referralCode },
        });
        if (!personalReferrer) {
          const externalAffiliate =
            await this.externalAffiliateService.validateReferralCode(
              referralCode,
            );
          if (externalAffiliate.valid) {
            await this.businessesService.update(business.id, {
              referralCode,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error handling B2B referral and partnership:', error);
    }
  }

  /** Users who signed up with `code` (stored values vary in case). */
  private async findUsersByCode(code: string): Promise<User[]> {
    if (!code) return [];
    return this.userRepository
      .createQueryBuilder('u')
      .where('LOWER(u.referralCode) = LOWER(:code)', { code })
      .orderBy('u.createdAt', 'DESC')
      .getMany();
  }

  /** True when `referralCode` is the caller's own code (any flavour). */
  private async isOwnCode(user: User, referralCode: string): Promise<boolean> {
    if (user.myReferralCode === referralCode) return true;

    if (user.role === UserRole.OWNER || user.role === UserRole.MANAGER) {
      const business = await this.businessesService.findByOwner(user.id);
      if (business?.uniqueCode?.toUpperCase() === referralCode) return true;
    }
    if (user.role === UserRole.AGENT) {
      const profile = await this.affiliatesService.getOrCreateProfile(user.id);
      if (profile?.referralCode?.toUpperCase() === referralCode) return true;
    }
    return false;
  }

  /** True when `referralCode` matches an existing code of any kind. */
  private async codeResolves(referralCode: string): Promise<boolean> {
    const affiliate = await this.affiliatesService.findByReferralCode(
      referralCode,
    );
    if (affiliate) return true;

    const [referringBusiness, referrer] = await Promise.all([
      this.dataSource.manager.findOne(Business, {
        where: { uniqueCode: referralCode },
      }),
      this.userRepository.findOne({
        where: { myReferralCode: referralCode },
      }),
    ]);
    return !!(referringBusiness || referrer);
  }

  /**
   * Returns the user's personal code, generating one with up to five tries
   * when a concurrent claim grabs the same random code.
   */
  private async ensureMyReferralCode(user: User): Promise<string> {
    if (user.myReferralCode) return user.myReferralCode;

    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
      }
      user.myReferralCode = code;
      try {
        await this.userRepository.save(user);
        return code;
      } catch (error) {
        // Unique violation — another request may have taken this code.
        console.error('Referral code collision, retrying:', error);
      }
    }
    // All five tries lost the race — report no code rather than one that is
    // not actually stored.
    return '';
  }

  private buildResponse(
    code: string,
    audience: ReferralAudience,
    referrals: ReferralEntry[],
  ) {
    return {
      code,
      audience,
      totalReferrals: referrals.length,
      referrals,
    };
  }
}
