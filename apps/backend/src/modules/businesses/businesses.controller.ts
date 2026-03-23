import {
  Controller,
  Get,
  Patch,
  Body,
  Request,
  Param,
  Query,
  Post,
  Delete,
  BadRequestException,
} from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { UpdateBusinessDto } from './dto/update-business.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, User } from '../users/entities/user.entity';
import { AdminCreateBusinessDto } from './dto/admin-create-business.dto';
import { FindBusinessesAdminDto } from './dto/find-businesses-admin.dto';
import { SkipSubscriptionCheck } from '../subscriptions/decorators/skip-subscription-check.decorator';
import { ImportCustomersDto } from './dto/import-customers.dto';
import { ParseUUIDPipe } from '@nestjs/common';
import { SuspendBusinessDto } from './dto/admin-business-action.dto';

interface RequestWithUser extends Request {
  user: User;
}

@ApiTags('businesses')
@ApiBearerAuth()
@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Get('my-business')
  @SkipSubscriptionCheck()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get details of the business for current user' })
  @ApiOkResponse({
    description: 'Current business details',
    type: UpdateBusinessDto, // Business entity structure matches most of UpdateBusinessDto for swagger
  })
  async getMyBusiness(@Request() req: RequestWithUser) {
    return this.businessesService.findById(req.user.businessId);
  }

  @Patch('my-business')
  @Roles(UserRole.OWNER)
  @ApiOperation({
    summary:
      "Update current user's business details (About, Hours, Settings, etc.)",
    description:
      'Only accessible by business owners. Uses businessId from token.',
  })
  @ApiBody({ type: UpdateBusinessDto })
  @ApiOkResponse({
    description: 'Business updated successfully',
    type: UpdateBusinessDto,
  })
  async updateMyBusiness(
    @Request() req: RequestWithUser,
    @Body() updateBusinessDto: UpdateBusinessDto,
  ) {
    const businessId = req.user.businessId;
    if (!businessId) {
      throw new BadRequestException('User is not associated with a business');
    }
    return this.businessesService.update(businessId, updateBusinessDto);
  }

  @Post('import-customers')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Bulk import customers for the current business',
    description:
      'Import multiple customers at once. Default password "mypassword" will be assigned.',
  })
  @ApiBody({ type: ImportCustomersDto })
  @ApiResponse({
    status: 201,
    description: 'Import results with counts and errors',
    schema: {
      example: {
        imported: 10,
        skipped: 2,
        errors: ['Error importing user@ex.com: Duplicate'],
      },
    },
  })
  async importCustomers(
    @Request() req: RequestWithUser,
    @Body() importDto: ImportCustomersDto,
  ) {
    const businessId = req.user.businessId;
    if (!businessId) {
      throw new BadRequestException('User is not associated with a business');
    }
    return this.businessesService.importCustomers(businessId, importDto);
  }
  @Patch(':id')
  @Roles(UserRole.OWNER)
  @ApiOperation({
    summary: 'Update business settings (Welcome messages, Rewards, etc.)',
  })
  @ApiResponse({ status: 200, description: 'Business updated successfully' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBusinessDto: UpdateBusinessDto,
  ) {
    return this.businessesService.update(id, updateBusinessDto);
  }

  // --- Admin Endpoints ---

  @Get('admin')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get all businesses with filters and stats' })
  @ApiResponse({
    status: 200,
    description: 'Return list of businesses with pagination and stats.',
    schema: {
      example: {
        data: [
          {
            id: 'uuid-business-1',
            name: 'The Azure Bistro',
            status: 'active',
            isVerified: true,
            owner: { email: 'owner@example.com' },
            category: { id: 'uuid-cat-1', name: 'Restaurant' },
            subcategory: { id: 'uuid-subcat-1', name: 'Fine Dining' },
          },
        ],
        meta: { total: 1, page: 1, lastPage: 1 },
        stats: {
          total: 50,
          active: 40,
          pending: 5,
          suspended: 5,
          approvedToday: 2,
          avgWaitTime: '1.5',
        },
      },
    },
  })
  async findAllAdmin(@Query() query: FindBusinessesAdminDto) {
    return this.businessesService.findAllAdmin(query);
  }

  @Get('admin/suspended')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get all suspended businesses (newest to oldest)' })
  @ApiResponse({
    status: 200,
    description: 'Return list of suspended businesses.',
    schema: {
      example: {
        data: [
          {
            id: 'uuid-business-1',
            name: 'Suspended Shop',
            status: 'suspended',
            suspendedAt: '2026-03-21T10:00:00Z',
            suspensionReason: 'Policy violation',
          },
        ],
        meta: { total: 1, page: 1, lastPage: 1 },
      },
    },
  })
  async findSuspendedAdmin(@Query() query: FindBusinessesAdminDto) {
    return this.businessesService.findSuspendedAdmin(query);
  }

  @Get('admin/pending-verification')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get businesses pending verification with stats' })
  @ApiResponse({
    status: 200,
    description: 'Return list of businesses pending verification.',
    schema: {
      example: {
        data: [
          {
            id: 'uuid-business-1',
            name: 'New Shop',
            isVerified: false,
            createdAt: '2026-03-21T08:00:00Z',
          },
        ],
        meta: { total: 1, page: 1, lastPage: 1 },
        stats: {
          totalPending: 15,
          verifiedToday: 3,
          avgWaitTime: '2.4',
        },
      },
    },
  })
  async findPendingVerificationAdmin(@Query() query: FindBusinessesAdminDto) {
    return this.businessesService.findPendingVerificationAdmin(query);
  }

  @Post('admin')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Manually create a business' })
  @ApiBody({
    type: AdminCreateBusinessDto,
    description: 'Data for creating a new business as an admin',
  })
  @ApiResponse({
    status: 201,
    description: 'The business has been successfully created.',
    schema: {
      example: {
        id: 'b1de342f-0985-4a6c-94cc-1abcd56f8901',
        name: 'VemTap Head Office',
        type: 'RETAIL',
        status: 'active',
        ownerId: 'u89d342f-0985-4a6c-94cc-1abcd56f8901',
        address: '123 Main St, Lagos',
        createdAt: '2026-02-23T12:00:00.000Z',
        updatedAt: '2026-02-23T12:00:00.000Z',
      },
    },
  })
  async adminCreateBusinessUser(
    @Body() createBusinessDto: AdminCreateBusinessDto,
  ) {
    return this.businessesService.adminCreate(createBusinessDto);
  }

  @Delete('admin/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Delete a business permanently' })
  async adminDelete(@Param('id', ParseUUIDPipe) id: string) {
    return this.businessesService.adminDelete(id);
  }

  @Patch('admin/:id/approve')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Approve a pending business application' })
  async approveBusiness(@Param('id', ParseUUIDPipe) id: string) {
    return this.businessesService.approve(id);
  }

  @Patch('admin/:id/reject')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Reject a pending business application' })
  async rejectBusiness(@Param('id', ParseUUIDPipe) id: string) {
    return this.businessesService.reject(id);
  }

  @Patch('admin/:id/suspend')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Suspend a business' })
  async suspendBusiness(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SuspendBusinessDto,
  ) {
    return this.businessesService.suspend(id, dto.reason);
  }

  @Patch('admin/:id/reactivate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Reactivate a suspended business' })
  async reactivateBusiness(@Param('id', ParseUUIDPipe) id: string) {
    return this.businessesService.reactivate(id);
  }

  @Patch('admin/:id/verify')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Verify a business' })
  async verifyBusiness(@Param('id', ParseUUIDPipe) id: string) {
    return this.businessesService.verify(id);
  }

  @Patch('admin/:id/unverify')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Unverify a business' })
  async unverifyBusiness(@Param('id', ParseUUIDPipe) id: string) {
    return this.businessesService.unverify(id);
  }

  @Get('admin/:id/stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get stats about a business' })
  @ApiResponse({
    status: 200,
    description: 'Business stats returned successfully',
    schema: {
      example: {
        businessName: 'VemTap Head Office',
        totalVisitors: 150,
        totalTaps: 450,
        totalBranches: 5,
        recentActivity: [
          {
            id: 'v123',
            visitorName: 'John Doe',
            branchName: 'Lekki Branch',
            status: 'returning',
            timestamp: '2026-03-03T18:00:00Z',
          },
        ],
      },
    },
  })
  async getBusinessStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.businessesService.getBusinessStatsForAdmin(id);
  }
}
