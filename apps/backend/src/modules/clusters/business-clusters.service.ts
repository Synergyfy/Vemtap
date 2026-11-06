import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';
import { Branch } from '../branches/entities/branch.entity';
import { User } from '../users/entities/user.entity';
import { Cluster, ClusterType } from './entities/cluster.entity';
import { ClusterMessage } from './entities/cluster-message.entity';
import {
  ClusterShowcaseItem,
  ShowcaseEntityType,
} from './entities/cluster-showcase-item.entity';
import { ClustersService } from './clusters.service';
import {
  ClusterChatQueryDto,
  ClusterMembersQueryDto,
  ProposeClusterDto,
  SendClusterMessageDto,
  ShowcasePreferenceDto,
  UpdateShowcaseDto,
} from './dto/business-cluster.dto';

/** Business-facing kind → the cluster hierarchy level it is stored as. */
const KIND_TYPE: Record<string, ClusterType> = {
  mall: ClusterType.BUILDING,
  plaza: ClusterType.BUILDING,
  market: ClusterType.MARKET,
  'commercial-axis': ClusterType.CUSTOM,
  strip: ClusterType.CUSTOM,
};

/** "Live deal" filter shared by the counts below (`o` = catalogue_offers). */
const LIVE_OFFER_SQL = `o."status" = 'active' AND o."deletedAt" IS NULL AND (o."endDate" IS NULL OR o."endDate" >= now())`;

type ScopedBranch = Pick<
  Branch,
  | 'id'
  | 'name'
  | 'businessId'
  | 'clusterId'
  | 'latitude'
  | 'longitude'
  | 'clusterJoinedAt'
  | 'clusterShowcase'
>;

/**
 * The cluster system from a business's side: find the cluster its branch
 * sits in (or propose one), join or leave it, see the other members, choose
 * what it shows there, and message other members. Membership itself is
 * `branches.clusterId`, the same field the admin tools and auto-assign set.
 */
@Injectable()
export class BusinessClustersService {
  constructor(
    @InjectRepository(Cluster)
    private readonly clusters: Repository<Cluster>,
    @InjectRepository(Branch)
    private readonly branches: Repository<Branch>,
    @InjectRepository(ClusterShowcaseItem)
    private readonly showcaseItems: Repository<ClusterShowcaseItem>,
    @InjectRepository(ClusterMessage)
    private readonly messages: Repository<ClusterMessage>,
    private readonly clustersService: ClustersService,
    private readonly config: ConfigService,
  ) {}

  // ------------------------------------------------------------ helpers

