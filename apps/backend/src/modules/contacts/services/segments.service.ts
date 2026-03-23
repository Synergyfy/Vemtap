import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Segment } from '../entities/segment.entity';
import { User } from '../../users/entities/user.entity';
import { CreateSegmentDto, UpdateSegmentDto } from '../dto/segment.dto';
import { Branch } from '../../branches/entities/branch.entity';

@Injectable()
export class SegmentsService {
  constructor(
    @InjectRepository(Segment)
    private readonly segmentRepo: Repository<Segment>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
  ) {}

  async createSegment(dto: CreateSegmentDto, user: User): Promise<Segment> {
    const branchId = dto.branchId || user.branchId;
    if (!branchId) {
      throw new ForbiddenException('Branch context required to create segment');
    }

    const branch = await this.branchRepo.findOne({ where: { id: branchId } });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    const segment = this.segmentRepo.create({
      ...dto,
      branchId,
      businessId: branch.businessId,
    });

    return this.segmentRepo.save(segment);
  }

  async getSegments(branchId: string): Promise<Segment[]> {
    return this.segmentRepo.find({
      where: { branchId },
      order: { name: 'ASC' },
    });
  }

  async getSegmentWithMembers(id: string, branchId: string): Promise<Segment> {
    const segment = await this.segmentRepo.findOne({
      where: { id, branchId },
      relations: ['users'],
    });

    if (!segment) {
      throw new NotFoundException('Segment not found');
    }

    return segment;
  }

  async updateSegment(id: string, dto: UpdateSegmentDto, branchId: string): Promise<Segment> {
    const segment = await this.getSegmentWithMembers(id, branchId);
    Object.assign(segment, dto);
    return this.segmentRepo.save(segment);
  }

  async deleteSegment(id: string, branchId: string): Promise<void> {
    const segment = await this.getSegmentWithMembers(id, branchId);
    await this.segmentRepo.remove(segment);
  }

  async addMembers(id: string, userIds: string[], branchId: string): Promise<Segment> {
    const segment = await this.getSegmentWithMembers(id, branchId);
    
    const usersToAdd = await this.userRepo.find({
      where: { id: In(userIds) },
    });

    // Merge without duplicates
    const currentMemberIds = segment.users.map(u => u.id);
    const newMembers = usersToAdd.filter(u => !currentMemberIds.includes(u.id));
    
    segment.users.push(...newMembers);
    return this.segmentRepo.save(segment);
  }

  async removeMembers(id: string, userIds: string[], branchId: string): Promise<Segment> {
    const segment = await this.getSegmentWithMembers(id, branchId);
    segment.users = segment.users.filter(u => !userIds.includes(u.id));
    return this.segmentRepo.save(segment);
  }
}
