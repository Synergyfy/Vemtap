import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { StoreOrderingService } from './store-ordering.service';
import {
  AssignStoreOrderDto,
  CompleteFromPosDto,
  CreateStoreQrDto,
  RecordStorePaymentDto,
  StoreOrderQueryDto,
  UpdateStoreOrderItemDto,
  UpdateStoreOrderStatusDto,
  UpdateStoreOrderingSettingsDto,
  UpdateStoreQrDto,
} from './dto/store-ordering.dto';

interface BusinessRequest {
  user: User;
}

const ACCESS = 'Access: OWNER, MANAGER, STAFF of the business.';

@ApiTags('Store Ordering')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
@Controller('store-ordering')
export class StoreOrderingController {
  constructor(private readonly store: StoreOrderingService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Store-ordering dashboard numbers',
    description: `New, preparing, ready, awaiting collection, completed today and revenue today (Lagos day), from one aggregate query. ${ACCESS}`,
  })
  @ApiQuery({ name: 'branchId', required: false })
  summary(
    @Req() req: BusinessRequest,
    @Query('branchId', new ParseUUIDPipe({ optional: true })) branchId?: string,
  ) {
    return this.store.summary(req.user.businessId, branchId);
  }

  @Get('orders')
  @ApiOperation({
    summary: 'List store orders',
    description: `Every non-booking catalogue order: store-ordering orders carry a \`source\`, app orders have none. Newest first, paginated. ${ACCESS}`,
  })
  list(@Req() req: BusinessRequest, @Query() query: StoreOrderQueryDto) {
    return this.store.list(req.user.businessId, query);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'One store order', description: ACCESS })
  @ApiResponse({
    status: 404,
    description: 'Not a store order of this business',
  })
  get(@Req() req: BusinessRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.store.get(req.user.businessId, id);
  }

  @Patch('orders/:id/status')
  @ApiOperation({
    summary: 'Move a store order to another stage',
    description: `new → accepted → preparing → ready → awaiting-payment/completed, with partially-fulfilled, rejected and cancelled. "paid" comes only from recording a payment and "completed" needs one first (400). An illegal move is 409. The catalogue status follows (stock, loyalty, customer notifications). ${ACCESS}`,
  })
  updateStatus(
    @Req() req: BusinessRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStoreOrderStatusDto,
  ) {
    return this.store.updateStatus(req.user.businessId, req.user, id, dto);
  }

  @Patch('orders/:id/items/:itemId')
  @ApiOperation({
    summary: 'Adjust a line: unavailable, removed or substituted',
    description: `Recomputes the order total from the remaining lines; an accepted/preparing order with a dropped line becomes partially-fulfilled. Refused (409) once paid or closed; substitutions need allowSubstitutions. ${ACCESS}`,
  })
  updateItem(
    @Req() req: BusinessRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateStoreOrderItemDto,
  ) {
    return this.store.updateItem(
      req.user.businessId,
      req.user,
      id,
      itemId,
      dto,
    );
  }

  @Post('orders/:id/assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Assign a team member to the order',
    description: ACCESS,
  })
  assign(
    @Req() req: BusinessRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignStoreOrderDto,
  ) {
    return this.store.assign(req.user.businessId, id, dto);
  }

  @Post('orders/:id/payment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Record a counter payment',
    description: `Amount defaults to the amount due. Full payment → paid (or completed with markCompleted); less → awaiting-payment. Cash records change. Already paid or closed → 409. ${ACCESS}`,
  })
  recordPayment(
    @Req() req: BusinessRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordStorePaymentDto,
  ) {
    return this.store.recordPayment(req.user.businessId, req.user, id, dto);
  }

  @Post('orders/:id/collect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Hand the order over (complete it)',
    description: `Needs a recorded payment (400 otherwise); idempotent once completed. ${ACCESS}`,
  })
  collect(@Req() req: BusinessRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.store.collect(req.user.businessId, req.user, id);
  }

  @Post('orders/:id/complete-from-pos')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete an order paid on VEMTAP POS',
    description: `Links the POS sale (must belong to the business, else 404) as the payment and completes the order. ${ACCESS}`,
  })
  completeFromPos(
    @Req() req: BusinessRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteFromPosDto,
  ) {
    return this.store.completeFromPos(req.user.businessId, req.user, id, dto);
  }

  @Get('qr-codes')
  @ApiOperation({
    summary: 'Store-ordering QR codes',
    description: `Each with scans, orders and paid revenue (one grouped query). ${ACCESS}`,
  })
  listQrCodes(@Req() req: BusinessRequest) {
    return this.store.listQrCodes(req.user.businessId);
  }

  @Post('qr-codes')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Create a store-ordering QR',
    description:
      'For a branch of the caller’s business (else 404). Access: OWNER, MANAGER.',
  })
  createQrCode(@Req() req: BusinessRequest, @Body() dto: CreateStoreQrDto) {
    return this.store.createQrCode(req.user.businessId, dto);
  }

  @Patch('qr-codes/:id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Rename, relabel, pause or resume a QR',
    description: 'Access: OWNER, MANAGER.',
  })
  updateQrCode(
    @Req() req: BusinessRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStoreQrDto,
  ) {
    return this.store.updateQrCode(req.user.businessId, id, dto);
  }

  @Get('settings')
  @ApiOperation({
    summary: 'Store-ordering settings (defaults filled in)',
    description: ACCESS,
  })
  settings(@Req() req: BusinessRequest) {
    return this.store.settings(req.user.businessId);
  }

  @Patch('settings')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Update store-ordering settings',
    description:
      'Partial update. `activeBranches` keys that are not the caller’s branches are ignored. Access: OWNER, MANAGER.',
  })
  updateSettings(
    @Req() req: BusinessRequest,
    @Body() dto: UpdateStoreOrderingSettingsDto,
  ) {
    return this.store.updateSettings(req.user.businessId, dto);
  }
}

@ApiTags('Store Ordering (Public)')
@Controller('public/store-qr')
export class PublicStoreQrController {
  constructor(private readonly store: StoreOrderingService) {}

  @Get(':code')
  @Public()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Resolve a scanned store-ordering QR',
    description:
      'Counts the scan and returns the branch, the QR target and whether ordering is open. Place the order with the public `POST /catalogue/orders` (`source`, `storeQrCode`). Paused or unknown → 404. Access: Public.',
  })
  @ApiResponse({ status: 404, description: 'Unknown or paused QR' })
  scan(@Param('code') code: string) {
    return this.store.scan(code);
  }
}
