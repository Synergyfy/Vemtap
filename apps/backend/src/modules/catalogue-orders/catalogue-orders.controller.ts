import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CatalogueOrderService } from './catalogue-orders.service';
import {
  CreateCatalogueOrderDto,
  UpdateCatalogueOrderStatusDto,
  CatalogueOrderQueryDto,
  BulkCheckoutDto,
} from './dto/catalogue-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { User, UserRole } from '../users/entities/user.entity';

interface RequestWithUser extends Request {
  user: User;
}

@ApiTags('Catalogue Orders')
@Controller('catalogue/orders')
export class CatalogueOrdersController {
  constructor(private readonly orderService: CatalogueOrderService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Place a new catalogue order (Public)' })
  async createOrder(@Body() dto: CreateCatalogueOrderDto) {
    return this.orderService.createOrder(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('bulk-checkout')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Place multiple orders across different branches (Customer only)' })
  async bulkCheckout(@Body() dto: BulkCheckoutDto, @Req() req: RequestWithUser) {
    return this.orderService.bulkCheckout(dto, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('my-orders')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'List orders for the authenticated customer' })
  async getMyOrders(@Req() req: RequestWithUser) {
    return this.orderService.findAllByCustomer(req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @Permissions('catalogue')
  @ApiOperation({ summary: 'List orders for the business (Admin)' })
  async listOrders(
    @Query() query: CatalogueOrderQueryDto,
    @Req() req: RequestWithUser,
  ) {
    return this.orderService.findAllOrders(req.user.businessId, query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @Permissions('catalogue')
  @ApiOperation({ summary: 'Get order details (Admin)' })
  async getOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ) {
    return this.orderService.findOneOrder(id, req.user.businessId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Patch(':id/status')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @Permissions('catalogue')
  @ApiOperation({ summary: 'Update order status (Admin)' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCatalogueOrderStatusDto,
    @Req() req: RequestWithUser,
  ) {
    return this.orderService.updateStatus(
      id,
      dto.status,
      req.user.businessId,
      req.user,
    );
  }
}
