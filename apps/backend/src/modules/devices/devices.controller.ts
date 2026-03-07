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
} from '@nestjs/common';
import { DevicesService } from './devices.service';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { AdminCreateDeviceDto } from './dto/admin-create-device.dto';
import { AdminUpdateDeviceDto } from './dto/admin-update-device.dto';
import { UpdateAssetNamesDto } from './dto/update-asset-names.dto';
import { Device } from './entities/device.entity';
import { Roles } from '../../common/decorators/roles.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BranchFilterDto } from '../../common/dto/branch-filter.dto';

@ApiTags('devices')
@ApiBearerAuth()
@Controller('devices')
@Roles(UserRole.OWNER, UserRole.MANAGER) // Only Owners and Managers can manage devices
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

  // ... (admin methods omitted for brevity as they are handled in the full file)

  @Get()
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
  @ApiOperation({
    summary: 'Generate devices for ready orders (Business Owner)',
  })
  @ApiResponse({
    status: 201,
    description: 'Devices generated for pending ready orders.',
    type: [Device],
  })
  async generate(
    @Request() req: { user: User },
    @Body('branchId') branchId?: string,
  ) {
    const targetBranchId = await this.getBranchId(req, branchId);
    return this.devicesService.generateDevicesForReadyOrders(
      req.user.id,
      targetBranchId,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update device configuration' })
  @ApiResponse({ status: 200, description: 'Device updated', type: Device })
  async update(
    @Request() req: { user: User },
    @Param('id') id: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
  ) {
    const branchId = await this.getBranchId(
      req,
      updateDeviceDto.branchId ?? undefined,
    );
    return this.devicesService.update(id, branchId, updateDeviceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove/Unlink a device' })
  @ApiResponse({ status: 200, description: 'Device removed' })
  async remove(
    @Request() req: { user: User },
    @Param('id') id: string,
    @Query('branchId') queryBranchId?: string,
  ) {
    const branchId = await this.getBranchId(req, queryBranchId);
    return this.devicesService.remove(id, branchId);
  }
}
