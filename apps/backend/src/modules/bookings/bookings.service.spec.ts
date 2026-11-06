import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingStatus } from './entities/booking.entity';
import { UserRole } from '../users/entities/user.entity';

const baseBooking = {
  id: 'bk-1',
  reference: 'BK-ABC123',
  status: BookingStatus.BOOKED,
  date: '2026-10-20',
  time: '14:30',
  durationMinutes: 60,
  branchId: 'br-1',
  businessId: 'biz-1',
  customerId: 'cust-1',
  itemId: null,
  itemName: 'Private Event Catering',
  notes: null,
  cancelledAt: null,
  cancellationReason: null,
  createdAt: new Date('2026-10-08T10:00:00Z'),
  branch: { id: 'br-1', name: 'Main Branch' },
  business: { id: 'biz-1', name: 'The Azure Bistro' },
  customer: {
    id: 'cust-1',
    firstName: 'Amina',
    lastName: 'Bello',
    phone: '+2348032198831',
  },
};

function build(overrides: Record<string, jest.Mock> = {}) {
  const bookingRepository = {
    findAndCount: jest.fn().mockResolvedValue([[baseBooking], 1]),
    findOne: jest.fn().mockResolvedValue({ ...baseBooking }),
    save: jest.fn().mockImplementation((row) => Promise.resolve(row)),
    ...overrides,
  };
  const service = new BookingsService(
    bookingRepository as never,
    {} as never,
    {} as never,
    {} as never,
  );
  return { service, bookingRepository };
}

