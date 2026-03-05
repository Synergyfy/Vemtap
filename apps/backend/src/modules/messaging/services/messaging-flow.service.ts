import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Flow, FlowStatus } from '../entities/flow.entity';
import {
  CreateFlowDto,
  UpdateFlowStatusDto,
  GetFlowsDto,
} from '../dto/create-flow.dto';
import { User, UserRole } from '../../users/entities/user.entity';

@Injectable()
export class MessagingFlowService {
  constructor(
    @InjectRepository(Flow)
    private readonly flowRepo: Repository<Flow>,
  ) {}

  async create(dto: CreateFlowDto, user: User): Promise<Flow> {
    const businessId =
      user.role === UserRole.ADMIN ? dto.businessId : user.businessId;

    if (!businessId) {
      throw new BadRequestException('businessId is required');
    }

    const branchId =
      user.role === UserRole.ADMIN
        ? dto.branchId
        : dto.branchId || user.branchId;

    const flow = this.flowRepo.create({
      businessId,
      branchId,
      name: dto.name,
      triggerType: dto.triggerType,
      status: FlowStatus.DRAFT,
      structure: dto.structure || { nodes: [], edges: [] },
    });

    return this.flowRepo.save(flow);
  }

  async findAll(query: GetFlowsDto, user: User): Promise<Flow[]> {
    const { branchId, businessId } = query;

    const filteredBusinessId =
      user.role === UserRole.ADMIN ? businessId : user.businessId;
    if (!filteredBusinessId) {
      throw new BadRequestException('businessId is required');
    }

    const filteredBranchId =
      user.role === UserRole.ADMIN ? branchId : branchId || user.branchId;

    return this.flowRepo.find({
      where: filteredBranchId
        ? { businessId: filteredBusinessId, branchId: filteredBranchId }
        : { businessId: filteredBusinessId },
    });
  }

  async updateStatus(
    id: string,
    dto: UpdateFlowStatusDto,
    user: User,
  ): Promise<Flow> {
    const status = dto.status;
    const flow = await this.flowRepo.findOne(
      user.role === UserRole.ADMIN
        ? { where: { id } }
        : { where: { id, businessId: user.businessId } },
    );

    if (!flow) {
      throw new BadRequestException('Flow not found');
    }

    flow.status = status;
    return this.flowRepo.save(flow);
  }

  async findOne(id: string, user: User): Promise<Flow> {
    const flow = await this.flowRepo.findOne(
      user.role === UserRole.ADMIN
        ? { where: { id } }
        : { where: { id, businessId: user.businessId } },
    );

    if (!flow) {
      throw new BadRequestException('Flow not found');
    }

    return flow;
  }
}
