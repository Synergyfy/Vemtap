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
import { Business } from '../businesses/entities/business.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { DevicesService } from '../devices/devices.service';
import { isValidUsername, RESERVED_USERNAMES, generateUsernameFromName } from '../../common/utils/username.util';

import { User } from '../users/entities/user.entity';
import { QrThriveService } from '../qr-thrive/qr-thrive.service';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private branchesRepository: Repository<Branch>,
    @InjectRepository(Business)
    private businessRepository: Repository<Business>,
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
      createBranchDto.username = await this.generateUniqueUsername(createBranchDto.name);
    } else {
      const usernameError = await this.validateUsername(createBranchDto.username);
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
    const branch = await this.findById(branchId);
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
      const usernameError = await this.validateUsername(updateBranchDto.username, id);
      if (usernameError) {
        throw new BadRequestException(usernameError);
      }
    }

    Object.assign(branch, updateBranchDto);
    const savedBranch = await this.branchesRepository.save(branch);

    // Auto-update main QR code URL if username changed and branch has a main QR
    if (
      updateBranchDto.username &&
      updateBranchDto.username !== oldUsername &&
      branch.mainQrCodeId &&
      user
    ) {
      try {
        await this.qrThriveService.updateMainQRCodeUrl(
          user,
          id,
          branch.mainQrCodeId,
          updateBranchDto.username,
        );
      } catch (error) {
        console.error(
          `Failed to update main QR code URL for branch ${id}:`,
          error,
        );
        // Non-blocking
      }
    }

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

  async validateUsername(username: string, excludeBranchId?: string): Promise<string | null> {
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
    const query = this.branchesRepository.createQueryBuilder('branch')
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

  async generateUniqueUsername(branchName: string, attempt: number = 0): Promise<string> {
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
    const baseName = generateUsernameFromName(branchName).substring(0, 30 - suffix.length);
    return baseName + suffix;
  }
}