describe('BookingsService business endpoints', () => {
  it('scopes the business list to the business, branch, date and status', async () => {
    const { service, bookingRepository } = build();

    const page = await service.findAllForBusiness('biz-1', {
      branchId: 'br-1',
      date: '2026-10-20',
      status: BookingStatus.CONFIRMED,
      page: 1,
      limit: 50,
    });

    expect(bookingRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          businessId: 'biz-1',
          branchId: 'br-1',
          status: BookingStatus.CONFIRMED,
          date: '2026-10-20',
        },
        relations: ['branch', 'business', 'customer'],
      }),
    );
    expect(page.total).toBe(1);
    expect(page.data[0].reference).toBe('BK-ABC123');
    expect(page.data[0].customer).toEqual({
      id: 'cust-1',
      firstName: 'Amina',
      lastName: 'Bello',
      phone: '+2348032198831',
      email: null,
      avatar: null,
    });
  });

  it('supports a from/to date range', async () => {
    const { service, bookingRepository } = build();

    await service.findAllForBusiness('biz-1', {
      from: '2026-10-01',
      to: '2026-10-31',
    });

    const findArgs = bookingRepository.findAndCount.mock
      .calls[0] as unknown as [{ where: { date?: unknown } }];
    expect(findArgs[0].where.date).toBeDefined();
  });

  it('rejects a status change for another business', async () => {
    const { service } = build();

    await expect(
      service.updateStatusForBusiness(
        { id: 'u-other', businessId: 'biz-2' } as never,
        'bk-1',
        { status: BookingStatus.CONFIRMED },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('confirms a booked booking', async () => {
    const { service, bookingRepository } = build();

    const updated = await service.updateStatusForBusiness(
      { id: 'u-1', businessId: 'biz-1', role: UserRole.OWNER } as never,
      'bk-1',
      { status: BookingStatus.CONFIRMED },
    );

    expect(bookingRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: BookingStatus.CONFIRMED }),
    );
    expect(updated.status).toBe(BookingStatus.CONFIRMED);
  });

  it('checks a booked guest straight in (booked → completed)', async () => {
    const { service } = build();

    const updated = await service.updateStatusForBusiness(
      { id: 'u-1', businessId: 'biz-1', role: UserRole.STAFF } as never,
      'bk-1',
      { status: BookingStatus.COMPLETED },
    );

    expect(updated.status).toBe(BookingStatus.COMPLETED);
  });

  it('refuses to reopen a completed booking', async () => {
    const { service } = build({
      findOne: jest.fn().mockResolvedValue({
        ...baseBooking,
        status: BookingStatus.COMPLETED,
      }),
    });

    await expect(
      service.updateStatusForBusiness(
        { id: 'u-1', businessId: 'biz-1', role: UserRole.OWNER } as never,
        'bk-1',
        { status: BookingStatus.CONFIRMED },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('records cancellation metadata when the business cancels', async () => {
    const { service, bookingRepository } = build();

    await service.updateStatusForBusiness(
      { id: 'u-1', businessId: 'biz-1', role: UserRole.MANAGER } as never,
      'bk-1',
      { status: BookingStatus.CANCELLED, cancellationReason: 'No-show' },
    );

    const saveArgs = bookingRepository.save.mock.calls[0] as unknown as [
      {
        status: BookingStatus;
        cancelledAt: Date;
        cancellationReason: string | null;
      },
    ];
    const saved = saveArgs[0];
    expect(saved.status).toBe(BookingStatus.CANCELLED);
    expect(saved.cancelledAt).toBeInstanceOf(Date);
    expect(saved.cancellationReason).toBe('No-show');
  });
});

describe('BookingsService service booking rules', () => {
  // Wednesday 21 Oct 2026, 08:00 local.
  const NOW = new Date('2026-10-21T08:00:00');
  const branch = {
    id: 'br-1',
    name: 'Main',
    businessId: 'biz-1',
    businessHours: null,
  };

  function withRules(
    rules: Record<string, unknown> | null,
    active: {
      time: string;
      durationMinutes: number;
      itemId: string | null;
    }[] = [],
  ) {
    const item = {
      id: 'svc-1',
      name: 'Facial',
      isBookable: true,
      bookingMethod: null,
      duration: '60 mins',
      branches: [{ id: 'br-1' }],
      bookingRules: rules,
    };
    const created: unknown[] = [];
    const manager = {
      find: jest.fn().mockResolvedValue(active),
      create: jest.fn((_entity, row) => row),
      save: jest.fn(async (row) => {
        created.push(row);
        return { ...row, id: 'bk-9', createdAt: NOW };
      }),
    };
    const service = new BookingsService(
      { find: jest.fn().mockResolvedValue(active) } as never,
      { findOne: jest.fn().mockResolvedValue(branch) } as never,
      { findOne: jest.fn().mockResolvedValue(item) } as never,
      { transaction: (run: (m: unknown) => unknown) => run(manager) } as never,
    );
    return { service, created };
  }

  beforeEach(() => {
    jest.useFakeTimers({ now: NOW });
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('closes days the service is not offered on', async () => {
    // 21 Oct 2026 is a Wednesday (3).
    const { service } = withRules({ days: [1, 2] });
    const day = await service.getAvailability({
      branchId: 'br-1',
      itemId: 'svc-1',
      date: '2026-10-21',
    });
    expect(day.isClosed).toBe(true);
  });

  it('narrows the branch hours to the service hours', async () => {
    const { service } = withRules({ from: '10:00', to: '12:00' });
    const day = await service.getAvailability({
      branchId: 'br-1',
      itemId: 'svc-1',
      date: '2026-10-22',
    });
    expect(day.slots.map((slot) => slot.time)).toEqual([
      '10:00',
      '10:30',
      '11:00',
    ]);
  });

  it('keeps a turnaround buffer and allows parallel bookings up to capacity', async () => {
    const booked = [{ time: '10:00', durationMinutes: 60, itemId: 'svc-1' }];
    const single = withRules(
      { from: '10:00', to: '13:00', bufferMinutes: 30 },
      booked,
    );
    const one = await single.service.getAvailability({
      branchId: 'br-1',
      itemId: 'svc-1',
      date: '2026-10-22',
    });
    const open = (slots: { time: string; available: boolean }[]) =>
      slots.filter((slot) => slot.available).map((slot) => slot.time);
    // 10:00–11:00 plus a 30-minute buffer blocks starts before 11:30.
    expect(open(one.slots)).toEqual(['11:30', '12:00']);

    const double = withRules(
      { from: '10:00', to: '13:00', capacity: 2 },
      booked,
    );
    const two = await double.service.getAvailability({
      branchId: 'br-1',
      itemId: 'svc-1',
      date: '2026-10-22',
    });
    expect(open(two.slots)).toContain('10:00');
  });

  it('enforces notice and horizon, and confirms at once without manual confirmation', async () => {
    const { service, created } = withRules({
      leadMinutes: 180,
      horizonDays: 14,
      requiresConfirmation: false,
    });
    const today = await service.getAvailability({
      branchId: 'br-1',
      itemId: 'svc-1',
      date: '2026-10-21',
    });
    // 08:00 + 3h notice: nothing before 11:00.
    expect(today.slots.find((slot) => slot.time === '10:30')?.available).toBe(
      false,
    );
    expect(today.slots.find((slot) => slot.time === '11:00')?.available).toBe(
      true,
    );

    await expect(
      service.createBooking({ id: 'cust-1' } as never, {
        branchId: 'br-1',
        itemId: 'svc-1',
        date: '2026-11-20',
        time: '12:00',
      }),
    ).rejects.toThrow(BadRequestException);

    await service.createBooking({ id: 'cust-1' } as never, {
      branchId: 'br-1',
      itemId: 'svc-1',
      date: '2026-10-22',
      time: '12:00',
    });
    expect(created[0]).toEqual(
      expect.objectContaining({ status: BookingStatus.CONFIRMED }),
    );
  });
});

describe('BookingsService blocked dates and branch schedules', () => {
  const NOW = new Date('2026-10-21T08:00:00');
  const branch = {
    id: 'br-1',
    name: 'Main',
    businessId: 'biz-1',
    businessHours: null,
  };

  function withRules(rules: Record<string, unknown>) {
    const item = {
      id: 'svc-1',
      name: 'Facial',
      isBookable: true,
      bookingMethod: null,
      duration: '60 mins',
      branches: [{ id: 'br-1' }],
      bookingRules: rules,
    };
    return new BookingsService(
      { find: jest.fn().mockResolvedValue([]) } as never,
      { findOne: jest.fn().mockResolvedValue(branch) } as never,
      { findOne: jest.fn().mockResolvedValue(item) } as never,
      {
        transaction: (run: (m: unknown) => unknown) =>
          run({
            find: jest.fn().mockResolvedValue([]),
            create: jest.fn((_e, row) => row),
            save: jest.fn(async (row) => ({
              ...row,
              id: 'bk',
              createdAt: NOW,
            })),
          }),
      } as never,
    );
  }
  const ask = (service: BookingsService, date: string) =>
    service.getAvailability({
      branchId: 'br-1',
      itemId: 'svc-1',
      date,
    });

  beforeEach(() => jest.useFakeTimers({ now: NOW }));
  afterEach(() => jest.useRealTimers());

  it('closes a blocked date and explains a rejected booking', async () => {
    const service = withRules({
      blockouts: [{ date: '2026-10-23', reason: 'Staff training' }],
    });
    expect((await ask(service, '2026-10-23')).isClosed).toBe(true);
    expect((await ask(service, '2026-10-22')).isClosed).toBe(false);
    await expect(
      service.createBooking({ id: 'cust-1' } as never, {
        branchId: 'br-1',
        itemId: 'svc-1',
        date: '2026-10-23',
        time: '12:00',
      }),
    ).rejects.toThrow('Not bookable on this day: Staff training');
  });

  it("uses a branch's own days and hours there", async () => {
    const service = withRules({
      days: [1, 2, 3, 4, 5],
      from: '09:00',
      to: '17:00',
      branchSchedules: [
        { branchId: 'br-1', days: [4], from: '14:00', to: '16:00' },
      ],
    });
    // Wednesday: the service is open, but this branch only runs Thursdays.
    expect((await ask(service, '2026-10-21')).isClosed).toBe(true);
    const thursday = await ask(service, '2026-10-22');
    expect(thursday.slots.map((slot) => slot.time)).toEqual([
      '14:00',
      '14:30',
      '15:00',
    ]);
  });

  it('keeps service-wide hours at branches without their own schedule', async () => {
    const service = withRules({
      from: '09:00',
      to: '11:00',
      branchSchedules: [{ branchId: 'br-other', from: '14:00', to: '16:00' }],
    });
    const day = await ask(service, '2026-10-22');
    expect(day.slots.map((slot) => slot.time)).toEqual([
      '09:00',
      '09:30',
      '10:00',
    ]);
  });
});

describe('BookingsService reschedule and merchant details', () => {
  // Wednesday 21 Oct 2026, 08:00 local.
  const NOW = new Date('2026-10-21T08:00:00');
  const branch = {
    id: 'br-1',
    name: 'Main',
    businessId: 'biz-1',
    businessHours: null,
    uniqueCode: 'BR123ABC',
    phone: '+2348011111111',
    address: '12 Jabi Lake Road',
    city: 'Abuja',
    state: 'FCT',
    latitude: '9.07',
    longitude: '7.42',
    business: { id: 'biz-1', name: 'Aurora Spa' },
  };
  const business = {
    id: 'biz-1',
    name: 'Aurora Spa',
    uniqueCode: 'BIZ123XYZ',
    logoUrl: 'https://cdn.test/logo.png',
    coverImage: 'https://cdn.test/cover.png',
    phone: '+2348099999999',
  };

  function setup(
    booking: Record<string, unknown>,
    active: {
      id: string;
      time: string;
      durationMinutes: number;
      itemId: string | null;
    }[] = [],
  ) {
    const manager = {
      find: jest.fn().mockResolvedValue(active),
      save: jest.fn(async (row) => row),
    };
    const service = new BookingsService(
      {
        findOne: jest.fn().mockResolvedValue({
          ...baseBooking,
          branch,
          business,
          ...booking,
        }),
      } as never,
      { findOne: jest.fn().mockResolvedValue(branch) } as never,
      { findOne: jest.fn() } as never,
      { transaction: (run: (m: unknown) => unknown) => run(manager) } as never,
    );
    return { service, manager };
  }

  beforeEach(() => jest.useFakeTimers({ now: NOW }));
  afterEach(() => jest.useRealTimers());

  it('moves the customer’s booking and sends it back for confirmation', async () => {
    const { service, manager } = setup({ status: BookingStatus.CONFIRMED });
    const moved = await service.rescheduleBooking(
      { id: 'cust-1' } as never,
      'bk-1',
      { date: '2026-10-23', time: '11:00' },
    );
    expect(manager.save).toHaveBeenCalledWith(
      expect.objectContaining({
        date: '2026-10-23',
        time: '11:00',
        status: BookingStatus.BOOKED,
      }),
    );
    expect(moved.date).toBe('2026-10-23');
  });

  it('ignores its own slot but not someone else’s', async () => {
    // Its own 14:30 slot does not block moving 30 minutes later...
    const own = setup({}, [
      { id: 'bk-1', time: '14:30', durationMinutes: 60, itemId: null },
    ]);
    await expect(
      own.service.rescheduleBooking({ id: 'cust-1' } as never, 'bk-1', {
        date: '2026-10-22',
        time: '15:00',
      }),
    ).resolves.toBeDefined();

    // ...but another booking there does.
    const taken = setup({}, [
      { id: 'bk-2', time: '15:00', durationMinutes: 30, itemId: null },
    ]);
    await expect(
      taken.service.rescheduleBooking({ id: 'cust-1' } as never, 'bk-1', {
        date: '2026-10-22',
        time: '15:00',
      }),
    ).rejects.toThrow('Time slot is no longer available');
  });

  it('only lets the customer move an active booking of their own', async () => {
    await expect(
      setup({}).service.rescheduleBooking(
        { id: 'someone-else' } as never,
        'bk-1',
        {
          date: '2026-10-22',
          time: '15:00',
        },
      ),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      setup({ status: BookingStatus.COMPLETED }).service.rescheduleBooking(
        { id: 'cust-1' } as never,
        'bk-1',
        { date: '2026-10-22', time: '15:00' },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns the business logo, branch phone, address and codes', async () => {
    const { service } = setup({});
    const detail = await service.getBooking({ id: 'cust-1' } as never, 'bk-1');
    expect(detail.merchant).toEqual({
      businessCode: 'BIZ123XYZ',
      branchCode: 'BR123ABC',
      logoUrl: 'https://cdn.test/logo.png',
      coverImage: 'https://cdn.test/cover.png',
      phone: '+2348011111111',
      address: '12 Jabi Lake Road',
      city: 'Abuja',
      state: 'FCT',
      latitude: 9.07,
      longitude: 7.42,
    });
  });
});
