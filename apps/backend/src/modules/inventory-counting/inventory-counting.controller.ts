import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryCountingService } from './inventory-counting.service';
import { CreateCountSessionDto } from './dto/create-count-session.dto';
import { AddCountItemsDto, UpdateCountItemDto } from './dto/add-count-item.dto';
import { CompleteCountDto } from './dto/complete-count.dto';
import {
  ApproveVarianceDto,
  RejectVarianceDto,
} from './dto/approve-variance.dto';
import { CountSessionQueryDto } from './dto/count-session-query.dto';
import { StockMovementService } from './stock-movement.service';
import { User, UserRole } from '../users/entities/user.entity';
import { Roles } from '../../common/decorators/roles.decorator';

interface RequestWithUser extends Request {
  user: User;
}

@ApiTags('Inventory Counting')
@ApiBearerAuth()
@Controller('inventory/counting')
export class InventoryCountingController {
  constructor(
    private readonly countingService: InventoryCountingService,
    private readonly stockMovementService: StockMovementService,
  ) {}

  @Get('movements')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'List stock movements for the current business' })
  async listMovements(
    @Query('branchId') branchId: string | undefined,
    @Query('itemId') itemId: string | undefined,
    @Query('page') page: number | undefined,
    @Query('limit') limit: number | undefined,
    @Req() req: RequestWithUser,
  ) {
    return this.stockMovementService.list(req.user.businessId, {
      branchId,
      itemId,
      page,
      limit,
    });
  }

  @Post('sessions')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Create a new stock count session' })
  async createSession(
    @Body() dto: CreateCountSessionDto,
    @Req() req: RequestWithUser,
  ) {
    return this.countingService.createSession(dto, req.user);
  }

  @Get('sessions')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'List count sessions with filters' })
  async listSessions(
    @Query() query: CountSessionQueryDto,
    @Req() req: RequestWithUser,
  ) {
    return this.countingService.listSessions(req.user.businessId, query);
  }

  @Get('sessions/:id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get count session details' })
  async getSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ) {
    return this.countingService.getSession(id, req.user.businessId, req.user);
  }

  @Post('sessions/:id/start')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Start a count session' })
  async startSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ) {
    return this.countingService.startSession(id, req.user.businessId, req.user);
  }

  @Post('sessions/:id/items')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Add or update count items in a session' })
  async addItems(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddCountItemsDto,
    @Req() req: RequestWithUser,
  ) {
    return this.countingService.addItems(id, req.user.businessId, dto);
  }

  @Patch('sessions/:id/items/:itemId')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Update a single count item quantity' })
  async updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateCountItemDto,
    @Req() req: RequestWithUser,
  ) {
    return this.countingService.updateItem(
      id,
      itemId,
      req.user.businessId,
      dto,
    );
  }

  @Post('sessions/:id/complete')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Complete a count session and compute variances' })
  async completeSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteCountDto,
    @Req() req: RequestWithUser,
  ) {
    return this.countingService.completeSession(
      id,
      req.user.businessId,
      req.user,
      dto,
    );
  }

  @Get('sessions/:id/reconciliation')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get reconciliation report for a session' })
  async getReconciliation(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ) {
    return this.countingService.getReconciliationReport(
      id,
      req.user.businessId,
    );
  }

  @Post('sessions/:id/approve')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Approve count variances and update stock' })
  async approveSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveVarianceDto,
    @Req() req: RequestWithUser,
  ) {
    return this.countingService.approveSession(
      id,
      req.user.businessId,
      req.user,
      dto,
    );
  }

  @Post('sessions/:id/reject')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Reject count variances' })
  async rejectSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectVarianceDto,
    @Req() req: RequestWithUser,
  ) {
    return this.countingService.rejectSession(
      id,
      req.user.businessId,
      req.user,
      dto,
    );
  }
}
