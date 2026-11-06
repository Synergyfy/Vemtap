import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { UserRole } from '../../users/entities/user.entity';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: {
    findOne: jest.Mock;
    findActiveSession: jest.Mock;
  };

  const configService = {
    get: jest.fn().mockReturnValue('test-secret'),
  };

  const dbUser = {
    id: 'user-1',
    email: 'user@example.com',
    role: UserRole.OWNER,
    businessId: 'biz-1',
    branchId: 'br-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    usersService = {
      findOne: jest.fn(),
      findActiveSession: jest.fn(),
    };
    strategy = new JwtStrategy(configService as any, usersService as any);
  });

  it('honors a CUSTOMER role claim (dual-role owner in customer mode)', async () => {
    usersService.findOne.mockResolvedValue({ ...dbUser });

    const user = await strategy.validate({
      sub: 'user-1',
      role: UserRole.CUSTOMER,
      businessId: null,
      branchId: null,
    });

    expect(user.role).toBe(UserRole.CUSTOMER);
    // Explicit nulls must survive — not fall back to the DB business context.
    expect((user as any).businessId).toBeNull();
    expect((user as any).branchId).toBeNull();
  });

  it('falls back to the DB role and context when claims are absent (legacy tokens)', async () => {
    usersService.findOne.mockResolvedValue({ ...dbUser });

    const user = await strategy.validate({ sub: 'user-1' });

    expect(user.role).toBe(UserRole.OWNER);
    expect((user as any).businessId).toBe('biz-1');
    expect((user as any).branchId).toBe('br-1');
  });

  it('honors an OWNER claim with business context', async () => {
    usersService.findOne.mockResolvedValue({
      ...dbUser,
      role: UserRole.CUSTOMER,
    });

    const user = await strategy.validate({
      sub: 'user-1',
      role: UserRole.OWNER,
      businessId: 'biz-9',
      branchId: 'br-9',
    });

    expect(user.role).toBe(UserRole.OWNER);
    expect((user as any).businessId).toBe('biz-9');
    expect((user as any).branchId).toBe('br-9');
  });

  it('rejects when the user no longer exists', async () => {
    usersService.findOne.mockResolvedValue(null);

    await expect(strategy.validate({ sub: 'user-1' })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a revoked session', async () => {
    usersService.findOne.mockResolvedValue({ ...dbUser });
    usersService.findActiveSession.mockResolvedValue(null);

    await expect(
      strategy.validate({ sub: 'user-1', sid: 'session-1' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
