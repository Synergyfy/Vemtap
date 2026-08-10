import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FosLedgerService } from './fos-ledger.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { FosEnvelope } from '../../common/decorators/fos-envelope.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/ledger.dto';

@ApiTags('FOS Receivables')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@FosEnvelope()
@Controller('receivables')
export class FosReceivablesController {
  constructor(private readonly ledgerService: FosLedgerService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get receivables (invoices) summary' })
  async getReceivables() {
    return this.ledgerService.getReceivables();
  }

  @Post('invoices')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create an invoice' })
  async createInvoice(@Body() dto: CreateInvoiceDto) {
    return this.ledgerService.createInvoice(dto);
  }

  @Patch('invoices/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update an invoice' })
  async updateInvoice(@Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
    return this.ledgerService.updateInvoice(id, dto);
  }

  @Delete('invoices/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete an invoice' })
  async removeInvoice(@Param('id') id: string) {
    return this.ledgerService.removeInvoice(id);
  }
}
