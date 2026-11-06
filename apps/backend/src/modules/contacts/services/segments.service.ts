import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import { Segment, SegmentType } from '../entities/segment.entity';
import { User } from '../../users/entities/user.entity';
import { CreateSegmentDto, UpdateSegmentDto } from '../dto/segment.dto';
import { Branch } from '../../branches/entities/branch.entity';
import { SegmentCriteriaService } from './segment-criteria.service';
import type { SegmentCriteriaDto } from '../dto/segment-criteria.dto';

/** A dynamic segment's cached size is refreshed when older than this. */
const SIZE_TTL_MS = 10 * 60 * 1000;

@Injectable()
export class SegmentsService {
  constructor(
    @InjectRepository(Segment)
    private readonly segmentRepo: Repository<Segment>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
    private readonly criteriaService: SegmentCriteriaService,
  ) {}

  /**
   * Where-clause for "segments this caller may see". A branch narrows it; the
   * business always bounds it. Without either there is no scope at all — and
   * TypeORM would treat an `undefined` branchId as "any branch" — so refuse.
   */
  private scope(
    branchId?: string,
    businessId?: string,
  ): FindOptionsWhere<Segment> {
    if (!branchId && !businessId) {
      throw new ForbiddenException('Branch or business context required');
    }
    return {
      ...(branchId && { branchId }),
      ...(businessId && { businessId }),
    };
  }

  private assertCriteria(type: SegmentType | undefined, criteria: unknown) {
    if (type === SegmentType.DYNAMIC && !criteria) {
      throw new BadRequestException('A dynamic segment needs criteria');
    }
  }

  async createSegment(dto: CreateSegmentDto, user: User): Promise<Segment> {
    const branchId = dto.branchId || user.branchId;
    if (!branchId) {
      throw new ForbiddenException('Branch context required to create segment');
    }

    const branch = await this.branchRepo.findOne({ where: { id: branchId } });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    if (user.businessId && branch.businessId !== user.businessId) {
      throw new ForbiddenException('Branch belongs to another business');
    }

    const type = dto.type ?? SegmentType.STATIC;
    this.assertCriteria(type, dto.criteria);

    const segment = this.segmentRepo.create({
      ...dto,
      type,
      criteria: (dto.criteria as Record<string, unknown>) ?? null,
      branchId,
      businessId: branch.businessId,
    });
    if (type === SegmentType.DYNAMIC) {
      await this.refreshSize(segment, true);
    }

    return this.segmentRepo.save(segment);
  }

  async getSegments(
    branchId?: string,
    businessId?: string,
  ): Promise<Segment[]> {
    const segments = await this.segmentRepo.find({
      where: this.scope(branchId, businessId),
      order: { name: 'ASC' },
    });
    const stale = segments.filter((segment) => this.isStale(segment));
    for (const segment of stale) {
      await this.refreshSize(segment);
      await this.segmentRepo.update(segment.id, {
        size: segment.size,
        lastComputedAt: segment.lastComputedAt,
      });
    }
    return segments;
  }

  async getSegmentWithMembers(
    id: string,
    branchId?: string,
    businessId?: string,
  ): Promise<Segment> {
    const segment = await this.segmentRepo.findOne({
      where: { id, ...this.scope(branchId, businessId) },
      relations: ['users'],
    });

    if (!segment) {
      throw new NotFoundException('Segment not found');
    }

    return segment;
  }

  async updateSegment(
    id: string,
    dto: UpdateSegmentDto,
    branchId?: string,
    businessId?: string,
  ): Promise<Segment> {
    const segment = await this.getSegmentWithMembers(id, branchId, businessId);
    const type = dto.type ?? segment.type;
    const criteria = dto.criteria ?? segment.criteria;
    this.assertCriteria(type, criteria);

    Object.assign(segment, dto, {
      type,
      criteria: (criteria as Record<string, unknown>) ?? null,
    });
    if (type === SegmentType.DYNAMIC && (dto.criteria || dto.type)) {
      await this.refreshSize(segment, true);
    }
    return this.segmentRepo.save(segment);
  }

  async deleteSegment(
    id: string,
    branchId?: string,
    businessId?: string,
  ): Promise<void> {
    const segment = await this.getSegmentWithMembers(id, branchId, businessId);
    await this.segmentRepo.remove(segment);
  }

  async addMembers(
    id: string,
    userIds: string[],
    branchId?: string,
    businessId?: string,
  ): Promise<Segment> {
    const segment = await this.getSegmentWithMembers(id, branchId, businessId);
    this.assertStatic(segment);

    const usersToAdd = await this.userRepo.find({
      where: { id: In(userIds) },
    });

    // Merge without duplicates
    const currentMemberIds = segment.users.map((u) => u.id);
    const newMembers = usersToAdd.filter(
      (u) => !currentMemberIds.includes(u.id),
    );

    segment.users.push(...newMembers);
    segment.size = segment.users.length;
    return this.segmentRepo.save(segment);
  }

  async removeMembers(
    id: string,
    userIds: string[],
    branchId?: string,
    businessId?: string,
  ): Promise<Segment> {
    const segment = await this.getSegmentWithMembers(id, branchId, businessId);
    this.assertStatic(segment);
    segment.users = segment.users.filter((u) => !userIds.includes(u.id));
    segment.size = segment.users.length;
    return this.segmentRepo.save(segment);
  }

  /** Live size and channel reach for a rule set, while the owner builds it. */
  async preview(businessId: string | undefined, criteria: SegmentCriteriaDto) {
    if (!businessId) {
      throw new ForbiddenException('Business context required');
    }
    return this.criteriaService.preview(businessId, criteria ?? {});
  }

  async criteriaOptions(businessId: string | undefined) {
    if (!businessId) {
      throw new ForbiddenException('Business context required');
    }
    return this.criteriaService.criteriaOptions(businessId);
  }

  /** Spend, frequency, branch mix, favourites and sample patrons of a segment. */
  async insights(id: string, branchId?: string, businessId?: string) {
    const segment = await this.getSegmentWithMembers(id, branchId, businessId);
    const memberIds = await this.memberIdsOf(segment);
    const insights = await this.criteriaService.insights(
      segment.businessId,
      memberIds,
    );
    if (segment.size !== memberIds.length) {
      await this.segmentRepo.update(segment.id, {
        size: memberIds.length,
        lastComputedAt: new Date(),
      });
    }
    return {
      segmentId: segment.id,
      name: segment.name,
      type: segment.type,
      ...insights,
    };
  }

  private memberIdsOf(segment: Segment): Promise<string[]> {
    if (segment.type === SegmentType.DYNAMIC) {
      return this.criteriaService.memberIds(
        segment.businessId,
        segment.criteria ?? {},
      );
    }
    return Promise.resolve((segment.users ?? []).map((user) => user.id));
  }

  private isStale(segment: Segment): boolean {
    return (
      segment.type === SegmentType.DYNAMIC &&
      (!segment.lastComputedAt ||
        Date.now() - new Date(segment.lastComputedAt).getTime() > SIZE_TTL_MS)
    );
  }

  private async refreshSize(segment: Segment, force = false): Promise<void> {
    if (!force && !this.isStale(segment)) return;
    const ids = await this.criteriaService.memberIds(
      segment.businessId,
      segment.criteria ?? {},
    );
    segment.size = ids.length;
    segment.lastComputedAt = new Date();
  }

  private assertStatic(segment: Segment) {
    if (segment.type === SegmentType.DYNAMIC) {
      throw new BadRequestException(
        'Members of a dynamic segment come from its criteria; edit the criteria instead',
      );
    }
  }
}
