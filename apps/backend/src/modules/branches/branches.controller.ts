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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
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
