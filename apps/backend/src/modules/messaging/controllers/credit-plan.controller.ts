import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CreditPlanService } from '../services/credit-plan.service';
import { CreateCreditPlanDto } from '../dto/create-credit-plan.dto';
import { UpdateCreditPlanDto } from '../dto/update-credit-plan.dto';
import { PurchaseCreditPlanDto } from '../dto/purchase-credit-plan.dto';
import { PurchaseCustomCreditsDto } from '../dto/purchase-custom-credits.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { User, UserRole } from '../../users/entities/user.entity';
import { CreditPlan } from '../entities/credit-plan.entity';
import { BusinessCreditWallet } from '../entities/business-credit-wallet.entity';
import { BranchFilterDto } from '../../../common/dto/branch-filter.dto';
import { BranchesService } from '../../branches/branches.service';
import { IdDto } from '../dto/id.dto';

@ApiTags('Credit Top-up Plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('credit-plans')
export class CreditPlanController {
  constructor(
    private readonly creditPlanService: CreditPlanService,
    private readonly branchesService: BranchesService,
  ) {}

  private async getBranchId(req: any, queryBranchId?: string): Promise<string> {
    const user = req.user as User;

    // For Owner and Admin: branchId CAN be provided, but fallback to business default if missing
    if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
      if (!queryBranchId) {
        // Fallback to the first branch of the business
        const branches = await this.branchesService.findAll(user.businessId);
        if (branches.length === 0) {
          throw new BadRequestException('No branches found for this business');
        }
        return branches[0].id;
      }

      if (user.role === UserRole.OWNER) {
        const hasAccess = await this.branchesService.checkBranchAccess(
          user,
          queryBranchId,
        );
        if (!hasAccess) {
          throw new BadRequestException(
            'You do not have access to this branch',
          );
        }
      }
      return queryBranchId;
    }

    // For Manager and Staff: ignore provided branchId, always use branchId from token
    if (!user.branchId) {
      throw new BadRequestException('User is not associated with any branch');
    }

    return user.branchId;
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create a new credit top-up plan (Admin only)',
    description:
      'Creates a new plan for purchasing messaging credits. Access: ADMIN',
  })
  @ApiBody({ type: CreateCreditPlanDto })
  @ApiResponse({
    status: 201,
    description: 'The credit plan has been successfully created.',
    type: CreditPlan,
  })
  create(@Body() createCreditPlanDto: CreateCreditPlanDto) {
    return this.creditPlanService.create(createCreditPlanDto);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get all active credit plans',
    description:
      'Retrieves all available credit top-up plans. Access: Authenticated users.',
  })
  @ApiResponse({
    status: 200,
    description: 'Return all active credit plans.',
    type: [CreditPlan],
  })
  findAll() {
    return this.creditPlanService.findAll();
  }

  @Get('my-credits')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get current credit balance for the user context',
    description:
      'Retrieves the messaging credit balance for the business associated with the current user. Access: Authenticated users',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the credit balance for the business.',
    type: BusinessCreditWallet,
  })
  async getMyCredits(@Request() req: any): Promise<BusinessCreditWallet> {
    const businessId = (req.user as User).businessId;
    if (!businessId) {
      throw new BadRequestException('No business associated with this user');
    }
    return this.creditPlanService.getMyCredits(businessId);
  }

  @Get('rates')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get active per-credit rates for calculations',
    description: 'Retrieves SMS, WhatsApp, and Email credit purchase rates.',
  })
  async getRates() {
    return this.creditPlanService.getRates();
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get a specific credit plan detail',
    description:
      'Fetches details of a single credit top-up plan. Access: Authenticated users',
  })
  @ApiParam({ name: 'id', description: 'Credit plan UUID' })
  @ApiResponse({
    status: 200,
    description: 'Return the credit plan details.',
    type: CreditPlan,
  })
  @ApiResponse({ status: 404, description: 'Credit plan not found.' })
  findOne(@Param() { id }: IdDto) {
    return this.creditPlanService.findOne(id);
  }

  @Post('custom/purchase')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Purchase custom credits',
    description:
      'Confirms payment and awards custom quantities of SMS, WhatsApp, and Email credits. Access: Authenticated users',
  })
  @ApiBody({ type: PurchaseCustomCreditsDto })
  @ApiResponse({
    status: 200,
    description:
      'The custom credits have been successfully purchased and awarded.',
    type: BusinessCreditWallet,
  })
  @ApiResponse({
    status: 400,
    description: 'Payment verification failed or insufficient amount.',
  })
  purchaseCustom(@Body() customPurchaseDto: PurchaseCustomCreditsDto) {
    return this.creditPlanService.purchaseCustom(
      customPurchaseDto.branchId,
      customPurchaseDto.reference,
      customPurchaseDto.smsAmount,
      customPurchaseDto.whatsappAmount,
      customPurchaseDto.emailAmount,
      customPurchaseDto.aiAmount || 0,
    );
  }

  @Post(':id/purchase')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Purchase a credit plan top-up',
    description:
      'Confirms a purchase and awards credits to a branch wallet using a payment reference. Access: Authenticated users',
  })
  @ApiParam({ name: 'id', description: 'Credit plan UUID' })
  @ApiBody({ type: PurchaseCreditPlanDto })
  @ApiResponse({
    status: 200,
    description:
      'The credit plan has been successfully purchased and credits awarded.',
    type: BusinessCreditWallet,
  })
  @ApiResponse({
    status: 400,
    description: 'Payment verification failed or insufficient amount.',
  })
  purchase(@Param() { id }: IdDto, @Body() purchaseDto: PurchaseCreditPlanDto) {
    return this.creditPlanService.purchase(
      purchaseDto.branchId,
      id,
      purchaseDto.reference,
    );
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update a credit plan (Admin only)',
    description: 'Modifies an existing credit top-up plan. Access: ADMIN',
  })
  @ApiParam({ name: 'id', description: 'Credit plan UUID' })
  @ApiBody({ type: UpdateCreditPlanDto })
  @ApiResponse({
    status: 200,
    description: 'The credit plan has been successfully updated.',
    type: CreditPlan,
  })
  update(
    @Param() { id }: IdDto,
    @Body() updateCreditPlanDto: UpdateCreditPlanDto,
  ) {
    return this.creditPlanService.update(id, updateCreditPlanDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Deactivate a credit plan (Admin only)',
    description:
      'Permanently removes/deactivates a credit top-up plan. Access: ADMIN',
  })
  @ApiParam({ name: 'id', description: 'Credit plan UUID' })
  @ApiResponse({
    status: 200,
    description: 'The credit plan has been successfully deactivated.',
  })
  remove(@Param() { id }: IdDto) {
    return this.creditPlanService.remove(id);
  }
}
