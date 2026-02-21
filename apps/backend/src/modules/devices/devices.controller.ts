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
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { UpdateAssetNamesDto } from './dto/update-asset-names.dto';
import { Device } from './entities/device.entity';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('devices')
@ApiBearerAuth()
@Controller('devices')
@Roles(UserRole.OWNER, UserRole.MANAGER) // Only Owners and Managers can manage devices
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new NFC device' })
  @ApiResponse({
    status: 201,
    description: 'Device registered successfully',
    type: Device,
  })
  create(@Request() req, @Body() createDeviceDto: CreateDeviceDto) {
    return this.devicesService.create(req.user.businessId, createDeviceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all devices for the business' })
  @ApiResponse({ status: 200, description: 'List of devices', type: [Device] })
  findAll(@Request() req) {
    return this.devicesService.findAllByBusiness(req.user.businessId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get summary stats for all devices' })
  @ApiResponse({ status: 200, description: 'Device statistics' })
  getStats(@Request() req) {
    return this.devicesService.getStats(req.user.businessId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific device' })
  @ApiResponse({ status: 200, description: 'Device details', type: Device })
  findOne(@Request() req, @Param('id') id: string) {
    return this.devicesService.findOne(id, req.user.businessId);
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate devices for all ready orders' })
  @ApiResponse({
    status: 201,
    description: 'Devices successfully generated from ready orders',
    type: [Device],
    schema: {
      example: [
        {
          id: 'dev-1uuid',
          name: '',
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
  generateAssets(@Request() req) {
    return this.devicesService.generateDevicesForReadyOrders(
      req.user.id,
      req.user.businessId,
    );
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
  updateNames(@Request() req, @Body() dto: UpdateAssetNamesDto) {
    return this.devicesService.updateAssetNames(req.user.businessId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update device configuration' })
  @ApiResponse({ status: 200, description: 'Device updated', type: Device })
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
  ) {
    return this.devicesService.update(id, req.user.businessId, updateDeviceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove/Unlink a device' })
  @ApiResponse({ status: 200, description: 'Device removed' })
  remove(@Request() req, @Param('id') id: string) {
    return this.devicesService.remove(id, req.user.businessId);
  }

  // --- Admin Endpoints ---

  @Get('admin')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get all devices with filters' })
  async findAllAdmin(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.devicesService.findAllAdmin({ search, status, page, limit });
  }

  @Get('admin/stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get device statistics' })
  async getAdminStats() {
    return this.devicesService.getAdminStats();
  }

  @Post('admin')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Manually provision a new device' })
  async adminCreate(@Body() createDeviceDto: any) {
    return this.devicesService.adminCreate(createDeviceDto);
  }

  @Patch('admin/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Update device configuration' })
  async adminUpdate(@Param('id') id: string, @Body() updateDeviceDto: any) {
    return this.devicesService.adminUpdate(id, updateDeviceDto);
  }

  @Delete('admin/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Decommission a device globally' })
  async adminDelete(@Param('id') id: string) {
    return this.devicesService.adminDelete(id);
  }
}
