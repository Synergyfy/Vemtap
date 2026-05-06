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
  Get as GetMapping,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CapabilityGuard } from '../subscriptions/guards/capability.guard';
import { RequireCapability } from '../subscriptions/decorators/capability.decorator';

@ApiTags('branches')
@ApiBearerAuth()
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
    return this.branchesService.update(businessId, id, updateBranchDto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Delete a branch' })
  async remove(@Request() req, @Param('id') id: string) {
    const businessId = await this.getBusinessId(req.user);
    return this.branchesService.remove(businessId, id);
  }

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
