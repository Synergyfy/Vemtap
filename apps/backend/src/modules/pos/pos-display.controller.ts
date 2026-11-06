import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
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
  ClearPosDisplayQueryDto,
  PosDisplayTipRatingDto,
  PutPosDisplayTicketDto,
} from './dto/pos-display.dto';
import { PosDisplayService } from './pos-display.service';

interface RequestWithUser extends Request {
  user: User;
}

const STAFF = [
  UserRole.OWNER,
  UserRole.MANAGER,
  UserRole.ADMIN,
  UserRole.STAFF,
];

@ApiTags('POS Customer Display')
@ApiBearerAuth()
@Controller('pos/display')
export class PosDisplayController {
  constructor(private readonly displayService: PosDisplayService) {}

  @Get(':tillId')
  @Roles(...STAFF)
  @ApiOperation({
    summary: 'Customer display state for a till',
    description:
      'Venue, enabled payment methods, transfer details, the current ticket (or null) and tip options. Live: pos socket namespace, send till.join then listen for ticket.updated, ticket.cleared, payment.completed, display.tip. Access: OWNER, MANAGER, ADMIN, STAFF.',
  })
  @ApiResponse({ status: 404, description: 'Till not found' })
  get(
    @Param('tillId', ParseUUIDPipe) tillId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.displayService.get(req.user.businessId, tillId);
  }

  @Put(':tillId/ticket')
  @Roles(...STAFF)
  @ApiOperation({
    summary: 'Show the current ticket on the customer display',
    description:
      'The till pushes its lines; the server prices them with the POS settings and broadcasts ticket.updated. Access: OWNER, MANAGER, ADMIN, STAFF.',
  })
  putTicket(
    @Param('tillId', ParseUUIDPipe) tillId: string,
    @Body() dto: PutPosDisplayTicketDto,
    @Req() req: RequestWithUser,
  ) {
    return this.displayService.putTicket(req.user.businessId, tillId, dto);
  }

  @Delete(':tillId/ticket')
  @Roles(...STAFF)
  @ApiOperation({
    summary: 'Clear the customer display',
    description:
      'Broadcasts payment.completed when saleId is given (thank-you screen), else ticket.cleared. Access: OWNER, MANAGER, ADMIN, STAFF.',
  })
  clearTicket(
    @Param('tillId', ParseUUIDPipe) tillId: string,
    @Query() query: ClearPosDisplayQueryDto,
    @Req() req: RequestWithUser,
  ) {
    return this.displayService.clearTicket(
      req.user.businessId,
      tillId,
      query.saleId,
    );
  }

  @Post(':tillId/tip-rating')
  @Roles(...STAFF)
  @ApiOperation({
    summary: 'Record the tip and rating chosen on the display',
    description:
      'Saved on the sale when saleId is given and broadcast as display.tip to the till. Access: OWNER, MANAGER, ADMIN, STAFF.',
  })
  @ApiResponse({ status: 404, description: 'Till or sale not found' })
  tipRating(
    @Param('tillId', ParseUUIDPipe) tillId: string,
    @Body() dto: PosDisplayTipRatingDto,
    @Req() req: RequestWithUser,
  ) {
    return this.displayService.tipRating(req.user.businessId, tillId, dto);
  }
}
