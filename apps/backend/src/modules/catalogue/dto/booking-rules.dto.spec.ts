import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BookingRulesDto } from './booking-rules.dto';

const errors = async (plain: Record<string, unknown>) =>
  (
    await validate(plainToInstance(BookingRulesDto, plain), {
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  ).map((error) => error.property);

describe('BookingRulesDto', () => {
  it('accepts blocked dates and branch schedules', async () => {
    await expect(
      errors({
        blockouts: [{ date: '2026-12-25', reason: 'Christmas' }],
        branchSchedules: [
          {
            branchId: '6f1c2b8e-4d3a-4b5c-9e7f-1a2b3c4d5e6f',
            days: [1, 2],
            from: '10:00',
            to: '18:00',
          },
        ],
      }),
    ).resolves.toEqual([]);
  });

  it('rejects malformed dates, branch ids and times', async () => {
    await expect(
      errors({ blockouts: [{ date: '25/12/2026' }] }),
    ).resolves.toEqual(['blockouts']);
    await expect(
      errors({ branchSchedules: [{ branchId: 'wuse', from: '9am' }] }),
    ).resolves.toEqual(['branchSchedules']);
  });
});
