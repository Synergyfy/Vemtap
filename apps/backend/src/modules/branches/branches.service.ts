import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from './entities/branch.entity';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
import { NearbyBranchesQueryDto } from './dto/nearby-branches-query.dto';
import { Business } from '../businesses/entities/business.entity';
import {
  CatalogueOffer,
  CatalogueOfferStatus,
} from '../catalogue/entities/catalogue-offer.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { DevicesService } from '../devices/devices.service';
import {
  isValidUsername,
  RESERVED_USERNAMES,
  generateUsernameFromName,
} from '../../common/utils/username.util';

import { User } from '../users/entities/user.entity';
import { QrThriveService } from '../qr-thrive/qr-thrive.service';
import { Visit } from '../visitors/entities/visit.entity';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private branchesRepository: Repository<Branch>,
    @InjectRepository(Business)
    private businessRepository: Repository<Business>,
    @InjectRepository(CatalogueOffer)
    private catalogueOfferRepository: Repository<CatalogueOffer>,
    @Inject(forwardRef(() => SubscriptionsService))
    private subscriptionsService: SubscriptionsService,
    @Inject(forwardRef(() => DevicesService))
    private devicesService: DevicesService,
    @Inject(forwardRef(() => QrThriveService))
    private qrThriveService: QrThriveService,
  ) {}

  async checkBranchAccess(
    user: User,
    targetBranchId: string,
  ): Promise<boolean> {
    const userRole = String(user.role || '').toLowerCase();

    if (userRole === 'admin') return true;

    if (userRole === 'owner') {
      // Owner can access any branch that belongs to their business
      const branch = await this.branchesRepository.findOne({
        where: { id: targetBranchId },
      });

      if (!branch) {
        console.warn(
          `[BRANCH_GUARD] Access denied: Branch ${targetBranchId} not found`,
        );
        return false;
      }

      // Check if branch belongs to user's businessId from token
      if (user.businessId && branch.businessId === user.businessId) {
        return true;
      }

      // Fallback: check if the business belongs to this owner
      const business = await this.businessRepository.findOne({
        where: { ownerId: user.id },
      });

      const hasAccess = business ? branch.businessId === business.id : false;

      if (!hasAccess) {
        console.warn(
          `[BRANCH_GUARD] Owner ${user.id} access denied to branch ${targetBranchId}. ` +
            `User Business: ${user.businessId}, Branch Business: ${branch.businessId}, Real Business: ${business?.id}`,
        );
      }

      return hasAccess;
    }

    // Manager and Staff can only access their assigned branch
    const hasAccess = user.branchId === targetBranchId;
    if (!hasAccess) {
      console.warn(
        `[BRANCH_GUARD] Staff/Manager ${user.id} access denied to branch ${targetBranchId}. Assigned: ${user.branchId}`,
      );
    }
    return hasAccess;
  }

  async create(
    ownerId: string,
    createBranchDto: CreateBranchDto,
  ): Promise<Branch> {
    const business = await this.businessRepository.findOne({
      where: { ownerId },
    });
    if (!business) {
      throw new NotFoundException('Business not found for this owner');
    }

    // Check plan limits
    const capabilities = await this.subscriptionsService.getCapabilities(
      business.id,
    );

    if (capabilities.capabilities.branches.enabled === false) {
      throw new ForbiddenException(
        'The branches feature is not included in your current plan.',
      );
    }

    const branchLimit = capabilities.capabilities.branches.limit;
    const currentBranches = capabilities.capabilities.branches.used;

    if (typeof branchLimit === 'number' && currentBranches >= branchLimit) {
      throw new ForbiddenException(
        `You have reached the branch limit for your plan (${branchLimit} branches)`,
      );
    }

    // Find main branch to inherit settings
    const mainBranch = await this.branchesRepository.findOne({
      where: { businessId: business.id, isMainBranch: true },
    });

    // Auto-generate username if not provided
    if (!createBranchDto.username) {
      createBranchDto.username = await this.generateUniqueUsername(
        createBranchDto.name,
      );
    } else {
      const usernameError = await this.validateUsername(
        createBranchDto.username,
      );
      if (usernameError) {
        throw new BadRequestException(usernameError);
      }
    }

    const branch = this.branchesRepository.create({
      ...createBranchDto,
      businessId: business.id,
      phone: createBranchDto.phone || business.phone,
      officialEmail: createBranchDto.officialEmail || business.officialEmail,
      // Inherit from main branch
      businessHours: mainBranch?.businessHours,
      welcomeMessage: mainBranch?.welcomeMessage,
      successMessage: mainBranch?.successMessage,
      privacyMessage: mainBranch?.privacyMessage,
      rewardMessage: mainBranch?.rewardMessage,
      about: mainBranch?.about,
      engagement: createBranchDto.engagement ?? mainBranch?.engagement,
      rewardEnabled: mainBranch?.rewardEnabled ?? false,
      rewardVisitThreshold: mainBranch?.rewardVisitThreshold ?? 5,
      linkedinUrl: mainBranch?.linkedinUrl,
      reviewUrl: mainBranch?.reviewUrl,
      showReview: mainBranch?.showReview ?? true,
      showSocial: mainBranch?.showSocial ?? true,
      showFeedback: mainBranch?.showFeedback ?? true,
      logoUrl: mainBranch?.logoUrl || business.logoUrl,
      website: mainBranch?.website || business.website,
      whatsappNumber: mainBranch?.whatsappNumber || business.whatsappNumber,
    });
    const savedBranch = await this.branchesRepository.save(branch);

    // Automatically generate a device for the new branch
    try {
      await this.devicesService.createAutoDevice(savedBranch.id);
    } catch (error) {
      console.error(
        `Failed to automatically create device for branch ${savedBranch.id}:`,
        error,
      );
      // We don't throw here to avoid failing branch creation if device auto-gen fails
    }

    // Automatically create main QR code if QR-Thrive is provisioned
    try {
      await this.qrThriveService.createMainQRCode(
        { id: ownerId } as User,
        savedBranch,
      );
    } catch (error) {
      console.error(
        `Failed to auto-create main QR code for branch ${savedBranch.id}:`,
        error,
      );
      // Non-blocking - branch creation succeeds regardless
    }

    return savedBranch;
  }

  async findAll(businessId: string): Promise<Branch[]> {
    return this.branchesRepository.find({ where: { businessId } });
  }

  async findOne(businessId: string, id: string): Promise<Branch> {
    const branch = await this.branchesRepository.findOne({
      where: { id, businessId },
    });
    if (!branch) {
      throw new NotFoundException(
        'Branch not found or does not belong to your business',
      );
    }
    return branch;
  }

  async findById(id: string, relations: string[] = []): Promise<Branch> {
    const branch = await this.branchesRepository.findOne({
      where: { id },
      relations,
    });
    if (!branch) throw new NotFoundException(`Branch with ID ${id} not found`);
    return branch;
  }

  async findByCode(uniqueCode: string): Promise<Branch> {
    const branch = await this.branchesRepository.findOne({
      where: { uniqueCode, isActive: true },
      relations: ['business'],
    });
    if (!branch)
      throw new NotFoundException(`Branch with code ${uniqueCode} not found`);
    return branch;
  }

  async findBusinessByOwner(ownerId: string): Promise<Business | null> {
    return this.businessRepository.findOne({ where: { ownerId } });
  }

  async getBusinessOwnerId(businessId: string): Promise<string | null> {
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
      select: ['ownerId'],
    });
    return business?.ownerId || null;
  }

  async getBusinessId(branchId: string): Promise<string> {
    const branch = await this.branchesRepository.findOne({
      where: { id: branchId },
      select: ['businessId'],
    });
    if (!branch)
      throw new NotFoundException(`Branch with ID ${branchId} not found`);
    return branch.businessId;
  }

  async update(
    businessId: string,
    id: string,
    updateBranchDto: UpdateBranchDto,
    user?: User,
  ): Promise<Branch> {
    const branch = await this.findOne(businessId, id);

    if (updateBranchDto.isMainBranch === true && !branch.isMainBranch) {
      // Unset previous main branch for this business
      await this.branchesRepository.update(
        { businessId: branch.businessId, isMainBranch: true },
        { isMainBranch: false },
      );
    } else if (updateBranchDto.isMainBranch === false && branch.isMainBranch) {
      throw new ForbiddenException(
        'A business must have at least one main branch',
      );
    }

    // Validate username if being updated
    const oldUsername = branch.username;
    if (updateBranchDto.username && updateBranchDto.username !== oldUsername) {
      const usernameError = await this.validateUsername(
        updateBranchDto.username,
        id,
      );
      if (usernameError) {
        throw new BadRequestException(usernameError);
      }
    }

    Object.assign(branch, updateBranchDto);
    const savedBranch = await this.branchesRepository.save(branch);

    return savedBranch;
  }

  async remove(businessId: string, id: string): Promise<void> {
    const branch = await this.findOne(businessId, id);
    if (branch.isMainBranch) {
      throw new ForbiddenException('The main branch cannot be deleted');
    }
    await this.branchesRepository.remove(branch);
  }

  async findByUsername(username: string): Promise<Branch | null> {
    return this.branchesRepository.findOne({
      where: { username, isActive: true },
      relations: ['business'],
    });
  }

  async validateUsername(
    username: string,
    excludeBranchId?: string,
  ): Promise<string | null> {
    // Check format
    if (!username || username.length < 3 || username.length > 30) {
      return 'Username must be 3-30 characters';
    }

    const usernameRegex = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;
    if (!usernameRegex.test(username)) {
      return 'Username must be lowercase, start and end with a letter or number, and contain only letters, numbers, and hyphens';
    }

    // Check reserved words
    if (RESERVED_USERNAMES.includes(username)) {
      return `Username "${username}" is reserved and cannot be used`;
    }

    // Check uniqueness
    const query = this.branchesRepository
      .createQueryBuilder('branch')
      .where('branch.username = :username', { username });

    if (excludeBranchId) {
      query.andWhere('branch.id != :excludeBranchId', { excludeBranchId });
    }

    const existing = await query.getOne();
    if (existing) {
      return `Username "${username}" is already taken`;
    }

    return null; // Valid
  }

  async generateUniqueUsername(
    branchName: string,
    attempt: number = 0,
  ): Promise<string> {
    let base = generateUsernameFromName(branchName);

    if (attempt > 0) {
      base = `${base}-${attempt}`;
    }

    const error = await this.validateUsername(base);
    if (!error) return base;

    // Recursive retry with incremental suffix
    if (attempt < 10) {
      return this.generateUniqueUsername(branchName, attempt + 1);
    }

    // Fallback to random
    const suffix = '-' + Math.floor(Math.random() * 1000);
    const baseName = generateUsernameFromName(branchName).substring(
      0,
      30 - suffix.length,
    );
    return baseName + suffix;
  }

  async findNearbyBranches(
    sourceBranchId: string,
    query: NearbyBranchesQueryDto,
  ) {
    const distance = query.distance ?? 500;
    const limit = query.limit ?? 20;

    const sourceBranch = await this.branchesRepository.findOne({
      where: { id: sourceBranchId },
      select: ['id', 'name', 'latitude', 'longitude'],
    });

    if (!sourceBranch) {
      throw new NotFoundException('Source branch not found');
    }

    if (sourceBranch.latitude == null || sourceBranch.longitude == null) {
      throw new BadRequestException(
        'Source branch has no location coordinates',
      );
    }

    const promotionsJoin = query.withPromotions
      ? `
      AND EXISTS (
        SELECT 1 FROM catalogue_offers co
        WHERE co.branch_id = b.id
          AND co.status = 'active'
      )`
      : '';

    const rows = await this.branchesRepository.query(
      `
      WITH source AS (
        SELECT id, name, location, business_id
        FROM branches
        WHERE id = $1
      )
      SELECT
        b.id,
        b.name,
        b.address,
        b.city,
        b.state,
        b.latitude,
        b.longitude,
        b.business_id                                                AS "businessId",
        bu.name                                                      AS "businessName",
        bu.logo_url                                                  AS "businessLogoUrl",
        ROUND(ST_Distance(b.location, source.location)::numeric, 2)  AS "distanceMeters"
      FROM branches b, source
      JOIN businesses bu ON bu.id = b.business_id
      WHERE b.id != source.id
        AND b.business_id != source.business_id
        AND b.latitude IS NOT NULL
        AND b.longitude IS NOT NULL
        AND b.is_active = true
        AND b.join_discovery_network = true
        AND b.receive_partner_requests = true
        AND ST_DWithin(b.location, source.location, $2)
        ${promotionsJoin}
      ORDER BY "distanceMeters"
      LIMIT $3
    `,
      [sourceBranchId, distance, limit],
    );

    if (query.withPromotions && rows.length > 0) {
      const branchIds: string[] = rows.map((r: any) => r.id);

      const offers = await this.catalogueOfferRepository
        .createQueryBuilder('offer')
        .where('offer.branch_id IN (:...branchIds)', { branchIds })
        .andWhere('offer.status = :status', {
          status: CatalogueOfferStatus.ACTIVE,
        })
        .getMany();

      const offersByBranch = new Map<string, CatalogueOffer[]>();
      for (const offer of offers) {
        if (!offersByBranch.has(offer.branchId)) {
          offersByBranch.set(offer.branchId, []);
        }
        offersByBranch.get(offer.branchId)!.push(offer);
      }

      for (const row of rows) {
        row.offers = offersByBranch.get(row.id) ?? [];
      }
    }

    return {
      source: { id: sourceBranch.id, name: sourceBranch.name },
      distanceMeters: distance,
      results: rows,
    };
  }

  async getLastTopRecentCustomer(branchId: string) {
    const branch = await this.branchesRepository.findOne({
      where: { id: branchId },
    });
    if (!branch) {
      throw new NotFoundException(`Branch with ID ${branchId} not found`);
    }

    const rawResult = await this.branchesRepository.manager
      .createQueryBuilder(Visit, 'visit')
      .select('visit.customerId', 'customerId')
      .addSelect('COUNT(visit.id)', 'visitCount')
      .addSelect('MAX(visit.createdAt)', 'lastVisitAt')
      .where('visit.branchId = :branchId', { branchId })
      .groupBy('visit.customerId')
      .orderBy('"visitCount"', 'DESC')
      .addOrderBy('"lastVisitAt"', 'DESC')
      .limit(1)
      .getRawOne();

    if (!rawResult) {
      return null;
    }

    const customer = await this.branchesRepository.manager.findOne(User, {
      where: { id: rawResult.customerId },
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'phone',
        'avatar',
        'uniqueCode',
        'createdAt',
      ],
    });

    return {
      customer,
      visitCount: parseInt(rawResult.visitCount, 10),
      lastVisitAt: new Date(rawResult.lastVisitAt),
    };
  }
}
