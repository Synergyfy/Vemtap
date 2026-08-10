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
import { FosPlanningService } from './fos-planning.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { FosEnvelope } from '../../common/decorators/fos-envelope.decorator';
import { UserRole } from '../users/entities/user.entity';
import {
  CreateBudgetItemDto,
  UpdateBudgetItemDto,
  CreateBudgetCategoryDto,
  CreateAspectDto,
  UpdateAspectDto,
} from './dto/planning.dto';

@ApiTags('FOS Planning')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@FosEnvelope()
@Controller()
export class FosPlanningController {
  constructor(private readonly planningService: FosPlanningService) {}

  // ---- Budget items ----

  @Get('budget-items')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List budget items, categories, and totals' })
  async getBudgetItems() {
    return this.planningService.getBudgetItems();
  }

  @Post('budget-items')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a budget item' })
  async createBudgetItem(@Body() dto: CreateBudgetItemDto) {
    return this.planningService.createBudgetItem(dto);
  }

  @Patch('budget-items/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a budget item' })
  async updateBudgetItem(
    @Param('id') id: string,
    @Body() dto: UpdateBudgetItemDto,
  ) {
    return this.planningService.updateBudgetItem(id, dto);
  }

  @Delete('budget-items/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a budget item' })
  async removeBudgetItem(@Param('id') id: string) {
    return this.planningService.removeBudgetItem(id);
  }

  // ---- Budget categories ----

  @Post('budget-categories')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a budget category' })
  async createCategory(@Body() dto: CreateBudgetCategoryDto) {
    return this.planningService.createCategory(dto);
  }

  @Delete('budget-categories/:name')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a budget category' })
  async removeCategory(@Param('name') name: string) {
    return this.planningService.removeCategory(name);
  }

  // ---- Forecast aspects ----

  @Get('forecast-aspects')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List forecast aspects' })
  async getAspects() {
    return this.planningService.getAspects();
  }

  @Post('forecast-aspects')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a forecast aspect' })
  async createAspect(@Body() dto: CreateAspectDto) {
    return this.planningService.createAspect(dto);
  }

  @Patch('forecast-aspects/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a forecast aspect' })
  async updateAspect(@Param('id') id: string, @Body() dto: UpdateAspectDto) {
    return this.planningService.updateAspect(id, dto);
  }

  @Delete('forecast-aspects/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a forecast aspect' })
  async removeAspect(@Param('id') id: string) {
    return this.planningService.removeAspect(id);
  }
}
