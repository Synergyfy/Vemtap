import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  ParseUUIDPipe,
  ParseArrayPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PosService } from './pos.service';
import { CreatePosSaleDto } from './dto/create-pos-sale.dto';
import { CreatePosOrderDto } from './dto/create-pos-order.dto';
import { ProcessPosOrderPaymentDto } from './dto/process-pos-order-payment.dto';
import { PosSaleQueryDto } from './dto/pos-sale-query.dto';
import { UpdatePosSaleStatusDto } from './dto/update-pos-sale-status.dto';
import { HoldPosSaleDto } from './dto/hold-pos-sale.dto';
import { OpenRegisterDto, RegisterHistoryQueryDto } from './dto/register.dto';
import { PosCustomerQueryDto } from './dto/pos-customer-query.dto';
import { Public } from '../../common/decorators/public.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { Roles } from '../../common/decorators/roles.decorator';

interface RequestWithUser extends Request {
  user: User;
}

@ApiTags('POS')
@ApiBearerAuth()
@Controller('pos')
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Post('sales')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Complete a POS sale' })
  async completeSale(
    @Body() dto: CreatePosSaleDto,
    @Req() req: RequestWithUser,
  ) {
    return this.posService.completeSale(dto, req.user);
  }

  @Post('sales/batch-sync')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Batch sync offline POS sales' })
  async batchSyncSales(
    @Body(new ParseArrayPipe({ items: CreatePosSaleDto }))
    dtos: CreatePosSaleDto[],
    @Req() req: RequestWithUser,
  ) {
    return this.posService.batchSyncSales(dtos, req.user);
  }

  @Get('sales')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'List POS sales with pagination and filters' })
  async listSales(
    @Query() query: PosSaleQueryDto,
    @Req() req: RequestWithUser,
  ) {
    return this.posService.findAllSales(req.user.businessId, query);
  }

  @Get('sales/:id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get a single sale by ID' })
  async getSale(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ) {
    return this.posService.findOneSale(id, req.user.businessId);
  }

  @Patch('sales/:id/status')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update sale status (refund)' })
  async updateSaleStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePosSaleStatusDto,
    @Req() req: RequestWithUser,
  ) {
    return this.posService.updateSaleStatus(
      id,
      dto,
      req.user.businessId,
      req.user.id,
    );
  }

  @Post('sales/hold')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Hold/queue a sale for later' })
  async holdSale(@Body() dto: HoldPosSaleDto, @Req() req: RequestWithUser) {
    return this.posService.holdSale(dto, req.user);
  }

  @Get('sales/held')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'List held/queued sales' })
  async listHeldSales(
    @Query('branchId') branchId: string | undefined,
    @Req() req: RequestWithUser,
  ) {
    return this.posService.findAllHeldSales(req.user.businessId, branchId);
  }

  @Get('sales/held/:id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get held sale details (resume data)' })
  async getHeldSale(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ) {
    return this.posService.resumeHeldSale(id, req.user.businessId);
  }

  @Delete('sales/held/:id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Delete a held sale' })
  async deleteHeldSale(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ) {
    return this.posService.deleteHeldSale(id, req.user.businessId);
  }

  @Post('register/open')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Open cash register' })
  async openRegister(
    @Body() dto: OpenRegisterDto,
    @Req() req: RequestWithUser,
  ) {
    return this.posService.openRegister(dto, req.user);
  }

  @Post('register/close')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Close cash register' })
  async closeRegister(@Req() req: RequestWithUser) {
    return this.posService.closeRegister(req.user);
  }

  @Get('register/status')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get current register status' })
  async getRegisterStatus(@Req() req: RequestWithUser) {
    return this.posService.getRegisterStatus(req.user);
  }

  @Get('register/history')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get register session history' })
  async getRegisterHistory(
    @Query() query: RegisterHistoryQueryDto,
    @Req() req: RequestWithUser,
  ) {
    return this.posService.getRegisterHistory(req.user.businessId, query);
  }

  @Get('dashboard')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get POS dashboard stats' })
  async getDashboard(
    @Query('branchId') branchId: string | undefined,
    @Req() req: RequestWithUser,
  ) {
    return this.posService.getDashboard(req.user.businessId, branchId);
  }

  @Get('dashboard/top-products')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get top selling products today' })
  async getTopProducts(
    @Query('branchId') branchId: string | undefined,
    @Req() req: RequestWithUser,
  ) {
    return this.posService.getTopProducts(req.user.businessId, branchId);
  }

  @Get('customers')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'List POS customers with aggregated stats' })
  async listCustomers(
    @Query() query: PosCustomerQueryDto,
    @Req() req: RequestWithUser,
  ) {
    return this.posService.findCustomers(req.user.businessId, query);
  }

  @Get('customers/:id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get POS customer detail with purchase history' })
  async getCustomer(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ) {
    return this.posService.findCustomerById(id, req.user.businessId);
  }

  @Patch('products/:id/stock')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Adjust product stock quantity' })
  async adjustStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('quantity') quantity: number,
    @Req() req: RequestWithUser,
  ) {
    return this.posService.adjustStock(id, req.user.businessId, quantity);
  }

  @Public()
  @Post('orders')
  @ApiOperation({
    summary: 'Place a POS order (public or staff)',
    description:
      'Dual-mode endpoint. If a valid JWT is provided, the order is placed by a staff member ' +
      '(can link existing customers via customerId). If no token is provided, acts as a public ' +
      'walk-in order requiring customer name and phone. Select catalogue items or offers by UUID.',
  })
  async placeOrder(
    @Body() dto: CreatePosOrderDto,
    @Req() req: Partial<RequestWithUser>,
  ) {
    const staff: User | undefined = req.user?.id ? req.user : undefined;
    return this.posService.placeOrder(dto, staff);
  }

  @Post('orders/:id/process-payment')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({
    summary: 'Process payment for a pending POS order',
    description:
      'Takes payment for a "new" or "processing" order. Creates a completed POS sale linked to the order, ' +
      'updates the order status to "completed", awards loyalty points, sends notifications, and records the ' +
      'financial transaction.',
  })
  async processOrderPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ProcessPosOrderPaymentDto,
    @Req() req: RequestWithUser,
  ) {
    return this.posService.processOrderPayment(id, dto, req.user);
  }
}
