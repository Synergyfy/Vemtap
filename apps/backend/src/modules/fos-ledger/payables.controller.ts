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
import { CreateBillDto, UpdateBillDto } from './dto/ledger.dto';

@ApiTags('FOS Payables')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@FosEnvelope()
@Controller('payables')
export class FosPayablesController {
  constructor(private readonly ledgerService: FosLedgerService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get payables (bills) summary' })
  async getPayables() {
    return this.ledgerService.getPayables();
  }

  @Post('bills')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a bill' })
  async createBill(@Body() dto: CreateBillDto) {
    return this.ledgerService.createBill(dto);
  }

  @Patch('bills/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a bill' })
  async updateBill(@Param('id') id: string, @Body() dto: UpdateBillDto) {
    return this.ledgerService.updateBill(id, dto);
  }

  @Delete('bills/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a bill' })
  async removeBill(@Param('id') id: string) {
    return this.ledgerService.removeBill(id);
  }
}
