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
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateEngagementDto } from './dto/update-engagement.dto';
import { AdminCreateAgentDto } from './dto/admin-create-agent.dto';
import { FindUsersAdminDto } from './dto/find-users-admin.dto';
import { BranchFilterDto } from '../../common/dto/branch-filter.dto';
import { CapabilityGuard } from '../subscriptions/guards/capability.guard';
import { RequireCapability } from '../subscriptions/decorators/capability.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private getBranchId(req: any, queryBranchId?: string): string {
    const branchId = queryBranchId || req.user?.branchId;
    if (!branchId) {
      throw new BadRequestException(
        'User must be associated with a branch or provide branchId',
      );
    }
    return branchId;
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, type: User })
  async getProfile(@Request() req) {
    return this.usersService.findOne(req.user.id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, type: User })
  async updateProfile(@Request() req, @Body() updates: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, updates);
  }

  @Patch('engagement')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({
    summary: 'Update customer engagement links (Instagram, etc.)',
  })
  @ApiResponse({ status: 200, type: User })
  async updateEngagement(@Request() req, @Body() updates: UpdateEngagementDto) {
    return this.usersService.updateEngagement(req.user.id, updates.engagement);
  }

  // --- Team Management ---

  @Post('team/invite')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @UseGuards(CapabilityGuard)
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
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all team members for the branch' })
  @ApiResponse({ status: 200, type: [User] })
  async getTeam(@Request() req, @Query() filter: BranchFilterDto) {
    const branchId = this.getBranchId(req, filter.branchId);
    return this.usersService.findByBranch(branchId);
  }

  @Patch('team/:id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a team member' })
  @ApiResponse({ status: 200, type: User })
  async updateStaff(
    @Request() req,
    @Param('id') id: string,
    @Body() updates: UpdateStaffDto,
    @Query() filter: BranchFilterDto,
  ) {
    const branchId = this.getBranchId(req, filter.branchId);
    return this.usersService.updateStaff(id, branchId, updates);
  }

  @Delete('team/:id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Remove a team member' })
  @ApiResponse({ status: 200 })
  async remove(
    @Request() req,
    @Param('id') id: string,
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
  async adminCreateAgent(@Body() dto: AdminCreateAgentDto) {
    return this.usersService.adminCreateAgent(dto);
  }

  @Post('admin')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Create a new user' })
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
  @ApiOperation({ summary: 'Admin: Delete user' })
  async adminDeleteUser(@Param('id') id: string) {
    return this.usersService.adminDeleteUser(id);
  }

  @Post('admin/:id/suspend')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Suspend user account' })
  async suspendUser(@Param('id') id: string) {
    return this.usersService.suspendUser(id);
  }

  @Post('admin/:id/activate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Reactivate user account' })
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
