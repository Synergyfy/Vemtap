import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { BranchesService } from '../branches/branches.service';
import { NearbyBranchesQueryDto } from '../branches/dto/nearby-branches-query.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';

/**
 * Fields a public (unauthenticated) storefront may see. Everything else on the
 * business / branch records — owner account, balance, documents, POS and
 * privacy settings, manager contacts, internal flags — stays private.
 */
const PUBLIC_BUSINESS_FIELDS = [
  'id',
  'uniqueCode',
  'name',
  'status',
  'category',
  'categoryId',
  'subcategory',
  'subcategoryId',
  'otherSubcategoryName',
  'goal',
  'officialEmail',
  'phone',
  'logoUrl',
  'coverImage',
  'gallery',
  'address',
  'website',
  'description',
  'socials',
  'amenities',
  'openingHours',
  'timezone',
  'isVisible',
  'state',
  'city',
  'latitude',
  'longitude',
  'whatsappNumber',
  'isVerified',
  'verifiedAt',
  'verificationStatus',
  'rewards',
  'totalBranches',
] as const;

const PUBLIC_BRANCH_FIELDS = [
  'id',
  'uniqueCode',
  'username',
  'name',
  'address',
  'state',
  'city',
  'latitude',
  'longitude',
  'location',
  'phone',
  'isActive',
  'isMainBranch',
  'logoUrl',
  'website',
  'whatsappNumber',
  'officialEmail',
  'district',
  'mainQrShortUrl',
  'clusterId',
  'clusterShowcase',
  'formAppearanceColor',
  'welcomeTag',
  'welcomeTitle',
  'welcomeMessage',
  'successTitle',
  'successDescription',
  'successMessage',
  'privacyMessage',
  'rewardMessage',
  'about',
  'businessHours',
  'rewardEnabled',
  'rewardVisitThreshold',
  'linkedinUrl',
  'reviewUrl',
  'showReview',
  'showSocial',
  'showFeedback',
  'businessId',
] as const;

function pick<T extends object>(source: T | null | undefined, fields: readonly string[]) {
  if (!source) return source;
  const record = source as Record<string, unknown>;
  return Object.fromEntries(fields.filter((field) => field in record).map((field) => [field, record[field]]));
}

const publicBranch = (branch: unknown) => pick(branch as object, PUBLIC_BRANCH_FIELDS);

const publicBusiness = (business: unknown) => {
  const record = business as Record<string, unknown> | null | undefined;
  if (!record) return record;
  const safe = pick(record, PUBLIC_BUSINESS_FIELDS) as Record<string, unknown>;
  if (Array.isArray(record.branches)) safe.branches = record.branches.map(publicBranch);
  return safe;
};

@ApiTags('Public Businesses')
@Controller('public')
export class PublicBusinessesController {
  constructor(
    private readonly businessesService: BusinessesService,
    private readonly branchesService: BranchesService,
  ) {}

  @Public()
  @Get('businesses/code/:code')
  @ApiOperation({ summary: 'Get business details by unique 9-digit code' })
  @ApiResponse({
    status: 200,
    description: 'Business details with branches',
    schema: {
      example: {
        id: 'uuid-business-1234',
        uniqueCode: 'BIZ123XYZ',
        name: 'The Azure Bistro',
        officialEmail: 'hello@azurebistro.com',
        phone: '+2348012345678',
        logoUrl: 'https://example.com/logo.png',
        address: '42 Admiralty Way, Lekki',
        state: 'Lagos',
        city: 'Ikeja',
        status: 'active',
        category: { id: 'uuid-cat', name: 'Restaurant' },
        subcategory: { id: 'uuid-sub', name: 'Fine Dining' },
        branches: [
          {
            id: 'uuid-branch-1',
            uniqueCode: 'BR123ABC',
            name: 'Main Branch',
            isActive: true,
            isMainBranch: true,
          },
        ],
      },
    },
  })
  async getBusinessByCode(@Param('code') code: string) {
    return publicBusiness(await this.businessesService.findByCode(code));
  }

  @Public()
  @Get('branches/code/:code')
  @ApiOperation({ summary: 'Get branch details by unique 9-digit code' })
  @ApiResponse({
    status: 200,
    description: 'Branch details',
    schema: {
      example: {
        id: 'uuid-branch-1',
        uniqueCode: 'BR123ABC',
        name: 'Main Branch',
        address: '42 Admiralty Way, Lekki',
        phone: '+2348012345678',
        isActive: true,
        isMainBranch: true,
        businessId: 'uuid-business-1234',
        business: {
          id: 'uuid-business-1234',
          uniqueCode: 'BIZ123XYZ',
          name: 'The Azure Bistro',
          logoUrl: 'https://example.com/logo.png',
        },
      },
    },
  })
  async getBranchByCode(@Param('code') code: string) {
    const branch = (await this.branchesService.findByCode(code)) as unknown as Record<string, unknown>;
    const safe = publicBranch(branch) as Record<string, unknown>;
    if (branch?.business) safe.business = publicBusiness(branch.business);
    return safe;
  }

  @Public()
  @Get('branches/nearby')
  @ApiOperation({
    summary: 'Find nearby branches within a radius of a given branch',
  })
  @ApiQuery({
    name: 'branchId',
    required: true,
    description: 'UUID of the source branch',
  })
  @ApiQuery({
    name: 'distance',
    required: false,
    description: 'Search radius in meters (default 500)',
  })
  @ApiQuery({
    name: 'withPromotions',
    required: false,
    description: 'Only include branches with active promotions (default false)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Max results (default 20)',
  })
  async findNearbyBranches(
    @Query('branchId', ParseUUIDPipe) branchId: string,
    @Query() query: NearbyBranchesQueryDto,
  ) {
    return this.branchesService.findNearbyBranches(branchId, query);
  }
}
