import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Partnership, PartnershipStatus } from './entities/partnership.entity';
import { BranchesService } from '../branches/branches.service';
import { InvitePartnershipDto } from './dto/invite-partnership.dto';
import { NearbyPartnersQueryDto } from './dto/nearby-partners-query.dto';
import {
  InvitationQueryType,
  PartnershipQueryDto,
} from './dto/partnership-query.dto';
import { Branch } from '../branches/entities/branch.entity';
import { User } from '../users/entities/user.entity';
import { BusinessStatus } from '../businesses/entities/business.entity';
import { paginateWithCursor } from '../../common/utils/cursor-pagination.util';

@Injectable()
export class PartnershipsService {
  constructor(
    @InjectRepository(Partnership)
    private partnershipRepository: Repository<Partnership>,
    private branchesService: BranchesService,
  ) {}

  async findNearbyPartnerableBranches(
    query: NearbyPartnersQueryDto,
    user: User,
  ) {
    const { branchId, distance = 10000, limit = 20, page = 1 } = query;
    const skip = (page - 1) * limit;

    const sourceBranch = await this.branchesService.findById(branchId, [
      'business',
    ]);
    if (!sourceBranch) {
      throw new NotFoundException('Source branch not found');
    }

    if (sourceBranch.business?.status !== BusinessStatus.ACTIVE) {
      throw new ForbiddenException(
        'Your business is not verified by admin. You cannot access partnership services until approved.',
      );
    }

    const hasAccess = await this.branchesService.checkBranchAccess(
      user,
      branchId,
    );
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this branch');
    }

    if (sourceBranch.latitude == null || sourceBranch.longitude == null) {
      throw new BadRequestException(
        'Source branch has no location coordinates',
      );
    }

    const sourceLocation = `ST_SetSRID(ST_MakePoint(${sourceBranch.longitude}, ${sourceBranch.latitude}), 4326)::geography`;

    const qb = this.partnershipRepository.manager
      .createQueryBuilder(Branch, 'b')
      .innerJoinAndSelect('b.business', 'business')
      .where('b.id != :sourceBranchId', { sourceBranchId: branchId })
      .andWhere('b.businessId != :sourceBusinessId', {
        sourceBusinessId: sourceBranch.businessId,
      })
      .andWhere('business.status = :activeStatus', {
        activeStatus: BusinessStatus.ACTIVE,
      })
      .andWhere('b.isActive = :isActive', { isActive: true })
      .andWhere('b.joinDiscoveryNetwork = :joinDiscoveryNetwork', {
        joinDiscoveryNetwork: true,
      })
      .andWhere('b.receivePartnerRequests = :receivePartnerRequests', {
        receivePartnerRequests: true,
      })
      .andWhere('b.latitude IS NOT NULL')
      .andWhere('b.longitude IS NOT NULL')
      .andWhere(`ST_DWithin(b.location, ${sourceLocation}, :distance)`, {
        distance,
      });

    qb.andWhere((sub) => {
      const subQuery = sub
        .subQuery()
        .select('1')
        .from(Partnership, 'p')
        .where(
          `((p.initiatorBranchId = :sourceBranchId AND p.recipientBranchId = b.id) OR (p.initiatorBranchId = b.id AND p.recipientBranchId = :sourceBranchId))`,
        )
        .andWhere('p.status IN (:...statuses)', {
          statuses: [PartnershipStatus.PENDING, PartnershipStatus.ACCEPTED],
        })
        .getQuery();
      return `NOT EXISTS ${subQuery}`;
    });

    qb.addSelect(
      `ROUND(ST_Distance(b.location, ${sourceLocation})::numeric, 2)`,
      'distanceMeters',
    );
    qb.orderBy('"distanceMeters"', 'ASC');
    qb.offset(skip).limit(limit);

    const { entities, raw } = await qb.getRawAndEntities();

    const data = entities.map((entity, index) => {
      const rawRow = raw[index];
      const distanceMeters = rawRow
        ? parseFloat(rawRow.distanceMeters || rawRow.distance_meters)
        : null;
      return {
        ...entity,
        distanceMeters,
      };
    });

    const totalQb = this.partnershipRepository.manager
      .createQueryBuilder(Branch, 'b')
      .innerJoin('b.business', 'business')
      .where('b.id != :sourceBranchId', { sourceBranchId: branchId })
      .andWhere('b.businessId != :sourceBusinessId', {
        sourceBusinessId: sourceBranch.businessId,
      })
      .andWhere('business.status = :activeStatus', {
        activeStatus: BusinessStatus.ACTIVE,
      })
      .andWhere('b.isActive = :isActive', { isActive: true })
      .andWhere('b.joinDiscoveryNetwork = :joinDiscoveryNetwork', {
        joinDiscoveryNetwork: true,
      })
      .andWhere('b.receivePartnerRequests = :receivePartnerRequests', {
        receivePartnerRequests: true,
      })
      .andWhere('b.latitude IS NOT NULL')
      .andWhere('b.longitude IS NOT NULL')
      .andWhere(`ST_DWithin(b.location, ${sourceLocation}, :distance)`, {
        distance,
      });

