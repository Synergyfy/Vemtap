import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FosBudgetsService } from './fos-budgets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { FosEnvelope } from '../../common/decorators/fos-envelope.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateBudgetDto, ForecastsQueryDto } from './dto/budget.dto';

@ApiTags('FOS Budgets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@FosEnvelope()
@Controller('budgets')
export class FosBudgetsController {
  constructor(private readonly budgetsService: FosBudgetsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List budgets with achievement percentages' })
  async listBudgets() {
    return this.budgetsService.findAll();
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new budget' })
  async createBudget(
    @Body() dto: CreateBudgetDto,
    @Request() req: { user?: User },
  ) {
    return this.budgetsService.create(dto, req.user?.id);
  }

  @Get('forecasts')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List saved forecast scenarios' })
  async listForecasts() {
    return this.budgetsService.getForecasts();
  }
}
