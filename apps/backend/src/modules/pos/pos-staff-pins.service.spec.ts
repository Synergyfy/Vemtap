import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PosStaffPinsService } from './pos-staff-pins.service';
import { PosOverrideAction } from './entities/pos-enums';
import { User, UserRole } from '../users/entities/user.entity';

describe('PosStaffPinsService', () => {
  const updateBuilder = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({}),
  };
  const pinRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((dto: unknown) => dto),
    save: jest.fn((pin: unknown) => Promise.resolve(pin)),
    update: jest.fn(),
    softDelete: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => updateBuilder),
  };
  const logRepo = {
    create: jest.fn((dto: unknown) => dto),
    save: jest.fn((row: unknown) => Promise.resolve(row)),
    findAndCount: jest.fn(),
  };
  const userRepo = { find: jest.fn(), findOne: jest.fn() };
  const jwt = {
    signAsync: jest.fn().mockResolvedValue('signed-token'),
    verifyAsync: jest.fn(),
  };
  const service = new PosStaffPinsService(
    pinRepo as never,
    logRepo as never,
    userRepo as never,
    jwt as never,
  );
  const cashier = {
    id: 'u-cashier',
    businessId: 'bus-1',
    branchId: 'br-1',
    role: UserRole.STAFF,
  } as User;

  beforeEach(() => jest.clearAllMocks());

  it('never exposes hashes when listing the team', async () => {
    userRepo.find.mockResolvedValueOnce([
      {
        id: 'u-1',
        firstName: 'Sarah',
        lastName: 'Ade',
        role: UserRole.MANAGER,
      },
      { id: 'u-2', firstName: 'Tunde', lastName: 'B', role: UserRole.STAFF },
    ]);
    pinRepo.find.mockResolvedValueOnce([
      {
        userId: 'u-1',
        isSupervisor: true,
        pinHash: 'secret',
        lockedUntil: null,
      },
    ]);
    const { data } = await service.list('bus-1');
    expect(data).toEqual([
      expect.objectContaining({
        userId: 'u-1',
        hasPin: true,
        isSupervisor: true,
      }),
      expect.objectContaining({
        userId: 'u-2',
        hasPin: false,
        isSupervisor: false,
      }),
    ]);
    expect(JSON.stringify(data)).not.toContain('secret');
  });

  it('only sets a PIN for a member of the same business', async () => {
    userRepo.findOne.mockResolvedValueOnce(null);
    await expect(
      service.set('bus-1', 'stranger', { pin: '1234' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('returns a scoped override token and logs the approval on a match', async () => {
    const pinHash = await bcrypt.hash('4821', 4);
    pinRepo.find.mockResolvedValueOnce([
      {
        id: 'pin-1',
        userId: 'u-sup',
        pinHash,
        failedAttempts: 0,
        lockedUntil: null,
        user: { firstName: 'Sarah', lastName: 'Ade' },
      },
    ]);

    const result = await service.verify(cashier, {
      pin: '4821',
      action: PosOverrideAction.REFUND,
      referenceId: '6b1f7c0e-5f2a-4d6e-9a1b-2c3d4e5f6a7b',
    });

    expect(result).toMatchObject({
      overrideToken: 'signed-token',
      supervisorName: 'Sarah Ade',
    });
    expect(jwt.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        typ: 'pos_override',
        sub: 'u-sup',
        biz: 'bus-1',
        act: 'refund',
      }),
      { expiresIn: 120 },
    );
    expect(logRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        supervisorId: 'u-sup',
        requestedById: 'u-cashier',
      }),
    );
  });

  it('counts a miss against the supervisor PINs', async () => {
    pinRepo.find.mockResolvedValueOnce([
      {
        id: 'pin-1',
        userId: 'u-sup',
        pinHash: await bcrypt.hash('4821', 4),
        lockedUntil: null,
      },
    ]);
    await expect(
      service.verify(cashier, { pin: '0000', action: PosOverrideAction.VOID }),
    ).rejects.toThrow(UnauthorizedException);
    expect(updateBuilder.execute).toHaveBeenCalled();
  });

  it('skips locked PINs', async () => {
    pinRepo.find.mockResolvedValueOnce([
      {
        id: 'pin-1',
        pinHash: 'x',
        lockedUntil: new Date(Date.now() + 60_000),
      },
    ]);
    await expect(
      service.verify(cashier, { pin: '4821', action: PosOverrideAction.VOID }),
    ).rejects.toThrow(ForbiddenException);
  });

  describe('assertOverride', () => {
    it('demands a token', async () => {
      await expect(
        service.assertOverride(undefined, 'bus-1', PosOverrideAction.REFUND),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects a token for another business, action or sale', async () => {
      jwt.verifyAsync.mockResolvedValue({
        typ: 'pos_override',
        biz: 'bus-1',
        act: 'refund',
        ref: 'sale-1',
      });
      await expect(
        service.assertOverride(
          't',
          'bus-2',
          PosOverrideAction.REFUND,
          'sale-1',
        ),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.assertOverride('t', 'bus-1', PosOverrideAction.DISCOUNT),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.assertOverride(
          't',
          'bus-1',
          PosOverrideAction.REFUND,
          'sale-2',
        ),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.assertOverride(
          't',
          'bus-1',
          PosOverrideAction.REFUND,
          'sale-1',
        ),
      ).resolves.toBeUndefined();
    });

    it('treats an expired token as forbidden', async () => {
      jwt.verifyAsync.mockRejectedValueOnce(new Error('jwt expired'));
      await expect(
        service.assertOverride('t', 'bus-1', PosOverrideAction.REFUND),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
