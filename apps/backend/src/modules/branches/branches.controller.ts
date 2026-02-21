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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('branches')
@ApiBearerAuth()
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Create a new branch for the business' })
  create(@Request() req, @Body() createBranchDto: CreateBranchDto) {
    return this.branchesService.create(req.user.id, createBranchDto);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all branches for the business' })
  findAll(@Request() req) {
    // If manager, they might only be allowed to see their own branch,
    // but the requirement says "owner... can crud branches".
    // Managers can typically view them.
    return this.branchesService.findAll(req.user.id);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get a specific branch' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.branchesService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Update a branch' })
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateBranchDto: UpdateBranchDto,
  ) {
    return this.branchesService.update(req.user.id, id, updateBranchDto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Delete a branch' })
  remove(@Request() req, @Param('id') id: string) {
    return this.branchesService.remove(req.user.id, id);
  }
}
