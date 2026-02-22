import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from './entities/branch.entity';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
import { Business } from '../businesses/entities/business.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private branchesRepository: Repository<Branch>,
    @InjectRepository(Business)
    private businessRepository: Repository<Business>,
    private subscriptionsService: SubscriptionsService,
  ) {}

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
    const branchLimit = capabilities.capabilities.branches.limit;
    const currentBranches = capabilities.capabilities.branches.used;

    if (typeof branchLimit === 'number' && currentBranches >= branchLimit) {
      throw new ForbiddenException(
        `You have reached the branch limit for your plan (${branchLimit} branches)`,
      );
    }

    const branch = this.branchesRepository.create({
      ...createBranchDto,
      businessId: business.id,
    });
    return this.branchesRepository.save(branch);
  }

  async findAll(ownerId: string): Promise<Branch[]> {
    const business = await this.businessRepository.findOne({
      where: { ownerId },
    });
    if (!business) {
      throw new NotFoundException('Business not found for this owner');
    }
    return this.branchesRepository.find({ where: { businessId: business.id } });
  }

  async findOne(ownerId: string, id: string): Promise<Branch> {
    const business = await this.businessRepository.findOne({
      where: { ownerId },
    });
    if (!business) {
      throw new NotFoundException('Business not found for this owner');
    }

    const branch = await this.branchesRepository.findOne({
      where: { id, businessId: business.id },
    });
    if (!branch) {
      throw new NotFoundException(
        'Branch not found or does not belong to your business',
      );
    }
    return branch;
  }

  async update(
    ownerId: string,
    id: string,
    updateBranchDto: UpdateBranchDto,
  ): Promise<Branch> {
    const branch = await this.findOne(ownerId, id);
    Object.assign(branch, updateBranchDto);
    return this.branchesRepository.save(branch);
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const branch = await this.findOne(ownerId, id);
    await this.branchesRepository.remove(branch);
  }
}
