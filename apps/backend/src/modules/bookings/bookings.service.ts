import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  DataSource,
  FindOptionsWhere,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { randomBytes } from 'crypto';
import { Booking, BookingStatus } from './entities/booking.entity';
import { Branch } from '../branches/entities/branch.entity';
import { CatalogueItem } from '../catalogue/entities/catalogue-item.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { normalizeOpeningHours } from '../../common/utils/business-hours.util';
import {
  AvailabilityQueryDto,
  BookingAvailabilityDto,
  BookingPageDto,
  BookingResponseDto,
  BusinessBookingsQueryDto,
  CancelBookingDto,
  CreateBookingDto,
  MyBookingsQueryDto,
  UpdateBookingStatusDto,
} from './dto/booking.dto';

const SLOT_MINUTES = 30;
const DEFAULT_WINDOW = { from: '09:00', to: '18:00' };
const DAY_KEYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

const ACTIVE_STATUSES = [BookingStatus.BOOKED, BookingStatus.CONFIRMED];

/**
 * Business-side lifecycle: confirm → check-in (completed) or cancel. Check-in
 * from `booked` is allowed directly — a walk-in confirmation is common.
 */
const BUSINESS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  [BookingStatus.BOOKED]: [
    BookingStatus.CONFIRMED,
    BookingStatus.COMPLETED,
    BookingStatus.CANCELLED,
  ],
  [BookingStatus.CONFIRMED]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
  [BookingStatus.COMPLETED]: [],
  [BookingStatus.CANCELLED]: [],
};

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(CatalogueItem)
    private readonly itemRepository: Repository<CatalogueItem>,
    private readonly dataSource: DataSource,
  ) {}

  async getAvailability(
    query: AvailabilityQueryDto,
  ): Promise<BookingAvailabilityDto> {
    const branch = await this.branchRepository.findOne({
      where: { id: query.branchId },
      relations: ['business'],
    });
    if (!branch) throw new NotFoundException('Branch not found');

    if (query.date < this.dateKey(new Date())) {
      throw new BadRequestException('Booking date cannot be in the past');
    }

    const item = await this.resolveBookableItem(query.itemId, branch);
    const durationMinutes = item
      ? this.parseDurationMinutes(item.duration)
      : SLOT_MINUTES;

    const window = this.dayWindow(branch, query.date);
    if (!window) {
      return {
        date: query.date,
        branchId: branch.id,
        itemId: item?.id ?? null,
        slotMinutes: SLOT_MINUTES,
        durationMinutes,
        isClosed: true,
        slots: [],
      };
    }

    const busy = await this.getBusyIntervals(
      branch.id,
      query.date,
      item?.id ?? null,
    );

    const openMinutes = this.minutesFromTime(window.from);
    const closeMinutes = this.minutesFromTime(window.to);
    const now = new Date();
    const isToday = query.date === this.dateKey(now);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const slots: { time: string; available: boolean }[] = [];
    for (
      let start = openMinutes;
      start + durationMinutes <= closeMinutes;
      start += SLOT_MINUTES
    ) {
      const end = start + durationMinutes;
      const clashes = busy.some(
        (interval) => start < interval.end && end > interval.start,
      );
      const inPast = isToday && start < nowMinutes;
      slots.push({
        time: this.timeFromMinutes(start),
        available: !clashes && !inPast,
      });
    }

    return {
      date: query.date,
      branchId: branch.id,
      itemId: item?.id ?? null,
      slotMinutes: SLOT_MINUTES,
      durationMinutes,
      isClosed: false,
      slots,
    };
  }

  async createBooking(
    user: User,
    dto: CreateBookingDto,
  ): Promise<BookingResponseDto> {
    const branch = await this.branchRepository.findOne({
      where: { id: dto.branchId },
      relations: ['business'],
    });
    if (!branch) throw new NotFoundException('Branch not found');

    const item = await this.resolveBookableItem(dto.itemId, branch);

    const today = this.dateKey(new Date());
    if (dto.date < today) {
      throw new BadRequestException('Booking date cannot be in the past');
    }

    const startMinutes = this.minutesFromTime(dto.time);
    if (startMinutes % SLOT_MINUTES !== 0) {
      throw new BadRequestException(
        `Bookings start on a ${SLOT_MINUTES}-minute grid`,
      );
    }

    const window = this.dayWindow(branch, dto.date);
    if (!window) {
      throw new BadRequestException('Branch is closed on this day');
    }

    const durationMinutes = item
      ? this.parseDurationMinutes(item.duration)
      : SLOT_MINUTES;
    const endMinutes = startMinutes + durationMinutes;
    if (
      startMinutes < this.minutesFromTime(window.from) ||
      endMinutes > this.minutesFromTime(window.to)
    ) {
      throw new BadRequestException('Requested time is outside business hours');
    }

    const now = new Date();
    if (
      dto.date === today &&
      startMinutes < now.getHours() * 60 + now.getMinutes()
    ) {
      throw new BadRequestException('Requested time is in the past');
    }

    const booking = await this.dataSource.transaction(async (manager) => {
      const active = await manager.find(Booking, {
        where: {
          branchId: branch.id,
          date: dto.date,
          status: In(ACTIVE_STATUSES),
        },
      });
      const relevant = item
        ? active.filter((row) => row.itemId === item.id || row.itemId === null)
        : active;
      const clash = relevant.some((row) => {
        const rowStart = this.minutesFromTime(row.time);
        return (
          startMinutes < rowStart + row.durationMinutes && endMinutes > rowStart
        );
      });
      if (clash) {
        throw new BadRequestException('Time slot is no longer available');
      }

      const created = manager.create(Booking, {
        customerId: user.id,
        businessId: branch.businessId,
        branchId: branch.id,
        itemId: item?.id ?? null,
        itemName: item?.name ?? branch.name,
        date: dto.date,
        time: dto.time,
        durationMinutes,
        status: BookingStatus.BOOKED,
        reference: this.generateReference(),
        notes: dto.notes ?? null,
      });
      return manager.save(created);
    });

    return this.toResponse(booking, {
      branchName: branch.name,
      businessName: branch.business?.name ?? null,
    });
  }

  async getMyBookings(
    userId: string,
    query: MyBookingsQueryDto,
  ): Promise<BookingPageDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const [rows, total] = await this.bookingRepository.findAndCount({
      where: {
        customerId: userId,
        ...(query.status ? { status: query.status } : {}),
      },
      relations: ['branch', 'business'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: rows.map((row) =>
        this.toResponse(row, {
          branchName: row.branch?.name ?? null,
          businessName: row.business?.name ?? null,
        }),
      ),
      total,
      page,
      limit,
    };
  }

  async getBooking(user: User, id: string): Promise<BookingResponseDto> {
    const booking = await this.findBookingOrThrow(id);
    this.assertCanAccess(user, booking);

    return this.toResponse(booking, {
      branchName: booking.branch?.name ?? null,
      businessName: booking.business?.name ?? null,
    });
  }

  /** Business-side list: branch/date/status filters over the whole business. */
  async findAllForBusiness(
    businessId: string,
    query: BusinessBookingsQueryDto,
  ): Promise<BookingPageDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;

    const where: FindOptionsWhere<Booking> = { businessId };
    if (query.status) where.status = query.status;
    if (query.branchId) where.branchId = query.branchId;

    if (query.date) {
      where.date = query.date;
    } else if (query.from && query.to) {
      where.date = Between(query.from, query.to);
    } else if (query.from) {
      where.date = MoreThanOrEqual(query.from);
    } else if (query.to) {
      where.date = LessThanOrEqual(query.to);
    }

    const [rows, total] = await this.bookingRepository.findAndCount({
      where,
      relations: ['branch', 'business', 'customer'],
      order: { date: 'ASC', time: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: rows.map((row) =>
        this.toResponse(row, {
          branchName: row.branch?.name ?? null,
          businessName: row.business?.name ?? null,
        }),
      ),
      total,
      page,
      limit,
    };
  }

  /** Business-side status change: confirm, check-in (completed) or cancel. */
  async updateStatusForBusiness(
    user: User,
    id: string,
    dto: UpdateBookingStatusDto,
  ): Promise<BookingResponseDto> {
    const booking = await this.findBookingOrThrow(id);

    if (!user.businessId || booking.businessId !== user.businessId) {
      throw new ForbiddenException('You cannot manage this booking');
    }

    const allowed = BUSINESS_TRANSITIONS[booking.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `A ${booking.status} booking cannot move to ${dto.status}`,
      );
    }

    booking.status = dto.status;
    if (dto.status === BookingStatus.CANCELLED) {
      booking.cancelledAt = new Date();
      booking.cancellationReason = dto.cancellationReason ?? null;
    }

    const saved = await this.bookingRepository.save(booking);

    return this.toResponse(saved, {
      branchName: booking.branch?.name ?? null,
      businessName: booking.business?.name ?? null,
    });
  }

  async cancelBooking(
    user: User,
    id: string,
    dto: CancelBookingDto,
  ): Promise<BookingResponseDto> {
    const booking = await this.findBookingOrThrow(id);

    if (booking.customerId !== user.id) {
      throw new ForbiddenException('You can only cancel your own bookings');
    }
    if (
      booking.status !== BookingStatus.BOOKED &&
      booking.status !== BookingStatus.CONFIRMED
    ) {
      throw new BadRequestException(
        `A ${booking.status} booking cannot be cancelled`,
      );
    }

    booking.status = BookingStatus.CANCELLED;
    booking.cancelledAt = new Date();
    booking.cancellationReason = dto.cancellationReason ?? null;
    const saved = await this.bookingRepository.save(booking);

    return this.toResponse(saved, {
      branchName: booking.branch?.name ?? null,
      businessName: booking.business?.name ?? null,
    });
  }

  // --- helpers ---

  private async resolveBookableItem(
    itemId: string | undefined,
    branch: Branch,
  ): Promise<CatalogueItem | null> {
    if (!itemId) return null;

    const item = await this.itemRepository.findOne({
      where: { id: itemId },
      relations: ['branches'],
    });
    if (!item) throw new NotFoundException('Service not found');
    if (!item.isBookable) {
      throw new BadRequestException('This service is not bookable');
    }
    if (item.bookingMethod && item.bookingMethod !== 'vemtap') {
      throw new BadRequestException(
        'This service is booked directly with the business, not in-app',
      );
    }
    if (!item.branches?.some((b) => b.id === branch.id)) {
      throw new BadRequestException(
        'This service is not available at the selected branch',
      );
    }
    return item;
  }

  private async findBookingOrThrow(id: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['branch', 'business', 'customer'],
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  private assertCanAccess(user: User, booking: Booking): void {
    if (booking.customerId === user.id) return;

    const businessRoles: UserRole[] = [
      UserRole.OWNER,
      UserRole.MANAGER,
      UserRole.STAFF,
      UserRole.ADMIN,
      UserRole.SUPER_ADMIN,
    ];
    if (
      businessRoles.includes(user.role) &&
      user.businessId === booking.businessId
    ) {
      return;
    }

    throw new ForbiddenException('You cannot access this booking');
  }

  /** Normalized open/close window for the date, or null when closed. */
  private dayWindow(
    branch: Branch,
    date: string,
  ): { from: string; to: string } | null {
    const rawHours =
      (branch.businessHours as Record<string, never> | null) ??
      (branch.business?.openingHours as Record<string, never> | null) ??
      null;
    const hours = normalizeOpeningHours(rawHours);
    const dayKey = DAY_KEYS[new Date(`${date}T00:00:00`).getDay()];
    const day = hours[dayKey];

    if (!day) return DEFAULT_WINDOW;
    if (day.isClosed) return null;
    return {
      from: day.from || DEFAULT_WINDOW.from,
      to: day.to || DEFAULT_WINDOW.to,
    };
  }

  private async getBusyIntervals(
    branchId: string,
    date: string,
    itemId: string | null,
  ): Promise<{ start: number; end: number }[]> {
    const active = await this.bookingRepository.find({
      where: { branchId, date, status: In(ACTIVE_STATUSES) },
    });
    const relevant = itemId
      ? active.filter((row) => row.itemId === itemId || row.itemId === null)
      : active;

    return relevant.map((row) => {
      const start = this.minutesFromTime(row.time);
      return { start, end: start + row.durationMinutes };
    });
  }

  private parseDurationMinutes(duration: string | null): number {
    if (!duration) return 60;
    const text = duration.toLowerCase();
    const hours = text.match(/(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours)/);
    if (hours) return Math.round(parseFloat(hours[1]) * 60);
    const minutes = text.match(/(\d+)\s*(min|mins|minute|minutes)/);
    if (minutes) return parseInt(minutes[1], 10);
    return 60;
  }

  private minutesFromTime(time: string): number {
    const [h, m] = time.split(':').map((part) => parseInt(part, 10));
    return h * 60 + m;
  }

  private timeFromMinutes(total: number): string {
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  private dateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private generateReference(): string {
    return `BK-${randomBytes(3).toString('hex').toUpperCase()}`;
  }

  private toResponse(
    booking: Booking,
    names: { branchName: string | null; businessName: string | null },
  ): BookingResponseDto {
    return {
      id: booking.id,
      reference: booking.reference,
      status: booking.status,
      date: booking.date,
      time: booking.time,
      durationMinutes: booking.durationMinutes,
      branchId: booking.branchId,
      branchName: names.branchName,
      businessName: names.businessName,
      customer: booking.customer
        ? {
            id: booking.customer.id,
            firstName: booking.customer.firstName ?? null,
            lastName: booking.customer.lastName ?? null,
            phone: booking.customer.phone ?? null,
          }
        : null,
      itemId: booking.itemId,
      itemName: booking.itemName,
      notes: booking.notes,
      cancelledAt: booking.cancelledAt,
      cancellationReason: booking.cancellationReason,
      createdAt: booking.createdAt,
    };
  }
}
