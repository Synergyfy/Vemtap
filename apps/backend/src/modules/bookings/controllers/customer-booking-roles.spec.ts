import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';
import { BookingsController } from '../bookings.controller';
import { MeBookingsController } from './me-bookings.controller';

/**
 * A customer who later registers a business becomes an Owner but keeps
 * booking as a customer. The customer booking routes must let them in, or their
 * own bookings vanish from Orders & Bookings (403).
 */
describe('customer booking routes accept dual-role owners', () => {
  const reflector = new Reflector();
  const rolesOf = (handler: unknown) =>
    reflector.get<UserRole[]>(ROLES_KEY, handler as () => void);

  it.each([
    ['GET /me/bookings', MeBookingsController.prototype.listMyBookings],
    ['POST /bookings', BookingsController.prototype.createBooking],
    ['PATCH /bookings/:id/cancel', BookingsController.prototype.cancelBooking],
    [
      'PATCH /bookings/:id/reschedule',
      BookingsController.prototype.rescheduleBooking,
    ],
  ])('%s', (_route, handler) => {
    expect(rolesOf(handler)).toEqual(
      expect.arrayContaining([UserRole.CUSTOMER, UserRole.OWNER]),
    );
  });
});
