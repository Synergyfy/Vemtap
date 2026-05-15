import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  BadRequestException,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DevicesService } from './devices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { AdminCreateDeviceDto } from './dto/admin-create-device.dto';
import { AdminUpdateDeviceDto } from './dto/admin-update-device.dto';
import { UpdateAssetNamesDto } from './dto/update-asset-names.dto';
import { Device } from './entities/device.entity';
import { Roles } from '../../common/decorators/roles.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { AdminDeviceQueryDto } from './dto/admin-device-query.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { BranchFilterDto } from '../../common/dto/branch-filter.dto';
import { GenerateDevicesDto, DeviceQueryDto } from './dto/device-action.dto';
import { ParseUUIDPipe } from '@nestjs/common';

@ApiTags('devices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('devices')
@Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER)
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  private async getBranchId(
    req: { user: User },
    branchId?: string,
  ): Promise<string> {
    const user = req.user;

    // For Owner and Admin: branchId MUST be provided in the request for write operations
    if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
      if (!branchId) {
        throw new BadRequestException(
          'branchId is required for Owners and Admins for write operations',
        );
      }

      if (user.role === UserRole.OWNER) {
        const hasAccess = await this.devicesService.checkBranchAccess(
          user,
          branchId,
        );
        if (!hasAccess) {
          throw new BadRequestException(
            'You do not have access to this branch',
          );
        }
      }
      return branchId;
    }

    // For Manager and Staff: ignore provided branchId, always use branchId from token
    if (!user.branchId) {
      throw new BadRequestException('User is not associated with any branch');
    }

    return user.branchId;
  }

  private async getResolvedContext(
    req: { user: User },
    filter: BranchFilterDto,
  ): Promise<{ branchId?: string; businessId?: string }> {
    const user = req.user;

    if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
      if (filter.allBranches) {
        if (user.role === UserRole.OWNER) {
          return { businessId: user.businessId };
        }
        return {
          businessId:
            ((req as any).query.businessId as string) || user.businessId,
        };
      }

      if (filter.branchId) {
        if (user.role === UserRole.OWNER) {
          const hasAccess = await this.devicesService.checkBranchAccess(
            user,
            filter.branchId,
          );
          if (!hasAccess)
            throw new BadRequestException('Access denied to this branch');
        }
        return { branchId: filter.branchId };
      }

      throw new BadRequestException(
        'Either branchId or allBranches must be provided for Owners and Admins',
      );
    }

    return { branchId: user.branchId };
  }

  // --- Admin Endpoints ---
  @Get('admin')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Admin: Get all devices with filters and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Return list of devices with pagination',
  })
  async findAllAdmin(@Query() query: AdminDeviceQueryDto) {
    return this.devicesService.findAllAdmin(query);
  }

  @Get('admin/stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get overall device statistics' })
  async getAdminStats() {
    return this.devicesService.getAdminStats();
  }

  @Post('admin')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Manually create/register a device code' })
  async adminCreate(@Body() dto: AdminCreateDeviceDto) {
    return this.devicesService.adminCreate(dto);
  }

  @Patch('admin/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Update device details' })
  async adminUpdate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateDeviceDto,
  ) {
    return this.devicesService.adminUpdate(id, dto);
  }

  @Delete('admin/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Delete a device' })
  async adminDelete(@Param('id', ParseUUIDPipe) id: string) {
    return this.devicesService.adminDelete(id);
  }

  @Get()
  @Permissions('settings')
  @ApiOperation({ summary: 'Get all devices for the branch or business' })
  @ApiResponse({ status: 200, description: 'List of devices', type: [Device] })
  async findAll(
    @Request() req: { user: User },
    @Query() filter: BranchFilterDto,
  ) {
    const context = await this.getResolvedContext(req, filter);
    return this.devicesService.findAllByContext(
      context.branchId,
      context.businessId,
    );
  }

  @Get('stats')
  @Permissions('settings')
  @ApiOperation({
    summary: 'Get summary stats for all devices in the branch or business',
  })
  @ApiResponse({ status: 200, description: 'Device statistics' })
  async getStats(
    @Request() req: { user: User },
    @Query() filter: BranchFilterDto,
  ) {
    const context = await this.getResolvedContext(req, filter);
    return this.devicesService.getStats(context.branchId, context.businessId);
  }

  @Patch('names')
  @Permissions('settings')
  @ApiOperation({ summary: 'Update names for generated assets' })
  @ApiResponse({
    status: 200,
    description: 'Assets names were correctly updated',
    type: [Device],
  })
  async updateNames(
    @Request() req: { user: User },
    @Body() dto: UpdateAssetNamesDto,
  ) {
    const branchId = await this.getBranchId(req, dto.branchId);
    return this.devicesService.updateAssetNames(branchId, dto);
  }
  @Post('generate')
  @Permissions('settings')
  @ApiOperation({
    summary: 'Generate devices for ready orders (Business Owner)',
  })
  @ApiResponse({
    status: 201,
    description: 'Devices generated for pending ready orders.',
    type: [Device],
  })
  @ApiBody({ type: GenerateDevicesDto })
  async generate(
    @Request() req: { user: User },
    @Body() dto: GenerateDevicesDto,
  ) {
    const targetBranchId = await this.getBranchId(req, dto.branchId);
    return this.devicesService.generateDevicesForReadyOrders(
      req.user.id,
      targetBranchId,
    );
  }

  @Patch(':id')
  @Permissions('settings')
  @ApiOperation({ summary: 'Update device configuration' })
  @ApiResponse({ status: 200, description: 'Device updated', type: Device })
  async update(
    @Request() req: { user: User },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
  ) {
    const branchId = await this.getBranchId(
      req,
      updateDeviceDto.branchId ?? undefined,
    );
    return this.devicesService.update(id, branchId, updateDeviceDto);
  }

  @Delete(':id')
  @Permissions('settings')
  @ApiOperation({ summary: 'Remove/Unlink a device' })
  @ApiResponse({ status: 200, description: 'Device removed' })
  async remove(
    @Request() req: { user: User },
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DeviceQueryDto,
  ) {
    const branchId = await this.getBranchId(req, query.branchId);
    return this.devicesService.remove(id, branchId);
  }
}
