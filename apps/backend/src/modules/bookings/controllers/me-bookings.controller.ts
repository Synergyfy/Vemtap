import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { BookingsService } from '../bookings.service';
import { BookingPageDto, MyBookingsQueryDto } from '../dto/booking.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { User, UserRole } from '../../users/entities/user.entity';

interface RequestWithUser extends Request {
  user: User;
}

@ApiTags('Bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('me/bookings')
export class MeBookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  // Owners who book as customers (dual-role accounts) list their own bookings
  // too; the query is always scoped to the caller.
  @Roles(UserRole.CUSTOMER, UserRole.OWNER)
  @ApiOperation({
    summary: "List the customer's bookings",
    description:
      'Paginated list of the customer’s bookings, newest first, optionally ' +
      'filtered by `status` (booked | confirmed | completed | cancelled). ' +
      'Access: CUSTOMER, OWNER (their own bookings as a customer)',
  })
  @ApiResponse({ status: 200, type: BookingPageDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid token' })
  @ApiResponse({
    status: 403,
    description: 'Authenticated user is not a CUSTOMER',
  })
  async listMyBookings(
    @Req() req: RequestWithUser,
    @Query() query: MyBookingsQueryDto,
  ): Promise<BookingPageDto> {
    return this.bookingsService.getMyBookings(req.user.id, query);
  }
}
