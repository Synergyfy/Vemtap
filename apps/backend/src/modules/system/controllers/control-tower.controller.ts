import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';
import { ControlTowerService } from '../services/control-tower.service';
import {
  BusinessSearchFilterDto,
  BusinessSudoActionDto,
  CustomerSearchFilterDto,
  CustomerSudoActionDto,
} from '../dto/control-tower.dto';
import {
  BusinessControlRecord,
  CustomerControlRecord,
  SudoActionResponse,
} from '../interfaces/control-tower.interface';

@ApiTags('Admin Control Tower')
@Controller('admin/control-tower')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class ControlTowerController {
  constructor(private readonly controlTowerService: ControlTowerService) {}

  @Get('businesses')
  @ApiOperation({ summary: 'Search and list businesses for override' })
  @ApiResponse({ status: 200, type: [BusinessControlRecord] })
  async searchBusinesses(
    @Query() filter: BusinessSearchFilterDto,
  ): Promise<BusinessControlRecord[]> {
    return this.controlTowerService.searchBusinesses(filter);
  }

  @Post('businesses/sudo')
  @ApiOperation({ summary: 'Execute admin sudo action on a business' })
  @ApiBody({ type: BusinessSudoActionDto })
  @ApiResponse({ status: 200, type: SudoActionResponse })
  async executeBusinessSudoAction(
    @Body() dto: BusinessSudoActionDto,
  ): Promise<SudoActionResponse> {
    return this.controlTowerService.executeBusinessSudoAction(dto);
  }

  @Get('customers')
  @ApiOperation({ summary: 'Search and list customers for override' })
  @ApiResponse({ status: 200, type: [CustomerControlRecord] })
  async searchCustomers(
    @Query() filter: CustomerSearchFilterDto,
  ): Promise<CustomerControlRecord[]> {
    return this.controlTowerService.searchCustomers(filter);
  }

  @Post('customers/sudo')
  @ApiOperation({ summary: 'Execute admin sudo action on a customer' })
  @ApiBody({ type: CustomerSudoActionDto })
  @ApiResponse({ status: 200, type: SudoActionResponse })
  async executeCustomerSudoAction(
    @Body() dto: CustomerSudoActionDto,
  ): Promise<SudoActionResponse> {
    return this.controlTowerService.executeCustomerSudoAction(dto);
  }
}
