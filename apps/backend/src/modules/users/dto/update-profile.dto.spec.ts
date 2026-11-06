import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { UpdateUserProfileDto } from './update-profile.dto';

/**
 * Mirrors the app-wide pipe from `main.ts` so a field the app sends is
 * proven to survive `whitelist` + `forbidNonWhitelisted` — the exact
 * combination that silently drops undeclared payload keys.
 */
const runPipe = async (payload: unknown) =>
  validate(plainToInstance(UpdateUserProfileDto, payload), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

describe('UpdateUserProfileDto', () => {
  it('accepts the bare avatar PATCH the app sends after an upload', async () => {
    const errors = await runPipe({
      avatar: 'https://res.cloudinary.com/demo/image/upload/avatar.png',
    });

    expect(errors).toEqual([]);
  });

  it('still accepts names and gender alongside avatar', async () => {
    const errors = await runPipe({
      firstName: 'Ada',
      lastName: 'Obi',
      gender: 'Female',
      avatar: 'https://res.cloudinary.com/demo/image/upload/avatar.png',
    });

    expect(errors).toEqual([]);
  });

  it('rejects fields the DTO does not declare', async () => {
    const errors = await runPipe({ email: 'ada@example.com' });

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('whitelistValidation');
  });

  it('rejects an avatar that is not a string', async () => {
    const errors = await runPipe({ avatar: 123 });

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('isString');
  });

  it('accepts a home district id, or null to clear it', async () => {
    expect(
      await runPipe({ homeDistrictId: '3f0c8a4e-6b1d-4c2a-9e7f-1a2b3c4d5e6f' }),
    ).toEqual([]);
    expect(await runPipe({ homeDistrictId: null })).toEqual([]);
    expect(await runPipe({ homeDistrictId: 'Wuse 2' })).not.toEqual([]);
  });
});
