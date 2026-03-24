import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { SegmentsService } from '../services/segments.service';
import {
  CreateSegmentDto,
  UpdateSegmentDto,
  SegmentMemberDto,
} from '../dto/segment.dto';
import { User, UserRole } from '../../users/entities/user.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { BranchFilterDto } from '../../../common/dto/branch-filter.dto';

@ApiTags('Segments')
@Controller('segments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class SegmentsController {
  constructor(private readonly segmentsService: SegmentsService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new customer segment' })
  @ApiResponse({ status: 201, description: 'Segment created successfully' })
  async createSegment(
    @Body() dto: CreateSegmentDto,
    @Request() req: { user: User },
  ) {
    return this.segmentsService.createSegment(dto, req.user);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all segments for a branch' })
  @ApiResponse({ status: 200, description: 'Segments retrieved successfully' })
  async getSegments(
    @Query() filter: BranchFilterDto,
    @Request() req: { user: User },
  ) {
    const branchId = filter.branchId || req.user.branchId;
    return this.segmentsService.getSegments(branchId);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get a specific segment with member details' })
  @ApiParam({ name: 'id', description: 'Segment UUID' })
  @ApiResponse({ status: 200, description: 'Segment retrieved successfully' })
  async getSegment(
    @Param('id') id: string,
    @Query() filter: BranchFilterDto,
    @Request() req: { user: User },
  ) {
    const branchId = filter.branchId || req.user.branchId;
    return this.segmentsService.getSegmentWithMembers(id, branchId);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update segment details' })
  @ApiParam({ name: 'id', description: 'Segment UUID' })
  @ApiResponse({ status: 200, description: 'Segment updated successfully' })
  async updateSegment(
    @Param('id') id: string,
    @Body() dto: UpdateSegmentDto,
    @Query() filter: BranchFilterDto,
    @Request() req: { user: User },
  ) {
    const branchId = filter.branchId || req.user.branchId;
    return this.segmentsService.updateSegment(id, dto, branchId);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete a segment' })
  @ApiParam({ name: 'id', description: 'Segment UUID' })
  @ApiResponse({ status: 200, description: 'Segment deleted successfully' })
  async deleteSegment(
    @Param('id') id: string,
    @Query() filter: BranchFilterDto,
    @Request() req: { user: User },
  ) {
    const branchId = filter.branchId || req.user.branchId;
    return this.segmentsService.deleteSegment(id, branchId);
  }

  @Post(':id/members')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Add members to a segment' })
  @ApiParam({ name: 'id', description: 'Segment UUID' })
  @ApiResponse({ status: 200, description: 'Members added successfully' })
  async addMembers(
    @Param('id') id: string,
    @Body() dto: SegmentMemberDto,
    @Query() filter: BranchFilterDto,
    @Request() req: { user: User },
  ) {
    const branchId = filter.branchId || req.user.branchId;
    return this.segmentsService.addMembers(id, dto.userIds, branchId);
  }

  @Delete(':id/members')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Remove members from a segment' })
  @ApiParam({ name: 'id', description: 'Segment UUID' })
  @ApiResponse({ status: 200, description: 'Members removed successfully' })
  async removeMembers(
    @Param('id') id: string,
    @Body() dto: SegmentMemberDto,
    @Query() filter: BranchFilterDto,
    @Request() req: { user: User },
  ) {
    const branchId = filter.branchId || req.user.branchId;
    return this.segmentsService.removeMembers(id, dto.userIds, branchId);
  }
}
