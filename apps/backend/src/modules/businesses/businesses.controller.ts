import {
  Controller,
  Get,
  Patch,
  Body,
  Request,
  UseGuards,
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
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { AdminCreateBusinessDto } from './dto/admin-create-business.dto';
import { SkipSubscriptionCheck } from '../subscriptions/decorators/skip-subscription-check.decorator';
import { ImportCustomersDto } from './dto/import-customers.dto';

@ApiTags('businesses')
@ApiBearerAuth()
@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) { }

  @Get('my-business')
  @SkipSubscriptionCheck()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get details of the business for current user' })
  async getMyBusiness(@Request() req) {
    return this.businessesService.findById(req.user.businessId);
  }

  @Patch('my-business')
  @Roles(UserRole.OWNER)
  @ApiOperation({
    summary: 'Update current user\'s business details (About, Hours, Settings, etc.)',
  })
  @ApiResponse({ status: 200, description: 'Business updated successfully' })
  async updateMyBusiness(
    @Request() req,
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
  @ApiOperation({ summary: 'Bulk import customers for the current business' })
  @ApiResponse({ status: 201, description: 'Import results' })
  async importCustomers(@Request() req, @Body() importDto: ImportCustomersDto) {
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
    @Param('id') id: string,
    @Body() updateBusinessDto: UpdateBusinessDto,
  ) {
    return this.businessesService.update(id, updateBusinessDto);
  }

  // --- Admin Endpoints ---

  @Get('admin')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get all businesses with filters and stats' })
  async findAllAdmin(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.businessesService.findAllAdmin({
      search,
      status: status as any,
      page,
      limit,
    });
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
  async adminDelete(@Param('id') id: string) {
    return this.businessesService.adminDelete(id);
  }

  @Patch('admin/:id/approve')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Approve a pending business application' })
  async approveBusiness(@Param('id') id: string) {
    return this.businessesService.approve(id);
  }

  @Patch('admin/:id/reject')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Reject a pending business application' })
  async rejectBusiness(@Param('id') id: string) {
    return this.businessesService.reject(id);
  }

  @Patch('admin/:id/suspend')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Suspend a business' })
  async suspendBusiness(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.businessesService.suspend(id, reason || 'Terms Violation');
  }

  @Patch('admin/:id/reactivate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Reactivate a suspended business' })
  async reactivateBusiness(@Param('id') id: string) {
    return this.businessesService.reactivate(id);
  }
}
