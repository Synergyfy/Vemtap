import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CapabilityGuard } from '../subscriptions/guards/capability.guard';
import { RequireCapability } from '../subscriptions/decorators/capability.decorator';

@ApiTags('branches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @Roles(UserRole.OWNER)
  @UseGuards(CapabilityGuard)
  @RequireCapability('branches')
  @ApiOperation({ summary: 'Create a new branch for the business' })
  create(@Request() req, @Body() createBranchDto: CreateBranchDto) {
    return this.branchesService.create(req.user.id, createBranchDto);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all branches for the business' })
  async findAll(@Request() req) {
    const businessId = await this.getBusinessId(req.user);
    return this.branchesService.findAll(businessId);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get a specific branch' })
  async findOne(@Request() req, @Param('id') id: string) {
    const businessId = await this.getBusinessId(req.user);
    return this.branchesService.findOne(businessId, id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Update a branch' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateBranchDto: UpdateBranchDto,
  ) {
    const businessId = await this.getBusinessId(req.user);
    return this.branchesService.update(
      businessId,
      id,
      updateBranchDto,
      req.user,
    );
  }

  @Delete(':id')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Delete a branch' })
  async remove(@Request() req, @Param('id') id: string) {
    const businessId = await this.getBusinessId(req.user);
    return this.branchesService.remove(businessId, id);
  }

  @Public()
  @Get('check-username/:username')
  @ApiOperation({
    summary: 'Check username availability',
    description:
      'Checks if a username is available for use. ' +
      'Validates format (3-30 chars, lowercase, alphanumeric + hyphens) and uniqueness. ' +
      'Returns null if available, or error message if taken/invalid.',
  })
  @ApiParam({
    name: 'username',
    description: 'Username to check',
    example: 'main-office',
  })
  @ApiResponse({
    status: 200,
    description: 'Username availability check result',
    schema: {
      example: {
        available: true,
        message: null,
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Username is not available',
    schema: {
      example: {
        available: false,
        message: 'Username "main-office" is already taken',
      },
    },
  })
  async checkUsernameAvailability(@Param('username') username: string) {
    const error = await this.branchesService.validateUsername(username);
    return {
      available: !error,
      message: error,
    };
  }

  @Get(':id/last-top-recent-customer')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary: 'Get the last top recent customer of a branch',
    description:
      'Returns the customer who has visited this branch the most, with tie-breaks for the most recent visit.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the branch',
    example: 'branch-uuid-here',
  })
  @ApiResponse({
    status: 200,
    description:
      'The top recent customer detail or null if the branch has no visitors yet.',
    schema: {
      example: {
        customer: {
          id: 'uuid-string',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+2348012345678',
          avatar: 'https://example.com/avatar.jpg',
          uniqueCode: 'CUST-123456',
          createdAt: '2023-10-25T10:00:00.000Z',
        },
        visitCount: 12,
        lastVisitAt: '2023-10-25T10:00:00.000Z',
      },
    },
  })
  async getLastTopRecentCustomer(@Request() req, @Param('id') id: string) {
    const hasAccess = await this.branchesService.checkBranchAccess(
      req.user,
      id,
    );
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this branch');
    }
    return this.branchesService.getLastTopRecentCustomer(id);
  }

  private async getBusinessId(user: any): Promise<string> {
    if (user.businessId) return user.businessId;

    if (user.role === UserRole.OWNER) {
      const business = await this.branchesService.findBusinessByOwner(user.id);
      if (!business) {
        throw new NotFoundException('Business not found for this owner');
      }
      return business.id;
    }

    if (user.branchId) {
      return this.branchesService.getBusinessId(user.branchId);
    }

    throw new ForbiddenException('Business context not found');
  }
}
