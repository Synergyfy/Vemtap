import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { PosPeripheral } from './entities/pos-peripheral.entity';
import {
  CreatePosPeripheralDto,
  PosPeripheralHeartbeatDto,
  PosPeripheralQueryDto,
  UpdatePosPeripheralDto,
} from './dto/pos-peripheral.dto';
import { PosPeripheralsService } from './pos-peripherals.service';

interface RequestWithUser extends Request {
  user: User;
}

@ApiTags('POS Peripherals')
@ApiBearerAuth()
@Controller('pos/peripherals')
export class PosPeripheralsController {
  constructor(private readonly peripheralsService: PosPeripheralsService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({
    summary: 'List configured POS devices',
    description:
      'Card terminals, printers, drawers, scanners and displays, filterable by branch and type. Access: OWNER, MANAGER, ADMIN, STAFF.',
  })
  @ApiResponse({ status: 200, type: [PosPeripheral] })
  list(@Query() query: PosPeripheralQueryDto, @Req() req: RequestWithUser) {
    return this.peripheralsService.list(req.user.businessId, query);
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Add a POS device',
    description: 'Configuration only. Access: OWNER, MANAGER, ADMIN.',
  })
  @ApiResponse({ status: 201, type: PosPeripheral })
  @ApiResponse({ status: 404, description: 'Branch or till not found' })
  create(@Body() dto: CreatePosPeripheralDto, @Req() req: RequestWithUser) {
    return this.peripheralsService.create(req.user.businessId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update a POS device',
    description: 'Access: OWNER, MANAGER, ADMIN.',
  })
  @ApiResponse({ status: 200, type: PosPeripheral })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePosPeripheralDto,
    @Req() req: RequestWithUser,
  ) {
    return this.peripheralsService.update(req.user.businessId, id, dto);
  }

  @Post(':id/heartbeat')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({
    summary: 'Report a device connection status',
    description:
      'Sets status and lastSeenAt from what the till sees. Access: OWNER, MANAGER, ADMIN, STAFF.',
  })
  @ApiResponse({ status: 201, type: PosPeripheral })
  heartbeat(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PosPeripheralHeartbeatDto,
    @Req() req: RequestWithUser,
  ) {
    return this.peripheralsService.heartbeat(req.user.businessId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Remove a POS device',
    description: 'Access: OWNER, MANAGER, ADMIN.',
  })
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: RequestWithUser) {
    return this.peripheralsService.remove(req.user.businessId, id);
  }
}
