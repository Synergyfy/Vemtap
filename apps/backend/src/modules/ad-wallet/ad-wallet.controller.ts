import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { AdWalletService } from './ad-wallet.service';
import { AdWalletInvoicesService } from './ad-wallet-invoices.service';
import {
  AdWalletAutoReloadDto,
  AdWalletInvoicesQueryDto,
  AdWalletSavedCardTopUpDto,
  AdWalletTopUpDto,
  AdWalletTransactionsQueryDto,
} from './dto/ad-wallet.dto';

interface AuthedRequest {
  user: { id: string; email?: string | null; businessId: string };
}

@ApiTags('Ad Wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.MANAGER)
@Controller('ad-wallet')
export class AdWalletController {
  constructor(
    private readonly walletService: AdWalletService,
    private readonly invoicesService: AdWalletInvoicesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Balance, reserved and spendable amounts' })
  getWallet(@Req() req: AuthedRequest) {
    return this.walletService.getSummary(req.user.businessId);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Wallet ledger, newest first' })
  listTransactions(
    @Req() req: AuthedRequest,
    @Query() query: AdWalletTransactionsQueryDto,
  ) {
    return this.walletService.listTransactions(req.user.businessId, query);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Invoices for launched boosts and campaigns' })
  listInvoices(
    @Req() req: AuthedRequest,
    @Query() query: AdWalletInvoicesQueryDto,
  ) {
    return this.invoicesService.list(
      req.user.businessId,
      query.page,
      query.limit,
    );
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'One invoice' })
  getInvoice(
    @Req() req: AuthedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.invoicesService.get(req.user.businessId, id);
  }

  @Get('prepacks')
  @ApiOperation({ summary: 'Top-up bundles and their bonus credit' })
  getPrepacks() {
    return this.walletService.getPrepacks();
  }

  @Post('top-up')
  @ApiOperation({
    summary: 'Start a card top-up; returns a Paystack access code / URL',
  })
  startTopUp(@Req() req: AuthedRequest, @Body() dto: AdWalletTopUpDto) {
    return this.walletService.startTopUp(req.user.businessId, req.user, dto);
  }

  @Post('top-up/saved-card')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Top up from the saved card, with no checkout',
  })
  topUpWithSavedCard(
    @Req() req: AuthedRequest,
    @Body() dto: AdWalletSavedCardTopUpDto,
  ) {
    return this.walletService.topUpWithSavedCard(
      req.user.businessId,
      req.user.id,
      dto,
    );
  }

  @Put('auto-reload')
  @ApiOperation({
    summary: 'Top up from the saved card when the balance runs low',
  })
  setAutoReload(@Req() req: AuthedRequest, @Body() dto: AdWalletAutoReloadDto) {
    return this.walletService.setAutoReload(req.user.businessId, dto);
  }

  @Delete('card')
  @ApiOperation({
    summary: 'Forget the saved card (also turns auto-reload off)',
  })
  removeCard(@Req() req: AuthedRequest) {
    return this.walletService.removeCard(req.user.businessId);
  }

  @Post('top-up/:reference/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Check a top-up with Paystack and credit it if paid (safe to repeat)',
  })
  confirmTopUp(
    @Req() req: AuthedRequest,
    @Param('reference') reference: string,
  ) {
    return this.walletService.confirmTopUp(req.user.businessId, reference);
  }
}
