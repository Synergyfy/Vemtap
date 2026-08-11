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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { User, UserRole } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { InviteStaffDto } from './dto/invite-staff.dto';
import { UpdateUserProfileDto } from './dto/update-profile.dto';
import { UserAdminCreateAgentDto } from './dto/admin-create-agent.dto';
import { FindUsersAdminDto } from './dto/find-users-admin.dto';
import { BranchFilterDto } from '../../common/dto/branch-filter.dto';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequireCapability } from '../subscriptions/decorators/capability.decorator';
import {
  AdminCreateUserDto,
  AdminUpdateUserDto,
} from './dto/admin-user-management.dto';
import { Public } from '../../common/decorators/public.decorator';
import { ParseUUIDPipe, Inject, forwardRef } from '@nestjs/common';
import { QrThriveService } from '../qr-thrive/qr-thrive.service';
import { BusinessesService } from '../businesses/businesses.service';
import { RenameSessionDto } from './dto/rename-session.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly businessesService: BusinessesService,
    @Inject(forwardRef(() => QrThriveService))
    private readonly qrThriveService: QrThriveService,
  ) {}

  private getBranchId(req: any, queryBranchId?: string): string {
    const branchId = queryBranchId || req.user?.branchId;
    if (!branchId) {
      throw new BadRequestException(
        'User must be associated with a branch or provide branchId',
      );
    }
    return branchId;
  }

  private async getTargetUserId(req: any): Promise<string> {
    const actorId = req.user.id;
    // If impersonating, target the business owner
    if (req.isImpersonated && req.user.businessId) {
      const business = await this.businessesService.findById(
        req.user.businessId,
      );
      if (business && business.ownerId) {
        return business.ownerId;
      }
    }
    return actorId;
  }

  @Public()
  @Get('public/check-phone')
  @ApiOperation({ summary: 'Check if phone number exists (Public)' })
  @ApiQuery({ name: 'phone', required: true, type: String })
  async existsByPhone(@Query('phone') phone: string) {
    if (!phone) {
      throw new BadRequestException('Phone number query param is required');
    }
    return this.usersService.existsByPhone(phone);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, type: User })
  async getProfile(@Request() req) {
    const targetUserId = await this.getTargetUserId(req);
    return this.usersService.findOne(targetUserId);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, type: User })
  async updateProfile(@Request() req, @Body() updates: UpdateUserProfileDto) {
    const targetUserId = await this.getTargetUserId(req);
    return this.usersService.updateProfile(targetUserId, updates);
  }

  @Get('linked-devices')
  @Roles(
    UserRole.ADMIN,
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.STAFF,
    UserRole.AGENT,
    UserRole.CUSTOMER,
  )
  @ApiOperation({ summary: 'List linked login devices for the current user' })
  async getLinkedDevices(@Request() req) {
    return this.usersService.listSessions(req.user.id);
  }

  @Patch('linked-devices/:id')
  @Roles(
    UserRole.ADMIN,
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.STAFF,
    UserRole.AGENT,
    UserRole.CUSTOMER,
  )
  @ApiOperation({ summary: 'Rename a linked login device' })
  async renameLinkedDevice(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RenameSessionDto,
  ) {
    return this.usersService.renameSession(req.user.id, id, dto.deviceName);
  }

  @Delete('linked-devices/:id')
  @Roles(
    UserRole.ADMIN,
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.STAFF,
    UserRole.AGENT,
    UserRole.CUSTOMER,
  )
  @ApiOperation({ summary: 'Revoke a linked login device' })
  async revokeLinkedDevice(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.revokeSession(req.user.id, id);
  }

  // --- QR-Thrive Integration ---

  @Get('me/qr-thrive')
  @ApiOperation({ summary: 'Check if current user is mapped to QR-Thrive' })
  @ApiResponse({
    status: 200,
    description: 'Returns the QR-Thrive user ID if mapped',
  })
  async getQrThriveMapping(@Request() req) {
    const targetUserId = await this.getTargetUserId(req);
    const targetUser = await this.usersService.findOne(targetUserId);

    if (
      !targetUser ||
      targetUser.role === UserRole.CUSTOMER ||
      targetUser.role === UserRole.ADMIN
    ) {
      return { qrThriveUserId: null };
    }
    const mapping = await this.qrThriveService.getMappingByUserId(targetUserId);
    return { qrThriveUserId: mapping?.qrThriveUserId || null };
  }

  @Post('me/qr-thrive/provision')
  @ApiOperation({ summary: 'Provision current user in QR-Thrive' })
  @ApiResponse({
    status: 201,
    description: 'Returns the newly created QR-Thrive user ID',
  })
  async provisionQrThrive(@Request() req) {
    const targetUserId = await this.getTargetUserId(req);
    const targetUser = await this.usersService.findOne(targetUserId);

    if (
      !targetUser ||
      targetUser.role === UserRole.CUSTOMER ||
      targetUser.role === UserRole.ADMIN
    ) {
      return { qrThriveUserId: null };
    }
    const mapping = await this.qrThriveService.syncUser(targetUser);
    return { qrThriveUserId: mapping?.qrThriveUserId || null };
  }

  // --- Team Management ---

  @Post('team/invite')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @Permissions('staff')
  @RequireCapability('teamMembers')
  @ApiOperation({ summary: 'Invite a new team member' })
  @ApiResponse({ status: 201, type: User })
  async inviteStaff(
    @Request() req,
    @Body() dto: InviteStaffDto,
    @Query() filter: BranchFilterDto,
  ) {
    const branchId = this.getBranchId(req, dto.branchId || filter.branchId);
    return this.usersService.inviteStaff(branchId, dto);
  }

  @Get('team')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @Permissions('staff')
  @ApiOperation({ summary: 'Get all team members for the branch' })
  @ApiResponse({ status: 200, type: [User] })
  async getTeam(@Request() req, @Query() filter: BranchFilterDto) {
    const businessId = req.user.businessId;

    if (
      filter.allBranches &&
      (req.user.role === UserRole.OWNER || req.user.role === UserRole.ADMIN)
    ) {
      return this.usersService.findTeamMembers({ businessId });
    }

    const branchId = this.getBranchId(req, filter.branchId);
    return this.usersService.findTeamMembers({ branchId, businessId });
  }

  @Patch('team/:id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @Permissions('staff')
  @ApiOperation({ summary: 'Update a team member' })
  @ApiResponse({ status: 200, type: User })
  async updateStaff(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updates: UpdateStaffDto,
    @Query() filter: BranchFilterDto,
  ) {
    const branchId = this.getBranchId(req, filter.branchId);
    return this.usersService.updateStaff(id, branchId, updates);
  }

  @Delete('team/:id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @Permissions('staff')
  @ApiOperation({ summary: 'Remove a team member' })
  @ApiResponse({ status: 200 })
  async remove(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() filter: BranchFilterDto,
  ) {
    const branchId = this.getBranchId(req, filter.branchId);
    return this.usersService.remove(id, branchId);
  }

  // --- Admin Endpoints ---

  @Get('admin')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get all users with filters and stats' })
  async findAllAdmin(@Query() query: FindUsersAdminDto) {
    return this.usersService.findAllAdmin(query);
  }

  @Post('admin/create-agent')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Create a new agent account' })
  @ApiResponse({ status: 201, description: 'Agent created successfully' })
  async adminCreateAgent(@Body() dto: UserAdminCreateAgentDto) {
    return this.usersService.adminCreateAgent(dto);
  }
  @Post('admin')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Create a new user' })
  async adminCreateUser(@Body() createUserDto: AdminCreateUserDto) {
    return this.usersService.adminCreateUser(createUserDto);
  }

  @Patch('admin/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Update user details' })
  async adminUpdateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: AdminUpdateUserDto,
  ) {
    return this.usersService.adminUpdateUser(id, updateUserDto);
  }

  @Delete('admin/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Delete user' })
  async adminDeleteUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.adminDeleteUser(id);
  }

  @Post('admin/:id/suspend')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Suspend user account' })
  async suspendUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.suspendUser(id);
  }

  @Post('admin/:id/activate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Reactivate user account' })
  async activateUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.activateUser(id);
  }

  @Post('admin/reset-password-link/:email')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Send password reset link to user email' })
  async adminResetPasswordLink(@Param('email') email: string) {
    // Basic email validation if needed, but the service handles it.
    // Usually better to have @IsEmail in a DTO but as a param we could use a custom validator or just let it pass to service.
    return this.usersService.adminResetPasswordLink(email);
  }
}
