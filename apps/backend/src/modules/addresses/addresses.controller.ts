import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { AddressesService } from './addresses.service';
import { CustomerAddress } from './entities/customer-address.entity';
import {
  AddressListDto,
  CreateAddressDto,
  UpdateAddressDto,
} from './dto/address.dto';

interface CustomerRequest {
  user: { id: string };
}

@ApiTags('Saved Addresses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
@Controller('me/addresses')
export class AddressesController {
  constructor(private readonly addresses: AddressesService) {}

  @Get()
  @ApiOperation({
    summary: 'List my saved addresses',
    description:
      'Default first, then oldest first. At most 10 per customer. Access: CUSTOMER',
  })
  @ApiResponse({ status: 200, type: AddressListDto })
  list(@Req() req: CustomerRequest) {
    return this.addresses.list(req.user.id);
  }

  @Post()
  @ApiOperation({
    summary: 'Save an address',
    description:
      'The first address becomes the default; `isDefault: true` moves the default here. 400 at the 10-address cap. Access: CUSTOMER',
  })
  @ApiResponse({ status: 201, type: CustomerAddress })
  create(@Req() req: CustomerRequest, @Body() dto: CreateAddressDto) {
    return this.addresses.create(req.user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Edit a saved address',
    description:
      '`isDefault: false` on the current default is refused (400) — pick another default instead. Access: CUSTOMER (own addresses only, else 404)',
  })
  @ApiResponse({ status: 200, type: CustomerAddress })
  update(
    @Req() req: CustomerRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addresses.update(req.user.id, id, dto);
  }

  @Post(':id/default')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Make an address my default',
    description: 'Idempotent. Access: CUSTOMER (own addresses only, else 404)',
  })
  @ApiResponse({ status: 200, type: CustomerAddress })
  setDefault(
    @Req() req: CustomerRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.addresses.setDefault(req.user.id, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove a saved address',
    description:
      'Removing the default promotes the oldest remaining address. Access: CUSTOMER (own addresses only, else 404)',
  })
  @ApiResponse({ status: 204, description: 'Removed' })
  remove(@Req() req: CustomerRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.addresses.remove(req.user.id, id);
  }
}
