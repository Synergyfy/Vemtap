import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import {
  AvailabilityQueryDto,
  BookingAvailabilityDto,
  BookingPageDto,
  BookingResponseDto,
  BusinessBookingsQueryDto,
  CancelBookingDto,
  CreateBookingDto,
  UpdateBookingStatusDto,
} from './dto/booking.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { User, UserRole } from '../users/entities/user.entity';

interface RequestWithUser extends Request {
  user: User;
}

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Public()
  @Get('availability')
  @ApiOperation({
    summary: 'Available booking slots for a branch and date (Public)',
    description:
      'Generates 30-minute slots inside the branch’s opening hours for the ' +
      'given date, marking slots blocked by active bookings or already in the ' +
      'past. Closed days return `isClosed: true` with no slots.',
  })
  @ApiResponse({ status: 200, type: BookingAvailabilityDto })
  @ApiResponse({ status: 404, description: 'Branch (or service) not found' })
  async getAvailability(
    @Query() query: AvailabilityQueryDto,
  ): Promise<BookingAvailabilityDto> {
    return this.bookingsService.getAvailability(query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({
    summary: 'Book an appointment/table for a branch',
    description:
      'Creates a BOOKED booking on the 30-minute grid. Validates the service ' +
      'is bookable in-app and available at the branch, the slot is inside ' +
      'opening hours and not already taken. Access: CUSTOMER',
  })
  @ApiResponse({ status: 201, type: BookingResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Invalid service, time or slot clash',
  })
  @ApiResponse({ status: 404, description: 'Branch or service not found' })
  async createBooking(
    @Req() req: RequestWithUser,
    @Body() dto: CreateBookingDto,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.createBooking(req.user, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF, UserRole.ADMIN)
  @ApiOperation({
    summary: 'List bookings for the current business',
    description:
      'Paginated business bookings, optionally filtered by branch, status and ' +
      'date (exact `date`, or a `from`/`to` range). Access: OWNER/MANAGER/STAFF.',
  })
  @ApiResponse({ status: 200, type: BookingPageDto })
  async listBusinessBookings(
    @Req() req: RequestWithUser,
    @Query() query: BusinessBookingsQueryDto,
  ): Promise<BookingPageDto> {
    if (!req.user.businessId) {
      throw new BadRequestException('User is not associated with a business');
    }
    return this.bookingsService.findAllForBusiness(req.user.businessId, query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  @Roles(
    UserRole.CUSTOMER,
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.STAFF,
    UserRole.ADMIN,
  )
  @ApiOperation({
    summary: 'Get a booking by id',
    description:
      'Accessible to the booking customer or staff of the owning business ' +
      '(403 otherwise).',
  })
  @ApiResponse({ status: 200, type: BookingResponseDto })
  @ApiResponse({ status: 403, description: 'Not the customer or the business' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async getBooking(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.getBooking(req.user, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id/cancel')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({
    summary: 'Cancel your booking',
    description:
      'Only the booking’s customer can cancel, and only while the booking is ' +
      '`booked` or `confirmed`. Access: CUSTOMER',
  })
  @ApiResponse({ status: 200, type: BookingResponseDto })
  @ApiResponse({ status: 400, description: 'Booking is no longer cancellable' })
  @ApiResponse({ status: 403, description: 'Not your booking' })
  async cancelBooking(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelBookingDto,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.cancelBooking(req.user, id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id/status')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update a booking’s status (business side)',
    description:
      'Confirm, check-in (completed) or cancel a booking for the current ' +
      'business. Transitions: booked → confirmed/completed/cancelled; ' +
      'confirmed → completed/cancelled. Access: OWNER/MANAGER/STAFF.',
  })
  @ApiResponse({ status: 200, type: BookingResponseDto })
  @ApiResponse({ status: 400, description: 'Illegal status transition' })
  @ApiResponse({ status: 403, description: 'Not the owning business' })
  async updateBookingStatus(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBookingStatusDto,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.updateStatusForBusiness(req.user, id, dto);
  }
}
