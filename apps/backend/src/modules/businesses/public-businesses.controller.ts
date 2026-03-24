import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { BranchesService } from '../branches/branches.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';

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
    return this.businessesService.findByCode(code);
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
    return this.branchesService.findByCode(code);
  }
}
