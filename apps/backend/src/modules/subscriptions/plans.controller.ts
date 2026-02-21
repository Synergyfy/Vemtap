import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Query,
} from '@nestjs/common';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { Plan } from './entities/plan.entity';

@ApiTags('Plans (Admin Pricing Page)')
@Controller('plans')
export class PlansController {
    constructor(private readonly plansService: PlansService) { }

    @Post('admin')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Create a new pricing plan (Admin only)' })
    @ApiResponse({ status: 201, description: 'Plan successfully created', type: Plan })
    create(@Body() createPlanDto: CreatePlanDto) {
        return this.plansService.create(createPlanDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all pricing plans' })
    @ApiQuery({ name: 'onlyActive', required: false, type: Boolean })
    @ApiResponse({ status: 200, description: 'Return all plans', type: [Plan] })
    findAll(@Query('onlyActive') onlyActive?: string) {
        const isOnlyActive = onlyActive === 'true';
        return this.plansService.findAll(isOnlyActive);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a pricing plan by ID' })
    @ApiResponse({ status: 200, description: 'Return plan details', type: Plan })
    findOne(@Param('id') id: string) {
        return this.plansService.findOne(id);
    }

    @Patch('admin/:id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Update an existing pricing plan (Admin only)' })
    @ApiResponse({ status: 200, description: 'Plan successfully updated', type: Plan })
    update(@Param('id') id: string, @Body() updatePlanDto: UpdatePlanDto) {
        return this.plansService.update(id, updatePlanDto);
    }

    @Delete('admin/:id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Delete a pricing plan (Admin only)' })
    @ApiResponse({ status: 200, description: 'Plan successfully deleted' })
    remove(@Param('id') id: string) {
        return this.plansService.remove(id);
    }
}