    totalQb.andWhere((sub) => {
      const subQuery = sub
        .subQuery()
        .select('1')
        .from(Partnership, 'p')
        .where(
          `((p.initiatorBranchId = :sourceBranchId AND p.recipientBranchId = b.id) OR (p.initiatorBranchId = b.id AND p.recipientBranchId = :sourceBranchId))`,
        )
        .andWhere('p.status IN (:...statuses)', {
          statuses: [PartnershipStatus.PENDING, PartnershipStatus.ACCEPTED],
        })
        .getQuery();
      return `NOT EXISTS ${subQuery}`;
    });

    const total = await totalQb.getCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async invitePartnership(dto: InvitePartnershipDto, user: User) {
    const { initiatorBranchId, recipientBranchId } = dto;

    if (initiatorBranchId === recipientBranchId) {
      throw new BadRequestException('A branch cannot partner with itself');
    }

    const initiator = await this.branchesService.findById(initiatorBranchId, [
      'business',
    ]);
    const recipient = await this.branchesService.findById(recipientBranchId, [
      'business',
    ]);

    if (initiator.business?.status !== BusinessStatus.ACTIVE) {
      throw new ForbiddenException(
        'Your business is not verified by admin. You cannot create partnership invitations until approved.',
      );
    }

    if (recipient.business?.status !== BusinessStatus.ACTIVE) {
      throw new BadRequestException(
        'The recipient business is not verified by admin.',
      );
    }

    if (initiator.businessId === recipient.businessId) {
      throw new BadRequestException(
        'Cannot partner with a branch of the same business',
      );
    }

    const hasAccess = await this.branchesService.checkBranchAccess(
      user,
      initiatorBranchId,
    );
    if (!hasAccess) {
      throw new ForbiddenException(
        'You are not authorized to invite partnerships from this branch',
      );
    }

    const existing = await this.partnershipRepository.findOne({
      where: [
        { initiatorBranchId, recipientBranchId },
        {
          initiatorBranchId: recipientBranchId,
          recipientBranchId: initiatorBranchId,
        },
      ],
    });

    if (existing) {
      if (existing.status === PartnershipStatus.ACCEPTED) {
        throw new BadRequestException('Branches are already partners');
      }
      if (existing.status === PartnershipStatus.PENDING) {
        throw new BadRequestException(
          'A partnership invitation is already pending',
        );
      }
      if (existing.status === PartnershipStatus.DECLINED) {
        existing.status = PartnershipStatus.PENDING;
        existing.initiatorBranchId = initiatorBranchId;
        existing.recipientBranchId = recipientBranchId;
        return this.partnershipRepository.save(existing);
      }
    }

    const newPartnership = this.partnershipRepository.create({
      initiatorBranchId,
      recipientBranchId,
      status: PartnershipStatus.PENDING,
    });

    return this.partnershipRepository.save(newPartnership);
  }

  async respondToInvitation(
    id: string,
    user: User,
    status: PartnershipStatus.ACCEPTED | PartnershipStatus.DECLINED,
  ) {
    const partnership = await this.partnershipRepository.findOne({
      where: { id },
    });

    if (!partnership) {
      throw new NotFoundException(
        `Partnership invitation with ID ${id} not found`,
      );
    }

    if (partnership.status !== PartnershipStatus.PENDING) {
      throw new BadRequestException(
        `Cannot respond to a partnership invitation that is ${partnership.status}`,
      );
    }

    const recipientBranch = await this.branchesService.findById(
      partnership.recipientBranchId,
      ['business'],
    );

    if (recipientBranch.business?.status !== BusinessStatus.ACTIVE) {
      throw new ForbiddenException(
        'Your business is not verified by admin. You cannot respond to partnership invitations until approved.',
      );
    }

    const hasAccess = await this.branchesService.checkBranchAccess(
      user,
      partnership.recipientBranchId,
    );
    if (!hasAccess) {
      throw new ForbiddenException(
        'You are not authorized to respond to this invitation',
      );
    }

    partnership.status = status;
    return this.partnershipRepository.save(partnership);
  }

  async getInvitations(query: PartnershipQueryDto, user: User) {
    const { branchId, type, status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const hasAccess = await this.branchesService.checkBranchAccess(
      user,
      branchId,
    );
    if (!hasAccess) {
      throw new ForbiddenException(
        'You are not authorized to view invitations for this branch',
      );
    }

    const qb = this.partnershipRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.initiatorBranch', 'initiatorBranch')
      .leftJoinAndSelect('p.recipientBranch', 'recipientBranch');

    if (type === InvitationQueryType.SENT) {
      qb.where('p.initiatorBranchId = :branchId', { branchId });
    } else if (type === InvitationQueryType.RECEIVED) {
      qb.where('p.recipientBranchId = :branchId', { branchId });
    } else {
      qb.where(
        '(p.initiatorBranchId = :branchId OR p.recipientBranchId = :branchId)',
        { branchId },
      );
    }

    if (status) {
      qb.andWhere('p.status = :status', { status });
    }

    const result = await paginateWithCursor({
      queryBuilder: qb,
      cursor: (query as any)?.cursor || (query as any)?.nextCursor,
      page,
      limit,
      sortField: 'createdAt',
      sortOrder: 'DESC',
      entityAlias: 'p',
    });

    return {
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      cursor: result.cursor,
      nextCursor: result.nextCursor,
      prevCursor: result.prevCursor,
      hasNextPage: result.hasNextPage,
    };
  }
}
