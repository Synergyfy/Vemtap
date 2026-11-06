import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import {
  PosKitchenQueryDto,
  PosKitchenStreamDto,
  UpdateKitchenOrderStatusDto,
} from './dto/pos-kitchen.dto';
import { PosKitchenService } from './pos-kitchen.service';

interface RequestWithUser extends Request {
  user: User;
}

@ApiTags('POS Kitchen')
@ApiBearerAuth()
@Controller('pos/kitchen')
export class PosKitchenController {
  constructor(private readonly kitchenService: PosKitchenService) {}

  @Get('orders')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({
    summary: 'Kitchen stream',
    description:
      "Today's orders for a branch (new, processing, ready, completed) with lines, table, guest, paid flag and age, plus stage counts, average new→ready minutes and the unpaid total. Live: pos socket namespace, events order.created and order.status. Access: OWNER, MANAGER, ADMIN, STAFF.",
  })
  @ApiResponse({ status: 200, type: PosKitchenStreamDto })
  @ApiResponse({ status: 404, description: 'Branch not in this business' })
  stream(@Query() query: PosKitchenQueryDto, @Req() req: RequestWithUser) {
    return this.kitchenService.stream(req.user, query);
  }

  @Patch('orders/:id/status')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({
    summary: 'Move a kitchen order to the next stage',
    description:
      'new → processing → ready → completed (new may skip to ready), or cancelled while open. Uses the same order logic as the orders hub. Access: OWNER, MANAGER, ADMIN, STAFF.',
  })
  @ApiResponse({ status: 400, description: 'Not an allowed transition' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateKitchenOrderStatusDto,
    @Req() req: RequestWithUser,
  ) {
    return this.kitchenService.updateStatus(req.user, id, dto);
  }
}
