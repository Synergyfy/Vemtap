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
} from '@nestjs/swagger';
import { CreditPlanService } from '../services/credit-plan.service';
import { CreateCreditPlanDto } from '../dto/create-credit-plan.dto';
import { UpdateCreditPlanDto } from '../dto/update-credit-plan.dto';
import { PurchaseCreditPlanDto } from '../dto/purchase-credit-plan.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { User, UserRole } from '../../users/entities/user.entity';
import { CreditPlan } from '../entities/credit-plan.entity';
import { BusinessCredit } from '../entities/business-credit.entity';
import { BranchFilterDto } from '../../../common/dto/branch-filter.dto';
import { BranchesService } from '../../branches/branches.service';

@ApiTags('Credit Top-up Plans')
@ApiBearerAuth()
@Controller('credit-plans')
export class CreditPlanController {
  constructor(
    private readonly creditPlanService: CreditPlanService,
    private readonly branchesService: BranchesService,
  ) { }

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

  @Get('my-credits')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current credit balance for the user context' })
  @ApiResponse({
    status: 200,
    description: 'Returns the credit balance for the resolved branch.',
    type: BusinessCredit,
  })
  async getMyCredits(
    @Request() req: any,
    @Query() filter: BranchFilterDto,
  ): Promise<BusinessCredit> {
    const branchId = await this.getBranchId(req, filter.branchId);
    return this.creditPlanService.getMyCredits(branchId);
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
      purchaseDto.branchId,
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
