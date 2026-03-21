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
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { CreditService } from '../services/credit.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';
import { Channel } from '../enums/channel.enum';
import { CreditTransactionType } from '../enums/credit-transaction-type.enum';
import { AdjustCreditsDto } from '../dto/adjust-credits.dto';
import { BusinessIdDto } from '../dto/business-id.dto';

@ApiTags('Messaging Credits')
@ApiBearerAuth()
@Controller('credits')
export class CreditController {
  constructor(private readonly creditService: CreditService) {}

  @Get('balance')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Get current messaging credit balance (Business Dashboard)',
    description: 'Retrieves the total available messaging credits for the authenticated user\'s business. Access: Authenticated users with a business profile'
  })
  @ApiResponse({ status: 200, description: 'Credit balance retrieved successfully' })
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
  @ApiOperation({ 
    summary: 'Get credit balance for a specific business (Admin Dashboard)',
    description: 'Retrieves the credit balance for any business. Access: ADMIN'
  })
  @ApiParam({ name: 'businessId', description: 'The UUID of the business' })
  @ApiResponse({ status: 200, description: 'Business credit balance retrieved successfully' })
  async getBusinessBalance(@Param() { businessId }: BusinessIdDto) {
    return this.creditService.getOrCreateWallet(businessId);
  }

  @Post('adjust')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Manually adjust business credits (Admin Dashboard)',
    description: 'Allows an administrator to manually add or deduct messaging credits from a business wallet. Access: ADMIN'
  })
  @ApiBody({ type: AdjustCreditsDto })
  @ApiResponse({ status: 201, description: 'Credits adjusted successfully' })
  async adjustCredits(
    @Body()
    dto: AdjustCreditsDto,
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

