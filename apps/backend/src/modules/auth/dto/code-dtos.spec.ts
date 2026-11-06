import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { VerifyOtpDto } from './otp.dto';
import { VerifyEmailDto } from './verify-email.dto';

/** Every emailed sign-in / sign-up / verification code is 6 digits. */
describe('verification code DTOs', () => {
  const codeErrors = (dto: object) =>
    validateSync(dto).filter((error) => error.property === 'code');

  it.each([
    ['VerifyOtpDto', VerifyOtpDto],
    ['VerifyEmailDto', VerifyEmailDto],
  ])('%s accepts a 6-digit code and rejects other lengths', (_name, Dto) => {
    const make = (code: string) => plainToInstance(Dto as new () => object, { email: 'someone@example.com', code });

    expect(codeErrors(make('123456'))).toHaveLength(0);
    expect(codeErrors(make('1234'))).not.toHaveLength(0);
    expect(codeErrors(make('1234567'))).not.toHaveLength(0);
    expect(codeErrors(make('12a456'))).not.toHaveLength(0);
  });
});
