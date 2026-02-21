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
} from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { UpdateBusinessDto } from './dto/update-business.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('businesses')
@ApiBearerAuth()
@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) { }

  @Get('my-business')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get details of the business for current user' })
  async getMyBusiness(@Request() req) {
    return this.businessesService.findById(req.user.businessId);
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
    return this.businessesService.findAllAdmin({ search, status: status as any, page, limit });
  }

  @Post('admin')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Manually create a business' })
  async adminCreate(@Body() createBusinessDto: any) {
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
  async suspendBusiness(@Param('id') id: string, @Body('reason') reason: string) {
    return this.businessesService.suspend(id, reason || 'Terms Violation');
  }

  @Patch('admin/:id/reactivate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Reactivate a suspended business' })
  async reactivateBusiness(@Param('id') id: string) {
    return this.businessesService.reactivate(id);
  }
}
