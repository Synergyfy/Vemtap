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
import { UserRole, UserStatus } from './entities/user.entity';
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
import { GetStaffDto } from './dto/get-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateEngagementDto } from './dto/update-engagement.dto';
import { AdminCreateAgentDto } from './dto/admin-create-agent.dto';
import * as bcrypt from 'bcrypt';
import { SkipSubscriptionCheck } from '../subscriptions/decorators/skip-subscription-check.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly businessesService: BusinessesService,
    private readonly branchesService: BranchesService,
  ) {}

  @Get('me')
  @SkipSubscriptionCheck()
  @Roles(
    UserRole.CUSTOMER,
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.STAFF,
    UserRole.ADMIN,
  )
  @ApiOperation({ summary: 'Get current logged-in user profile' })
  async getMe(@Request() req) {
    const user = await this.usersService.findOne(req.user.id);
    if (!user) throw new BadRequestException('User not found');
    const { password, ...rest } = user;
    return rest;
  }

  @Patch('me')
  @SkipSubscriptionCheck()
  @Roles(
    UserRole.CUSTOMER,
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.STAFF,
    UserRole.ADMIN,
  )
  @ApiOperation({ summary: 'Update current logged-in user profile' })
  async updateMe(@Request() req, @Body() body: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, body);
  }

  @Patch('me/engagement')
  @Roles(UserRole.OWNER)
  @ApiOperation({
    summary: 'Update My social media engagement links (Owner Only)',
  })
  @ApiResponse({ status: 200, description: 'Engagement details updated' })
  async updateMyEngagement(@Request() req, @Body() body: UpdateEngagementDto) {
    return this.usersService.updateEngagement(req.user.id, body.engagement);
  }

  @Delete('me')
  @SkipSubscriptionCheck()
  @Roles(
    UserRole.CUSTOMER,
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.STAFF,
    UserRole.ADMIN,
  )
  @ApiOperation({ summary: 'Deactivate current user account' })
  async deleteMe(@Request() req) {
    // We treat deletion as suspension
    return this.usersService.adminDeleteUser(req.user.id);
  }

  @Get('staff')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Permissions('staff')
  @ApiOperation({
    summary: 'Get all staff members for the business (including managers)',
  })
  async getStaff(@Request() req, @Query() queryDto: GetStaffDto) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let targetBranchId: string | undefined = queryDto.branchId;

    if (queryDto.branchId && !uuidRegex.test(queryDto.branchId)) {
      // If frontend passes mock ID like "head-office", ignore it so we don't crash Postgres
      targetBranchId = undefined;
    }

    // Determine business ID based on the logged-in user
    let businessId = req.user.businessId;
    if (req.user.role === UserRole.OWNER && !businessId) {
      const ownedBusiness = await this.businessesService.findByOwner(
        req.user.id,
      );
      if (ownedBusiness) {
        businessId = ownedBusiness.id;
      }
    }

    if (!businessId) {
      throw new BadRequestException('Business context not found for the user');
    }

    return this.usersService.findByBusiness(businessId, targetBranchId);
  }

  @Get('staff/my-permissions')
  @Roles(UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary: 'Get permissions for the currently logged-in staff or manager',
  })
  @ApiResponse({
    status: 200,
    description: 'List of permissions',
    schema: {
      type: 'object',
      example: {
        permissions: ['dashboard', 'visitors'],
      },
    },
  })
  async getMyPermissions(@Request() req) {
    const user = await this.usersService.findOne(req.user.id);
    if (!user) throw new BadRequestException('User not found');
    return { permissions: user.permissions || [] };
  }

  @Post('staff/invite')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Permissions('staff')
  @ApiOperation({
    summary: 'Invite a new staff member or manager',
    description:
      'Use the `role` field in the body to specify "Staff" or "Manager". Requires "staff" permission.',
  })
  @ApiBody({ type: InviteStaffDto })
  @ApiResponse({
    status: 201,
    description: 'Staff invited successfully',
    schema: {
      type: 'object',
      example: {
        id: 'user-uuid',
        firstName: 'John',
        lastName: 'Doe',
        email: 'staff@example.com',
        role: 'Staff',
        permissions: ['dashboard', 'visitors'],
        businessId: 'business-uuid',
        branchId: 'branch-uuid',
        createdAt: '2023-10-10T12:00:00Z',
      },
    },
  })
  async inviteStaff(@Request() req, @Body() inviteDto: InviteStaffDto) {
    if (
      inviteDto.role &&
      ![UserRole.STAFF, UserRole.MANAGER].includes(inviteDto.role)
    ) {
      throw new BadRequestException(
        'Only Staff and Manager roles can be assigned via invitation',
      );
    }

    const existing = await this.usersService.findByEmail(inviteDto.email);
    if (existing) {
      throw new BadRequestException('User with this email already exists');
    }

    // Determine business ID based on the logged-in user
    let businessId = req.user.businessId;
    if (req.user.role === UserRole.OWNER && !businessId) {
      const ownedBusiness = await this.businessesService.findByOwner(
        req.user.id,
      );
      if (ownedBusiness) {
        businessId = ownedBusiness.id;
      }
    }

    if (!businessId) {
      throw new BadRequestException('Business context not found for the user');
    }

    // Verify the branch belongs to the user's business if provided
    const targetBranchId = inviteDto.branchId;
    if (targetBranchId) {
      const branch = await this.branchesService.findById(targetBranchId);
      if (!branch || branch.businessId !== businessId) {
        throw new BadRequestException(
          'Branch not found or does not belong to your business',
        );
      }
    }

    // In a real app, we'd send an invite email. For this MVP, we create them with a default password.
    const hashedPassword = await bcrypt.hash('staff123', 10);
    return this.usersService.create({
      ...inviteDto,
      businessId,
      branchId: targetBranchId,
      password: hashedPassword,
      status: UserStatus.INVITED,
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
    return this.usersService.findAllAdmin({
      search,
      role,
      status,
      page,
      limit,
    });
  }

  @Post('admin/create-agent')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Create a new agent account' })
  @ApiResponse({ status: 201, description: 'Agent created successfully' })
  async adminCreateAgent(@Body() dto: AdminCreateAgentDto) {
    return this.usersService.adminCreateAgent(dto);
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
  async adminUpdateUser(@Param('id') id: string, @Body() updateUserDto: any) {
    return this.usersService.adminUpdateUser(id, updateUserDto);
  }

  @Delete('admin/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Admin: Delete user account (Permanently removes user)',
    description:
      'Completely deletes the user record from the system. Use with caution.',
  })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async adminDeleteUser(@Param('id') id: string) {
    return this.usersService.adminDeleteUser(id);
  }

  @Patch('admin/:id/suspend')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Admin: Suspend a user account',
    description:
      'Sets the user status to Suspended. Suspended users can login but cannot perform any other actions.',
  })
  @ApiResponse({
    status: 200,
    description: 'User suspended successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'user-uuid' },
        status: { type: 'string', example: 'Suspended' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async suspendUser(@Param('id') id: string) {
    return this.usersService.suspendUser(id);
  }

  @Patch('admin/:id/activate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Admin: Activate a suspended user account',
    description:
      'Sets the user status back to Active, restoring their access to the system.',
  })
  @ApiResponse({
    status: 200,
    description: 'User activated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'user-uuid' },
        status: { type: 'string', example: 'Active' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async activateUser(@Param('id') id: string) {
    return this.usersService.activateUser(id);
  }

  @Post('admin/reset-password-link/:email')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Send password reset link to user email' })
  async adminResetPasswordLink(@Param('email') email: string) {
    return this.usersService.adminResetPasswordLink(email);
  }
}
