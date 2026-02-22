import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  UseGuards,
  Request,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { UserRole } from './entities/user.entity';
import { BusinessesService } from '../businesses/businesses.service';
import { BranchesService } from '../branches/branches.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { InviteStaffDto } from './dto/invite-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import * as bcrypt from 'bcrypt';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly businessesService: BusinessesService,
    private readonly branchesService: BranchesService,
  ) { }

  @Get('staff')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Permissions('staff')
  @ApiOperation({
    summary: 'Get all staff members for the business (including managers)',
  })
  async getStaff(@Request() req, @Query('branchId') branchId?: string) {
    return this.usersService.findByBusiness(req.user.businessId, branchId);
  }

  @Post('staff/invite')
  @Roles(UserRole.OWNER)
  @ApiOperation({
    summary: 'Invite a new staff member or manager',
    description:
      'Use the `role` field in the body to specify "Staff" or "Manager".',
  })
  @ApiBody({ type: InviteStaffDto })
  async inviteStaff(@Request() req, @Body() inviteDto: InviteStaffDto) {
    if (
      inviteDto.role &&
      ![UserRole.STAFF, UserRole.MANAGER].includes(inviteDto.role as UserRole)
    ) {
      throw new BadRequestException(
        'Only Staff and Manager roles can be assigned via invitation',
      );
    }

    const existing = await this.usersService.findByEmail(inviteDto.email);
    if (existing) {
      throw new BadRequestException('User with this email already exists');
    }

    // Verify the business is owned by the current user (owner)
    const business = await this.businessesService.findById(inviteDto.businessId);
    if (!business || business.ownerId !== req.user.id) {
      throw new BadRequestException('Business not found or not owned by you');
    }

    // Verify the branch belongs to the business
    const branch = await this.branchesService.findOne(req.user.id, inviteDto.branchId);
    if (!branch) {
      throw new BadRequestException('Branch not found or does not belong to your business');
    }

    // In a real app, we'd send an invite email. For this MVP, we create them with a default password.
    const hashedPassword = await bcrypt.hash('staff123', 10);
    return this.usersService.create({
      ...inviteDto,
      businessId: inviteDto.businessId,
      branchId: inviteDto.branchId,
      password: hashedPassword,
    });
  }

  @Patch('staff/:id')
  @Roles(UserRole.OWNER)
  @ApiOperation({
    summary: 'Update a staff member (role, permissions, etc.)',
    description: 'Can be used to promote a staff member to manager.',
  })
  @ApiBody({ type: UpdateStaffDto })
  async updateStaff(
    @Request() req,
    @Param('id') id: string,
    @Body() updates: UpdateStaffDto,
  ) {
    return this.usersService.updateStaff(id, req.user.businessId, updates);
  }

  @Delete('staff/:id')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Remove a staff member' })
  async removeStaff(@Request() req, @Param('id') id: string) {
    return this.usersService.remove(id, req.user.businessId);
  }

  // --- Admin Endpoints ---

  @Get('admin')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get all users with filters and stats' })
  async findAllAdmin(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.usersService.findAllAdmin({ search, role, status, page, limit });
  }

  @Post('admin')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Create a new user manually' })
  async adminCreateUser(@Body() createUserDto: any) {
    return this.usersService.adminCreateUser(createUserDto);
  }

  @Patch('admin/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Update user details' })
  async adminUpdateUser(
    @Param('id') id: string,
    @Body() updateUserDto: any,
  ) {
    return this.usersService.adminUpdateUser(id, updateUserDto);
  }

  @Delete('admin/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Disable user account (Sets status to Suspended)' })
  async adminDeleteUser(@Param('id') id: string) {
    return this.usersService.adminDeleteUser(id);
  }

  @Post('admin/reset-password-link/:email')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Send password reset link to user email' })
  async adminResetPasswordLink(@Param('email') email: string) {
    return this.usersService.adminResetPasswordLink(email);
  }
}
