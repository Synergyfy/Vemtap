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
  EntityManager,
  FindOptionsWhere,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { randomBytes } from 'crypto';
import { Booking, BookingStatus } from './entities/booking.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Business } from '../businesses/entities/business.entity';
import {
  CatalogueItem,
  ServiceBookingMethod,
} from '../catalogue/entities/catalogue-item.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { normalizeOpeningHours } from '../../common/utils/business-hours.util';
import type { BookingRules } from '../catalogue/dto/booking-rules.dto';
import {
  AvailabilityQueryDto,
  BookingAvailabilityDto,
  BookingPageDto,
  BookingMerchantDto,
  BookingResponseDto,
  BusinessBookingsQueryDto,
  CancelBookingDto,
  CreateBookingDto,
  MyBookingsQueryDto,
  RescheduleBookingDto,
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

    const rules = item?.bookingRules ?? null;
    const window = this.serviceWindow(branch, query.date, rules);
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
    const earliest = this.earliestStart(query.date, rules);

    const slots: { time: string; available: boolean }[] = [];
    for (
      let start = openMinutes;
      start + durationMinutes <= closeMinutes;
      start += SLOT_MINUTES
    ) {
      const end = start + durationMinutes;
      slots.push({
        time: this.timeFromMinutes(start),
        available: start >= earliest && this.hasRoom(busy, start, end, rules),
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
    const slot = this.assertBookableSlot(branch, item, dto.date, dto.time);
    const { durationMinutes, rules } = slot;

    const booking = await this.dataSource.transaction(async (manager) => {
      await this.assertSlotFree(manager, branch.id, item, dto.date, slot);

      const created = manager.create(Booking, {
        customerId: user.id,
        businessId: branch.businessId,
        branchId: branch.id,
        itemId: item?.id ?? null,
        itemName: item?.name ?? branch.name,
        date: dto.date,
        time: dto.time,
        durationMinutes,
        // Without manual confirmation the slot is confirmed at once.
        status:
          rules?.requiresConfirmation === false
            ? BookingStatus.CONFIRMED
            : BookingStatus.BOOKED,
        reference: this.generateReference(),
        notes: dto.notes ?? null,
      });
      return manager.save(created);
    });
    booking.branch = branch;
    booking.business = branch.business;

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

  /**
   * Moves the customer's own active booking to a new slot. The new slot goes
   * through the same checks as a new booking (hours, grid, lead time, horizon,
   * blocked days, capacity), ignoring the booking's own current slot. A
   * service that needs the business to confirm goes back to `booked`.
   */
  async rescheduleBooking(
    user: User,
    id: string,
    dto: RescheduleBookingDto,
  ): Promise<BookingResponseDto> {
    const booking = await this.findBookingOrThrow(id);
    if (booking.customerId !== user.id) {
      throw new ForbiddenException('You can only reschedule your own bookings');
    }
    if (!ACTIVE_STATUSES.includes(booking.status)) {
      throw new BadRequestException(
        `A ${booking.status} booking cannot be rescheduled`,
      );
    }
    if (booking.date === dto.date && booking.time === dto.time) {
      throw new BadRequestException('Pick a different date or time');
    }

    const branch = await this.branchRepository.findOne({
      where: { id: booking.branchId },
      relations: ['business'],
    });
    if (!branch) throw new NotFoundException('Branch not found');
    const item = booking.itemId
      ? await this.resolveBookableItem(booking.itemId, branch)
      : null;
    const slot = this.assertBookableSlot(branch, item, dto.date, dto.time);

    const saved = await this.dataSource.transaction(async (manager) => {
      await this.assertSlotFree(
        manager,
        branch.id,
        item,
        dto.date,
        slot,
        booking.id,
      );
      booking.date = dto.date;
      booking.time = dto.time;
      booking.durationMinutes = slot.durationMinutes;
      booking.status =
        slot.rules?.requiresConfirmation === false
          ? BookingStatus.CONFIRMED
          : BookingStatus.BOOKED;
      return manager.save(booking);
    });

    return this.toResponse(saved, {
      branchName: branch.name,
      businessName: branch.business?.name ?? null,
    });
  }

  /** Throws unless `date` + `time` is a slot this branch/service can take. */
  private assertBookableSlot(
    branch: Branch,
    item: CatalogueItem | null,
    date: string,
    time: string,
  ) {
    const today = this.dateKey(new Date());
    if (date < today) {
      throw new BadRequestException('Booking date cannot be in the past');
    }

    const startMinutes = this.minutesFromTime(time);
    if (startMinutes % SLOT_MINUTES !== 0) {
      throw new BadRequestException(
        `Bookings start on a ${SLOT_MINUTES}-minute grid`,
      );
    }

    const rules = item?.bookingRules ?? null;
    if (this.beyondHorizon(date, rules)) {
      throw new BadRequestException(
        `This service can be booked up to ${rules?.horizonDays} days ahead`,
      );
    }
    const blocked = this.blockout(date, rules);
    if (blocked) {
      throw new BadRequestException(
        blocked.reason
          ? `Not bookable on this day: ${blocked.reason}`
          : 'Not bookable on this day',
      );
    }
    const window = this.serviceWindow(branch, date, rules);
    if (!window) {
      throw new BadRequestException('Not bookable on this day');
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

    if (startMinutes < this.earliestStart(date, rules)) {
      throw new BadRequestException(
        rules?.leadMinutes
          ? `Book at least ${rules.leadMinutes} minutes ahead`
          : 'Requested time is in the past',
      );
    }

    return { startMinutes, endMinutes, durationMinutes, rules };
  }

  /**
   * Throws when the slot is taken. Run inside the write transaction so two
   * customers cannot both win the last place. `excludeId` leaves a booking
   * that is moving out of the way.
   */
  private async assertSlotFree(
    manager: EntityManager,
    branchId: string,
    item: CatalogueItem | null,
    date: string,
    slot: {
      startMinutes: number;
      endMinutes: number;
      rules: BookingRules | null;
    },
    excludeId?: string,
  ): Promise<void> {
    const active = await manager.find(Booking, {
      where: { branchId, date, status: In(ACTIVE_STATUSES) },
    });
    const relevant = active
      .filter((row) => row.id !== excludeId)
      .filter((row) => !item || row.itemId === item.id || row.itemId === null);
    const busy = relevant.map((row) => {
      const rowStart = this.minutesFromTime(row.time);
      return { start: rowStart, end: rowStart + row.durationMinutes };
    });
    if (!this.hasRoom(busy, slot.startMinutes, slot.endMinutes, slot.rules)) {
      throw new BadRequestException('Time slot is no longer available');
    }
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
    if (
      item.bookingMethod &&
      item.bookingMethod !== ServiceBookingMethod.VEMTAP
    ) {
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

  /**
   * The day's bookable window for a service: the branch's opening hours,
   * narrowed by the service's own days, hours and horizon. Null = closed.
   */
  private serviceWindow(
    branch: Branch,
    date: string,
    rules: BookingRules | null,
  ): { from: string; to: string } | null {
    const window = this.dayWindow(branch, date);
    if (!window || !rules) return window;
    if (this.blockout(date, rules)) return null;
    // A branch with its own schedule replaces the service-wide days/hours.
    const schedule =
      rules.branchSchedules?.find((entry) => entry.branchId === branch.id) ??
      rules;
    const weekday = new Date(`${date}T00:00:00`).getDay();
    if (schedule.days?.length && !schedule.days.includes(weekday)) return null;
    if (this.beyondHorizon(date, rules)) return null;
    const from = Math.max(
      this.minutesFromTime(window.from),
      schedule.from ? this.minutesFromTime(schedule.from) : 0,
    );
    const to = Math.min(
      this.minutesFromTime(window.to),
      schedule.to ? this.minutesFromTime(schedule.to) : 24 * 60,
    );
    if (from >= to) return null;
    return { from: this.timeFromMinutes(from), to: this.timeFromMinutes(to) };
  }

  /** The blocked-date entry for `date`, if the service is blocked that day. */
  private blockout(date: string, rules: BookingRules | null) {
    return rules?.blockouts?.find((entry) => entry.date === date);
  }

  private beyondHorizon(date: string, rules: BookingRules | null): boolean {
    if (!rules?.horizonDays) return false;
    const last = new Date();
    last.setDate(last.getDate() + rules.horizonDays);
    return date > this.dateKey(last);
  }

  /**
   * Earliest start (minutes into `date`) given the clock and the service's
   * notice period; negative when the whole day is open.
   */
  private earliestStart(date: string, rules: BookingRules | null): number {
    const now = new Date();
    const earliest = new Date(
      now.getTime() + (rules?.leadMinutes ?? 0) * 60_000,
    );
    const day = new Date(`${date}T00:00:00`);
    return Math.ceil((earliest.getTime() - day.getTime()) / 60_000);
  }

  /**
   * Whether [start, end) fits: fewer overlapping bookings than the service's
   * capacity, counting each booking's turnaround buffer.
   */
  private hasRoom(
    busy: { start: number; end: number }[],
    start: number,
    end: number,
    rules: BookingRules | null,
  ): boolean {
    const buffer = rules?.bufferMinutes ?? 0;
    const capacity = rules?.capacity ?? 1;
    const overlapping = busy.filter(
      (interval) =>
        start < interval.end + buffer && end + buffer > interval.start,
    ).length;
    return overlapping < capacity;
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

  /**
   * The branch's own details win over the business's: a booking is at a
   * branch, so its phone and address are the ones to call and travel to.
   * `null` when neither relation was loaded.
   */
  private merchantOf(
    branch?: Branch | null,
    business?: Business | null,
  ): BookingMerchantDto | null {
    if (!branch && !business) return null;
    const coordinate = (value: unknown) => {
      const parsed = value == null ? NaN : Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };
    return {
      businessCode: business?.uniqueCode ?? null,
      branchCode: branch?.uniqueCode ?? null,
      logoUrl: business?.logoUrl || branch?.logoUrl || null,
      coverImage: business?.coverImage ?? null,
      phone: branch?.phone || business?.phone || null,
      address: branch?.address || business?.address || null,
      city: branch?.city || business?.city || null,
      state: branch?.state || business?.state || null,
      latitude: coordinate(branch?.latitude ?? business?.latitude),
      longitude: coordinate(branch?.longitude ?? business?.longitude),
    };
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
            email: booking.customer.email ?? null,
            avatar: booking.customer.avatar ?? null,
          }
        : null,
      merchant: this.merchantOf(booking.branch, booking.business),
      itemId: booking.itemId,
      itemName: booking.itemName,
      notes: booking.notes,
      cancelledAt: booking.cancelledAt,
      cancellationReason: booking.cancellationReason,
      createdAt: booking.createdAt,
    };
  }
}
