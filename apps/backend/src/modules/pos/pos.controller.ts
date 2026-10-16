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
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { PosService } from './pos.service';
import { CreatePosSaleDto } from './dto/create-pos-sale.dto';
import { CreatePosOrderDto } from './dto/create-pos-order.dto';
import { ProcessPosOrderPaymentDto } from './dto/process-pos-order-payment.dto';
import { PosSaleQueryDto } from './dto/pos-sale-query.dto';
import { UpdatePosSaleStatusDto } from './dto/update-pos-sale-status.dto';
import { HoldPosSaleDto } from './dto/hold-pos-sale.dto';
import {
  OpenRegisterDto,
  CloseRegisterDto,
  RegisterHistoryQueryDto,
} from './dto/register.dto';
import { PosCustomerQueryDto } from './dto/pos-customer-query.dto';
import { CashDropDto } from './dto/cash-drop.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import {
  PosSettingsResponseDto,
  PosSettingsSummaryDto,
  UpdatePosSettingsDto,
} from './dto/pos-settings.dto';
import { PosBranchSummaryDto } from './dto/pos-till.dto';
import { PosSplitPreviewDto } from './dto/pos-split.dto';
import { previewSplit } from './pos-split.util';
import { PosSettingsService } from './pos-settings.service';
import { PosTillsService } from './pos-tills.service';
import { PosPeripheralsService } from './pos-peripherals.service';
import { PosStaffPinsService } from './pos-staff-pins.service';
import { Public } from '../../common/decorators/public.decorator';
import { BranchFilterDto } from '../../common/dto/branch-filter.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { Roles } from '../../common/decorators/roles.decorator';

interface RequestWithUser extends Request {
  user: User;
}

@ApiTags('POS')
@ApiBearerAuth()
@Controller('pos')
export class PosController {
  constructor(
    private readonly posService: PosService,
    private readonly posSettingsService: PosSettingsService,
    private readonly tillsService: PosTillsService,
    private readonly peripheralsService: PosPeripheralsService,
    private readonly staffPinsService: PosStaffPinsService,
  ) {}

  @Get('settings/summary')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({
    summary: 'POS settings hub summary',
    description:
      'Chip values for the settings hub: tax and service labels, receipt width, open cashier sessions, till, device and staff-PIN counts, tables, offline buffer, auto-sync interval and whether any action needs a supervisor PIN. Access: OWNER, MANAGER, ADMIN, STAFF.',
  })
  @ApiResponse({ status: 200, type: PosSettingsSummaryDto })
  async getSettingsSummary(@Req() req: RequestWithUser) {
    const businessId = req.user.businessId;
    const [tillCount, peripheralCount, staffPinCount] = await Promise.all([
      this.tillsService.count(businessId),
      this.peripheralsService.count(businessId),
      this.staffPinsService.count(businessId),
    ]);
    return this.posSettingsService.summary(businessId, {
      tillCount,
      peripheralCount,
      staffPinCount,
    });
  }

  @Get('branches/summary')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({
    summary: 'Per-branch POS summary for the branch switcher',
    description:
      "Every branch of the business with today's takings and transactions (refunds excluded), till count and open sessions; current marks the caller's branch. Access: OWNER, MANAGER, ADMIN, STAFF.",
  })
  @ApiResponse({ status: 200, type: [PosBranchSummaryDto] })
  async getBranchSummary(@Req() req: RequestWithUser) {
    return this.tillsService.branchSummary(
      req.user.businessId,
      req.user.branchId,
    );
  }

  @Get('settings')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({
    summary: 'Get POS settings',
    description:
      'Tax, surcharges, receipt, self-ordering, permission policy and tender rails, resolved against the defaults. Staff read it to price tickets. Access: OWNER, MANAGER, ADMIN, STAFF.',
  })
  @ApiResponse({ status: 200, type: PosSettingsResponseDto })
  async getSettings(@Req() req: RequestWithUser) {
    return this.posSettingsService.get(req.user.businessId);
  }