  /** The branch the caller acts for: the given one of their business, else their own or the main one. */
  private async branchFor(
    user: User,
    branchId?: string,
  ): Promise<ScopedBranch> {
    const select: (keyof Branch)[] = [
      'id',
      'name',
      'businessId',
      'clusterId',
      'latitude',
      'longitude',
      'clusterJoinedAt',
      'clusterShowcase',
    ];
    const id = branchId ?? user.branchId;
    const branch = id
      ? await this.branches.findOne({
          where: { id, businessId: user.businessId },
          select,
        })
      : await this.branches.findOne({
          where: { businessId: user.businessId, isMainBranch: true },
          select,
        });
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  private qrUrl(code: string) {
    const app = (
      this.config.get<string>('VEMTAP_APP_URL') ?? 'https://vemtap.com'
    ).replace(/\/+$/, '');
    return `${app}/c/${code}`;
  }

  private clusterCard(cluster: Cluster) {
    return {
      id: cluster.id,
      name: cluster.name,
      kind: cluster.kind ?? cluster.type,
      type: cluster.type,
      city: cluster.city ?? '',
      state: cluster.state ?? '',
      address: cluster.address ?? cluster.area ?? '',
      coordinates: {
        lat: Number(cluster.latitude),
        lng: Number(cluster.longitude),
      },
      radiusMeters: cluster.radiusMeters,
      status: cluster.isActive ? 'active' : 'review',
      description: cluster.description ?? '',
      createdAt: cluster.createdAt,
    };
  }

  /** The caller's branch must be a member of this cluster. */
  private async memberOf(user: User, clusterId: string, branchId?: string) {
    const branch = await this.branchFor(user, branchId);
    if (branch.clusterId !== clusterId) {
      throw new ForbiddenException(
        'Your branch is not a member of this cluster',
      );
    }
    return branch;
  }

  // --------------------------------------------------------- membership

  /**
   * `already_joined` with the branch's cluster, `detected` with the nearest
   * active cluster whose radius covers the branch, or `not_found`.
   */
  async detect(user: User, branchId?: string) {
    const branch = await this.branchFor(user, branchId);
    if (branch.clusterId) {
      const cluster = await this.clusters.findOne({
        where: { id: branch.clusterId },
      });
      if (cluster)
        return {
          scenario: 'already_joined',
          cluster: this.clusterCard(cluster),
        };
    }
    if (branch.latitude == null || branch.longitude == null) {
      return {
        scenario: 'not_found',
        cluster: null,
        reason: 'Add your branch location first',
      };
    }
    const [row] = await this.clusters.manager.query<{ id: string }[]>(
      `SELECT c."id" FROM "clusters" c
       WHERE c."isActive" = true AND c."type" <> 'district' AND c."deletedAt" IS NULL
         AND c."latitude" IS NOT NULL AND c."longitude" IS NOT NULL
         AND ST_DWithin(
           ST_SetSRID(ST_MakePoint(c."longitude"::float8, c."latitude"::float8), 4326)::geography,
           ST_SetSRID(ST_MakePoint($2::float8, $1::float8), 4326)::geography,
           c."radiusMeters")
       ORDER BY ST_Distance(
           ST_SetSRID(ST_MakePoint(c."longitude"::float8, c."latitude"::float8), 4326)::geography,
           ST_SetSRID(ST_MakePoint($2::float8, $1::float8), 4326)::geography)
       LIMIT 1`,
      [branch.latitude, branch.longitude],
    );
    if (!row) return { scenario: 'not_found', cluster: null };
    const cluster = await this.clusters.findOneOrFail({
      where: { id: row.id },
    });
    return { scenario: 'detected', cluster: this.clusterCard(cluster) };
  }

  /** The branch's cluster with its QR and headline numbers (one aggregate query). */
  async mine(user: User, branchId?: string) {
    const branch = await this.branchFor(user, branchId);
    if (!branch.clusterId)
      throw new NotFoundException('Your branch is not in a cluster');
    const cluster = await this.clusters.findOne({
      where: { id: branch.clusterId },
    });
    if (!cluster)
      throw new NotFoundException('Your branch is not in a cluster');
    const [stats] = await this.clusters.manager.query<
      {
        totalBusinesses: number;
        activeBusinesses: number;
        totalDealsInPool: number;
      }[]
    >(
      `SELECT COUNT(DISTINCT b."businessId")::int AS "totalBusinesses",
              COUNT(DISTINCT b."businessId") FILTER (WHERE b."isActive")::int AS "activeBusinesses",
              (SELECT COUNT(*)::int FROM "catalogue_offers" o
                 JOIN "branches" ob ON ob."id" = o."branchId"
                WHERE ob."clusterId" = $1 AND ${LIVE_OFFER_SQL}) AS "totalDealsInPool"
       FROM "branches" b WHERE b."clusterId" = $1 AND b."deletedAt" IS NULL`,
      [cluster.id],
    );
    return {
      ...this.clusterCard(cluster),
      qrCode: {
        url: this.qrUrl(cluster.uniqueCode),
        displayCode: cluster.uniqueCode,
        scansTotal: cluster.scanCount ?? 0,
        isActive: cluster.qrIsActive,
      },
      stats: {
        totalBusinesses: Number(stats?.totalBusinesses ?? 0),
        activeBusinesses: Number(stats?.activeBusinesses ?? 0),
        totalDealsInPool: Number(stats?.totalDealsInPool ?? 0),
        totalScans: cluster.scanCount ?? 0,
      },
      membership: {
        branchId: branch.id,
        joinedAt: branch.clusterJoinedAt,
        showcase: branch.clusterShowcase,
      },
    };
  }

  async join(user: User, clusterId: string, branchId?: string) {
    const branch = await this.branchFor(user, branchId);
    const cluster = await this.clusters.findOne({ where: { id: clusterId } });
    if (!cluster || cluster.type === ClusterType.DISTRICT) {
      throw new NotFoundException('Cluster not found');
    }
    // A cluster under review can only be joined by the business that proposed it.
    if (!cluster.isActive && cluster.proposedByBusinessId !== user.businessId) {
      throw new NotFoundException('Cluster not found');
    }
    if (branch.clusterId === clusterId) return this.mine(user, branch.id);
    await this.clustersService.addBranch(clusterId, branch.id);
    await this.branches.update(branch.id, { clusterJoinedAt: new Date() });
    return this.mine(user, branch.id);
  }

  async leave(user: User, branchId?: string) {
    const branch = await this.branchFor(user, branchId);
    if (!branch.clusterId)
      throw new NotFoundException('Your branch is not in a cluster');
    await this.clustersService.removeBranch(branch.clusterId, branch.id);
    await this.branches.update(branch.id, { clusterJoinedAt: null });
    return { success: true };
  }

  /**
   * Proposes a new cluster around the branch. It stays under review (inactive)
   * until an admin approves it; the proposing branch joins it straight away.
   * A covering active cluster already there → 409 with that cluster.
   */
  async propose(user: User, dto: ProposeClusterDto) {
    const branch = await this.branchFor(user, dto.branchId);
    const [duplicate] = await this.clusters.manager.query<
      { id: string; name: string }[]
    >(
      `SELECT c."id", c."name" FROM "clusters" c
       WHERE c."type" <> 'district' AND c."deletedAt" IS NULL
         AND (c."isActive" = true OR c."proposedByBusinessId" IS NOT NULL)
         AND c."latitude" IS NOT NULL AND c."longitude" IS NOT NULL
         AND (lower(c."name") = lower($3) OR ST_DWithin(
           ST_SetSRID(ST_MakePoint(c."longitude"::float8, c."latitude"::float8), 4326)::geography,
           ST_SetSRID(ST_MakePoint($2::float8, $1::float8), 4326)::geography,
           LEAST(c."radiusMeters", 150)))
       LIMIT 1`,
      [dto.latitude, dto.longitude, dto.name.trim()],
    );
    if (duplicate) {
      throw new ConflictException({
        message: `"${duplicate.name}" already covers this spot — join it instead`,
        clusterId: duplicate.id,
      });
    }
    const cluster = await this.clusters.save(
      this.clusters.create({
        name: dto.name.trim(),
        type: KIND_TYPE[dto.kind],
        kind: dto.kind,
        address: dto.address?.trim() || null,
        city: dto.city?.trim(),
        state: dto.state?.trim(),
        country: 'Nigeria',
        description: dto.description?.trim(),
        latitude: dto.latitude,
        longitude: dto.longitude,
        radiusMeters: dto.radiusMeters ?? 300,
        isActive: false,
        qrIsActive: false,
        proposedByBusinessId: user.businessId,
      }),
    );
    return this.join(user, cluster.id, branch.id);
  }

  // ------------------------------------------------------------- members

  async members(user: User, clusterId: string, query: ClusterMembersQueryDto) {
    await this.memberOf(user, clusterId, query.branchId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.branches
      .createQueryBuilder('b')
      .innerJoinAndSelect('b.business', 'business')
      .leftJoinAndSelect('business.category', 'category')
      .where('b.clusterId = :clusterId', { clusterId });
    if (query.q?.trim()) {
      qb.andWhere('(business.name ILIKE :q OR b.name ILIKE :q)', {
        q: `%${query.q.trim()}%`,
      });
    }
    const [rows, total] = await qb
      .orderBy('business.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    const deals = rows.length
      ? await this.clusters.manager.query<
          { branchId: string; count: number }[]
        >(
          `SELECT o."branchId", COUNT(*)::int AS "count" FROM "catalogue_offers" o
           WHERE o."branchId" = ANY($1) AND ${LIVE_OFFER_SQL} GROUP BY o."branchId"`,
          [rows.map((row) => row.id)],
        )
      : [];
    const dealCount = new Map(
      deals.map((row) => [row.branchId, Number(row.count)]),
    );
    return {
      data: rows.map((row) =>
        this.memberCard(row, user.businessId, dealCount.get(row.id) ?? 0),
      ),
      total,
      page,
      limit,
    };
  }

  private memberCard(branch: Branch, myBusinessId: string, dealsCount: number) {
    const business = branch.business;
    return {
      id: branch.id,
      branchId: branch.id,
      businessId: branch.businessId,
      clusterId: branch.clusterId,
      businessName: business?.name ?? branch.name,
      branchName: branch.name,
      category: business?.category?.name ?? null,
      unitOrSuite: branch.address ?? '',
      joinedAt: branch.clusterJoinedAt ?? branch.createdAt,
      status: branch.isActive ? 'active' : 'suspended',
      isVerified: Boolean(business?.isVerified),
      logoUrl: branch.logoUrl ?? business?.logoUrl ?? null,
      bannerUrl: business?.coverImage ?? null,
      phone: branch.phone ?? business?.phone ?? '',
      email: business?.officialEmail ?? '',
      bio: business?.description ?? '',
      dealsCount,
      isSelf: branch.businessId === myBusinessId,
    };
  }

  async member(
    user: User,
    clusterId: string,
    memberBranchId: string,
    branchId?: string,
  ) {
    await this.memberOf(user, clusterId, branchId);
    const branch = await this.branches.findOne({
      where: { id: memberBranchId, clusterId },
      relations: ['business', 'business.category'],
    });
    if (!branch)
      throw new NotFoundException('Member not found in this cluster');
    const offers = await this.clusters.manager.query<
      { id: string; name: string; price: string | null }[]
    >(
      `SELECT o."id", o."name", COALESCE(o."calculatedPrice", o."fixedPrice") AS "price" FROM "catalogue_offers" o
       WHERE o."branchId" = $1 AND ${LIVE_OFFER_SQL}
       ORDER BY o."createdAt" DESC LIMIT 3`,
      [branch.id],
    );
    return {
      ...this.memberCard(branch, user.businessId, offers.length),
      hours: branch.businessHours ?? branch.business?.openingHours ?? null,
      topOffers: offers.map((offer) => ({
        id: offer.id,
        title: offer.name,
        price: Number(offer.price ?? 0),
      })),
    };
  }

  // ------------------------------------------------------------ showcase

  /**
   * The branch's live deals and the business's active products and services,
   * each with whether it shows in the cluster. Three bounded queries.
   */
  async showcase(user: User, branchId?: string) {
    const branch = await this.branchFor(user, branchId);
    const [deals, items, choices] = await Promise.all([
      this.clusters.manager.query<
        {
          id: string;
          name: string;
          mainImage: string | null;
          price: string | null;
        }[]
      >(
        `SELECT o."id", o."name", o."mainImage", COALESCE(o."calculatedPrice", o."fixedPrice") AS "price" FROM "catalogue_offers" o
         WHERE o."branchId" = $1 AND ${LIVE_OFFER_SQL} ORDER BY o."createdAt" DESC LIMIT 200`,
        [branch.id],
      ),
      this.clusters.manager.query<
        {
          id: string;
          name: string;
          itemType: string;
          mainImage: string | null;
          price: string | null;
        }[]
      >(
        `SELECT i."id", i."name", i."itemType", i."mainImage", i."price" FROM "catalogue_items" i
         WHERE i."businessId" = $1 AND i."deletedAt" IS NULL AND i."status" IN ('active', 'low_stock')
         ORDER BY i."createdAt" DESC LIMIT 200`,
        [branch.businessId],
      ),
      this.showcaseItems.find({ where: { branchId: branch.id } }),
    ]);
    const choice = new Map(
      choices.map((row) => [`${row.entityType}:${row.entityId}`, row.show]),
    );
    const entry = (
      type: ShowcaseEntityType,
      id: string,
      defaultShow: boolean,
    ) => choice.get(`${type}:${id}`) ?? defaultShow;
    return {
      branchId: branch.id,
      inCluster: Boolean(branch.clusterId),
      preference: branch.clusterShowcase,
      items: [
        ...deals.map((deal) => ({
          id: deal.id,
          entityType: 'deal' as const,
          title: deal.name,
          price: Number(deal.price ?? 0),
          image: deal.mainImage ?? '',
          showInCluster: entry('deal', deal.id, true),
        })),
        ...items.map((item) => {
          const type: ShowcaseEntityType =
            item.itemType === 'service' ? 'service' : 'product';
          return {
            id: item.id,
            entityType: type,
            title: item.name,
            price: Number(item.price ?? 0),
            image: item.mainImage ?? '',
            showInCluster: entry(type, item.id, false),
          };
        }),
      ],
    };
  }

  /** Bulk show/hide (also what the import modal sends); ids must be the business's own. */
  async updateShowcase(user: User, dto: UpdateShowcaseDto) {
    const branch = await this.branchFor(user, dto.branchId);
    const dealIds = dto.items
      .filter((item) => item.type === 'deal')
      .map((item) => item.id);
    const itemIds = dto.items
      .filter((item) => item.type !== 'deal')
      .map((item) => item.id);
    const [ownDeals, ownItems] = await Promise.all([
      dealIds.length
        ? this.clusters.manager.query<{ id: string }[]>(
            `SELECT "id" FROM "catalogue_offers" WHERE "id" = ANY($1) AND "branchId" = $2`,
            [dealIds, branch.id],
          )
        : [],
      itemIds.length
        ? this.clusters.manager.query<{ id: string }[]>(
            `SELECT "id" FROM "catalogue_items" WHERE "id" = ANY($1) AND "businessId" = $2`,
            [itemIds, branch.businessId],
          )
        : [],
    ]);
    const owned = new Set([...ownDeals, ...ownItems].map((row) => row.id));
    const rows = dto.items
      .filter((item) => owned.has(item.id))
      .map((item) => ({
        branchId: branch.id,
        entityType: item.type,
        entityId: item.id,
        show: item.show,
      }));
    if (rows.length) {
      await this.showcaseItems.upsert(rows, [
        'branchId',
        'entityType',
        'entityId',
      ]);
      await this.clustersService.invalidateForBranch(branch.id);
    }
    return { updated: rows.length, ignored: dto.items.length - rows.length };
  }

  async setPreference(user: User, dto: ShowcasePreferenceDto) {
    const branch = await this.branchFor(user, dto.branchId);
    await this.branches.update(branch.id, { clusterShowcase: dto.showcase });
    return { branchId: branch.id, showcase: dto.showcase };
  }

  // ---------------------------------------------------------------- chat

  private async chatPair(
    user: User,
    clusterId: string,
    otherBranchId: string,
    branchId?: string,
  ) {
    const me = await this.memberOf(user, clusterId, branchId);
    if (otherBranchId === me.id) {
      throw new BadRequestException('Pick another member to message');
    }
    const other = await this.branches.findOne({
      where: { id: otherBranchId, clusterId },
      select: ['id'],
    });
    if (!other) throw new NotFoundException('Member not found in this cluster');
    return { me, other };
  }

  /** The conversation with one member, newest first; marks their messages read. */
  async chat(
    user: User,
    clusterId: string,
    otherBranchId: string,
    query: ClusterChatQueryDto,
  ) {
    const { me, other } = await this.chatPair(
      user,
      clusterId,
      otherBranchId,
      query.branchId,
    );
    const before = query.before
      ? { createdAt: LessThan(new Date(query.before)) }
      : {};
    const rows = await this.messages.find({
      where: [
        { clusterId, fromBranchId: me.id, toBranchId: other.id, ...before },
        { clusterId, fromBranchId: other.id, toBranchId: me.id, ...before },
      ],
      order: { createdAt: 'DESC' },
      take: query.limit ?? 50,
    });
    const unread = rows
      .filter((row) => row.toBranchId === me.id && !row.readAt)
      .map((row) => row.id);
    if (unread.length)
      await this.messages.update({ id: In(unread) }, { readAt: new Date() });
    return {
      data: rows.map((row) => ({
        id: row.id,
        senderBranchId: row.fromBranchId,
        recipientBranchId: row.toBranchId,
        text: row.body,
        timestamp: row.createdAt,
        readAt: row.readAt,
        isSelf: row.fromBranchId === me.id,
      })),
      hasMore: rows.length === (query.limit ?? 50),
    };
  }

  async send(
    user: User,
    clusterId: string,
    otherBranchId: string,
    dto: SendClusterMessageDto,
  ) {
    const { me, other } = await this.chatPair(
      user,
      clusterId,
      otherBranchId,
      dto.branchId,
    );
    const saved = await this.messages.save(
      this.messages.create({
        clusterId,
        fromBranchId: me.id,
        toBranchId: other.id,
        senderUserId: user.id,
        body: dto.body.trim(),
      }),
    );
    return {
      id: saved.id,
      senderBranchId: me.id,
      recipientBranchId: other.id,
      text: saved.body,
      timestamp: saved.createdAt,
      readAt: null,
      isSelf: true,
    };
  }
}
