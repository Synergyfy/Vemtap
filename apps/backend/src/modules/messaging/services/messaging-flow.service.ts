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
import { BranchesService } from '../../branches/branches.service';

@Injectable()
export class MessagingFlowService {
  constructor(
    @InjectRepository(Flow)
    private readonly flowRepo: Repository<Flow>,
    private readonly branchesService: BranchesService,
  ) {}

  private async getBranchId(
    user: User,
    requestBranchId?: string,
  ): Promise<string> {
    if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
      if (!requestBranchId) {
        throw new BadRequestException(
          'branchId is required for Owners and Admins',
        );
      }
      if (user.role === UserRole.OWNER) {
        const hasAccess = await this.branchesService.checkBranchAccess(
          user,
          requestBranchId,
        );
        if (!hasAccess) {
          throw new BadRequestException(
            'You do not have access to this branch',
          );
        }
      }
      return requestBranchId;
    }
    if (!user.branchId) {
      throw new BadRequestException('User is not associated with any branch');
    }
    return user.branchId;
  }

  async create(dto: CreateFlowDto, user: User): Promise<Flow> {
    const branchId = await this.getBranchId(user, dto.branchId);
    const branch = await this.branchesService.findById(branchId);

    const flow = this.flowRepo.create({
      businessId: branch.businessId,
      branchId,
      name: dto.name,
      triggerType: dto.triggerType,
      status: FlowStatus.DRAFT,
      structure: dto.structure || { nodes: [], edges: [] },
    } as any) as unknown as Flow;

    return this.flowRepo.save(flow);
  }

  async findAll(query: GetFlowsDto, user: User): Promise<Flow[]> {
    const branchId = await this.getBranchId(user, query.branchId);
    const branch = await this.branchesService.findById(branchId);

    return this.flowRepo.find({
      where: { businessId: branch.businessId, branchId } as any,
    });
  }

  async updateStatus(
    id: string,
    dto: UpdateFlowStatusDto,
    user: User,
  ): Promise<Flow> {
    const flow = await this.findOne(id, user);
    flow.status = dto.status;
    return this.flowRepo.save(flow);
  }

  async findOne(id: string, user: User): Promise<Flow> {
    const flow = await this.flowRepo.findOne({ where: { id } });

    if (!flow) {
      throw new BadRequestException('Flow not found');
    }

    if (user.role === UserRole.ADMIN) return flow;

    if (user.role === UserRole.OWNER) {
      const hasAccess = await this.branchesService.checkBranchAccess(
        user,
        flow.branchId,
      );
      if (!hasAccess) {
        throw new BadRequestException('Access denied');
      }
      return flow;
    }

    if (flow.branchId !== user.branchId) {
      throw new BadRequestException('Access denied');
    }

    return flow;
  }
}
