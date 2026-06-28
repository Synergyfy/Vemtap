import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FosPnlService } from './fos-pnl.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ListExpensesQueryDto } from './dto/list-expenses-query.dto';

@ApiTags('FOS Expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly pnlService: FosPnlService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'List expenses with pagination and optional category filter',
  })
  async listExpenses(@Query() query: ListExpensesQueryDto) {
    return this.pnlService.listExpenses(query);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create an expense and auto-insert cash flow OUTFLOW record',
  })
  async createExpense(@Body() dto: CreateExpenseDto) {
    return this.pnlService.createExpense(dto);
  }
}
