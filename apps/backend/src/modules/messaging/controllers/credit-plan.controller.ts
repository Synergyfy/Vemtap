import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { CreditPlanService } from '../services/credit-plan.service';
import { CreateCreditPlanDto } from '../dto/create-credit-plan.dto';
import { UpdateCreditPlanDto } from '../dto/update-credit-plan.dto';
import { PurchaseCreditPlanDto } from '../dto/purchase-credit-plan.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';
import { CreditPlan } from '../entities/credit-plan.entity';
import { BusinessCredit } from '../entities/business-credit.entity';

@ApiTags('Credit Top-up Plans')
@ApiBearerAuth()
@Controller('credit-plans')
export class CreditPlanController {
  constructor(private readonly creditPlanService: CreditPlanService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new credit top-up plan (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'The credit plan has been successfully created.',
    type: CreditPlan,
  })
  create(@Body() createCreditPlanDto: CreateCreditPlanDto) {
    return this.creditPlanService.create(createCreditPlanDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active credit plans' })
  @ApiResponse({
    status: 200,
    description: 'Return all active credit plans.',
    type: [CreditPlan],
  })
  findAll() {
    return this.creditPlanService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific credit plan detail' })
  @ApiResponse({
    status: 200,
    description: 'Return the credit plan details.',
    type: CreditPlan,
  })
  @ApiResponse({ status: 404, description: 'Credit plan not found.' })
  findOne(@Param('id') id: string) {
    return this.creditPlanService.findOne(id);
  }

  @Post(':id/purchase')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Purchase a credit plan top-up' })
  @ApiBody({ type: PurchaseCreditPlanDto })
  @ApiResponse({
    status: 200,
    description:
      'The credit plan has been successfully purchased and credits awarded.',
    type: BusinessCredit,
  })
  @ApiResponse({
    status: 400,
    description: 'Payment verification failed or insufficient amount.',
  })
  purchase(
    @Param('id') id: string,
    @Body() purchaseDto: PurchaseCreditPlanDto,
  ) {
    return this.creditPlanService.purchase(
      purchaseDto.businessId,
      id,
      purchaseDto.reference,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a credit plan (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'The credit plan has been successfully updated.',
    type: CreditPlan,
  })
  update(
    @Param('id') id: string,
    @Body() updateCreditPlanDto: UpdateCreditPlanDto,
  ) {
    return this.creditPlanService.update(id, updateCreditPlanDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate a credit plan (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'The credit plan has been successfully deactivated.',
  })
  remove(@Param('id') id: string) {
    return this.creditPlanService.remove(id);
  }
}
