import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
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
  ApiBody,
} from '@nestjs/swagger';

import { BranchFilterDto } from '../../common/dto/branch-filter.dto';

@ApiTags('devices')
@ApiBearerAuth()
@Controller('devices')
@Roles(UserRole.OWNER, UserRole.MANAGER) // Only Owners and Managers can manage devices
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  // ... (admin methods)

  @Get()
  @ApiOperation({ summary: 'Get all devices for the business' })
  @ApiResponse({ status: 200, description: 'List of devices', type: [Device] })
  findAll(
    @Request() req: { user: User },
    @Query() filter: BranchFilterDto,
  ) {
    return this.devicesService.findAllByBusiness(req.user.businessId, filter.branchId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get summary stats for all devices' })
  @ApiResponse({ status: 200, description: 'Device statistics' })
  getStats(
    @Request() req: { user: User },
    @Query() filter: BranchFilterDto,
  ) {
    return this.devicesService.getStats(req.user.businessId, filter.branchId);
  }

  @Patch('names')
  @ApiOperation({ summary: 'Update names for generated assets' })
  @ApiResponse({
    status: 200,
    description: 'Assets names were correctly updated',
    type: [Device],
    schema: {
      example: [
        {
          id: 'dev-1uuid',
          name: 'Front Door Scanner',
          code: 'A1B2C3D4E',
          status: 'active',
          businessId: 'biz-1uuid',
          orderId: 'order-1uuid',
          totalScans: 0,
          createdAt: '2023-11-01T10:00:00Z',
        },
      ],
    },
  })
  updateNames(
    @Request() req: { user: User },
    @Body() dto: UpdateAssetNamesDto,
  ) {
    return this.devicesService.updateAssetNames(req.user.businessId, dto);
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
  generate(@Request() req: { user: User }) {
    return this.devicesService.generateDevicesForReadyOrders(
      req.user.id,
      req.user.businessId,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update device configuration' })
  @ApiResponse({ status: 200, description: 'Device updated', type: Device })
  update(
    @Request() req: { user: User },
    @Param('id') id: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
  ) {
    return this.devicesService.update(id, req.user.businessId, updateDeviceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove/Unlink a device' })
  @ApiResponse({ status: 200, description: 'Device removed' })
  remove(@Request() req: { user: User }, @Param('id') id: string) {
    return this.devicesService.remove(id, req.user.businessId);
  }
}
