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
import { UserRole } from './entities/user.entity';
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
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('staff')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get all staff members for the business (including managers)',
  })
  async getStaff(@Request() req) {
    return this.usersService.findByBusiness(req.user.businessId);
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
    const existing = await this.usersService.findByEmail(inviteDto.email);
    if (existing) {
      throw new BadRequestException('User with this email already exists');
    }

    // In a real app, we'd send an invite email. For this MVP, we create them with a default password.
    const hashedPassword = await bcrypt.hash('staff123', 10);
    return this.usersService.create({
      ...inviteDto,
      businessId: req.user.businessId,
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
