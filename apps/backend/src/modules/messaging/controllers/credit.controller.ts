import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { CreditService } from '../services/credit.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';
import { Channel } from '../enums/channel.enum';
import { CreditTransactionType } from '../enums/credit-transaction-type.enum';

@ApiTags('Messaging Credits')
@ApiBearerAuth()
@Controller('credits')
export class CreditController {
  constructor(private readonly creditService: CreditService) {}

  @Get('balance')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current messaging credit balance (Business Dashboard)' })
  async getBalance(@Request() req: any) {
    const businessId = req.user.businessId;
    if (!businessId) {
      throw new BadRequestException('No business associated with this user');
    }
    return this.creditService.getOrCreateWallet(businessId);
  }

  @Get('business/:businessId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get credit balance for a specific business (Admin Dashboard)' })
  async getBusinessBalance(@Param('businessId') businessId: string) {
    return this.creditService.getOrCreateWallet(businessId);
  }

  @Post('adjust')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Manually adjust business credits (Admin Dashboard)' })
  async adjustCredits(
    @Body()
    dto: {
      businessId: string;
      channel: Channel;
      amount: number;
      action: 'add' | 'remove';
    },
  ) {
    const { businessId, channel, amount, action } = dto;
    
    if (action === 'add') {
      await this.creditService.addCredits(
        businessId,
        channel,
        amount,
        CreditTransactionType.ADMIN_ADJUSTMENT,
        'Manual Admin Adjustment',
      );
    } else {
      await this.creditService.deductCredits(
        businessId,
        channel,
        amount,
        'Manual Admin Adjustment',
      );
    }

    return { success: true };
  }
}