  @Patch('settings')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update POS settings',
    description:
      'Partial update; only the fields sent change and nested permissions / tenderRails merge field by field. Returns the full resolved settings. Access: OWNER, MANAGER, ADMIN.',
  })
  @ApiResponse({ status: 200, type: PosSettingsResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid or unknown field' })
  async updateSettings(
    @Body() dto: UpdatePosSettingsDto,
    @Req() req: RequestWithUser,
  ) {
    return this.posSettingsService.update(req.user.businessId, dto);
  }

  @Post('sales')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({
    summary: 'Complete a POS sale',
    description:
      'Prices the ticket with the POS settings (VAT, service charge, packaging by orderType), links it to the open register session and awards loyalty. Discounts above the cashier cap need overrideToken (action discount) when the policy allows overrides, else 403. Access: OWNER, MANAGER, ADMIN, STAFF.',
  })
  @ApiResponse({ status: 403, description: 'Discount above the cashier cap' })
  async completeSale(
    @Body() dto: CreatePosSaleDto,
    @Req() req: RequestWithUser,
  ) {
    return this.posService.completeSale(dto, req.user, {
      enforceDiscountPolicy: true,
    });
  }

  @Post('sales/batch-sync')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({
    summary: 'Batch sync offline POS sales',
    description:
      'Replays queued offline sales. Returns one result per sale with status synced | duplicate (clientRef already on the server) | conflict (rejected on business rules) | failed (retry). Access: OWNER, MANAGER, ADMIN, STAFF.',
  })
  async batchSyncSales(
    @Body(new ParseArrayPipe({ items: CreatePosSaleDto }))
    dtos: CreatePosSaleDto[],
    @Req() req: RequestWithUser,
  ) {
    return this.posService.batchSyncSales(dtos, req.user);
  }

  @Post('sales/split-preview')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({
    summary: 'Preview a split bill',
    description:
      'Shares for equal, by_item (a shared line splits evenly) or custom splits, each with its part of VAT, service charge and packaging; shares sum to the bill exactly. Settle with POST /pos/sales using payment.method split and one splitDetails entry per payer. Access: OWNER, MANAGER, ADMIN, STAFF.',
  })
  @ApiResponse({
    status: 400,
    description: 'Unassigned item or amounts do not cover the bill',
  })
  async splitPreview(
    @Body() dto: PosSplitPreviewDto,
    @Req() req: RequestWithUser,
  ) {
    return previewSplit(
      await this.posSettingsService.get(req.user.businessId),
      dto,
    );
  }

  @Get('sales')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({
    summary: 'List POS sales with pagination and filters',
    description:
      'Page of sales (each with itemCount and customerName) plus meta: counts per status (ignoring the status filter), grossTotal (excluding fully refunded sales) and byMethod. Filter by sessionId for one shift. Access: OWNER, MANAGER, ADMIN, STAFF.',
  })
  async listSales(
    @Query() query: PosSaleQueryDto,
    @Req() req: RequestWithUser,
  ) {
    return this.posService.findAllSales(req.user.businessId, query);
  }

  @Get('sales/held')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'List held/queued sales' })
  async listHeldSales(
    @Query() filter: BranchFilterDto,
    @Req() req: RequestWithUser,
  ) {
    return this.posService.findAllHeldSales(
      req.user.businessId,
      filter.branchId,
    );
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

  @Get('sales/:id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({
    summary: 'Get a single sale by ID',
    description:
      'Sale with items, tenders, refunds, cashier, branch and shift, plus itemCount, customerName, pointsEarned and the receipt block (business name, logo, header/footer, address, phone, TIN, width). Access: OWNER, MANAGER, ADMIN, STAFF.',
  })
  @ApiResponse({ status: 404, description: 'Sale not found in this business' })
  async getSale(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ) {
    return this.posService.getSaleDetail(id, req.user.businessId);
  }

  @Patch('sales/:id/status')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update sale status (refund)',
    description:
      'Full or partial refund. When the POS policy has refundRequiresPin, non-owners must send overrideToken from POST /pos/staff-pins/verify (action refund). Access: OWNER, MANAGER, ADMIN.',
  })
  @ApiResponse({ status: 403, description: 'Supervisor approval required' })
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
      req.user,
    );
  }

  @Post('sales/hold')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Hold/queue a sale for later' })
  async holdSale(@Body() dto: HoldPosSaleDto, @Req() req: RequestWithUser) {
    return this.posService.holdSale(dto, req.user);
  }

  @Post('register/open')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({
    summary: 'Open cash register',
    description:
      'Opens a session for the caller, optionally on a till (409 if the till already has an open session). Access: OWNER, MANAGER, ADMIN, STAFF.',
  })
  @ApiResponse({ status: 409, description: 'Till already has an open session' })
  async openRegister(
    @Body() dto: OpenRegisterDto,
    @Req() req: RequestWithUser,
  ) {
    return this.posService.openRegister(dto, req.user);
  }

  @Post('register/close')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({
    summary: 'Close cash register',
    description:
      'Freezes the open session, totals its sales and notifies branch staff. Pass countedCash to reconcile the drawer and report the variance. Access: OWNER, MANAGER, ADMIN, STAFF.',
  })
  async closeRegister(
    @Body() dto: CloseRegisterDto,
    @Req() req: RequestWithUser,
  ) {
    return this.posService.closeRegister(req.user, dto);
  }

  @Get('register/status')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get current register status' })
  async getRegisterStatus(@Req() req: RequestWithUser) {
    return this.posService.getRegisterStatus(req.user);
  }

  @Post('register/cash-drop')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Record a cash drop from the open register' })
  async cashDrop(@Body() dto: CashDropDto, @Req() req: RequestWithUser) {
    return this.posService.cashDrop(dto, req.user);
  }

  @Get('register/z-report')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get the current or last closed register Z-report' })
  async zReport(@Req() req: RequestWithUser) {
    return this.posService.getZReport(req.user);
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
  @ApiOperation({
    summary: "Today's POS dashboard stats",
    description:
      'Completed sales for today plus `heldSalesCount` — the server-visible ' +
      'pending queue of parked (held) sales. Unsynced offline sales live on ' +
      'the device until batch-sync, so they are not counted here.',
  })
  async getDashboard(
    @Query() filter: BranchFilterDto,
    @Req() req: RequestWithUser,
  ) {
    return this.posService.getDashboard(req.user.businessId, filter.branchId);
  }

  @Get('dashboard/top-products')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get top selling products today' })
  async getTopProducts(
    @Query() filter: BranchFilterDto,
    @Req() req: RequestWithUser,
  ) {
    return this.posService.getTopProducts(req.user.businessId, filter.branchId);
  }

  @Get('customers')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({
    summary: 'List POS customers with aggregated stats',
    description:
      'Customers who bought here, with spend, visits, first/last visit, points balance and tier at this business and their segments. segmentCounts gives the chip counts. Segments: vip (10+ visits or ₦100,000+), new (first visit in 30 days), lapsed (no visit in 60 days). Access: OWNER, MANAGER, ADMIN, STAFF.',
  })
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

  @Get('customers/:id/rewards')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({
    summary: 'Rewards a POS customer can redeem at this business',
    description:
      "Active, in-stock rewards with the customer's points balance and tier here; each reward says whether the balance covers it. Redeem with the loyalty redemption endpoints. Access: OWNER, MANAGER, ADMIN, STAFF.",
  })
  @ApiResponse({
    status: 404,
    description: 'Customer has never bought from this business',
  })
  async getCustomerRewards(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() filter: BranchFilterDto,
    @Req() req: RequestWithUser,
  ) {
    return this.posService.getCustomerRewards(
      id,
      req.user.businessId,
      filter.branchId,
    );
  }

  @Patch('products/:id/stock')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({
    summary: 'Set product stock quantity',
    description:
      'Sets the on-hand quantity and records an ADJUST stock movement with the reason and the user. History: GET /inventory/counting/movements?itemId=. Access: OWNER, MANAGER, ADMIN, STAFF.',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async adjustStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdjustStockDto,
    @Req() req: RequestWithUser,
  ) {
    return this.posService.adjustStock(id, req.user.businessId, dto.quantity, {
      reason: dto.reason,
      userId: req.user.id,
      branchId: req.user.branchId,
    });
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
