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
    });
  });

  it('supports a from/to date range', async () => {
    const { service, bookingRepository } = build();

    await service.findAllForBusiness('biz-1', {
      from: '2026-10-01',
      to: '2026-10-31',
    });

    const { where } = bookingRepository.findAndCount.mock.calls[0][0];
    expect(where.date).toBeDefined();
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

    const saved = bookingRepository.save.mock.calls[0][0];
    expect(saved.status).toBe(BookingStatus.CANCELLED);
    expect(saved.cancelledAt).toBeInstanceOf(Date);
    expect(saved.cancellationReason).toBe('No-show');
  });
});
