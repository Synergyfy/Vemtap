import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccountPrivacyService } from './account-privacy.service';
import { ProcessingConsentGuard } from './processing-consent.guard';
import { UserRole } from '../users/entities/user.entity';

describe('AccountPrivacyService', () => {
  const users = {
    findOne: jest.fn(),
    update: jest.fn(),
    manager: { query: jest.fn() },
  };
  const businesses = { findOne: jest.fn(), update: jest.fn() };
  const requests = {
    create: jest.fn((row) => row),
    save: jest.fn(),
    find: jest.fn(),
  };
  const mail = { sendGenericEmail: jest.fn() };
  const config = { get: jest.fn() };
  const service = new AccountPrivacyService(
    users as any,
    businesses as any,
    requests as any,
    mail as any,
    config as any,
  );
  const owner = { id: 'u1', role: UserRole.OWNER, businessId: 'b1' } as any;
  const staff = { id: 'u2', role: UserRole.STAFF, businessId: 'b1' } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    users.findOne.mockResolvedValue({
      id: 'u1',
      notificationPreferences: { push: true },
      securityPreferences: null,
    });
    businesses.findOne.mockResolvedValue({ id: 'b1', privacySettings: null });
  });

  it('reads defaults: not restricted, analytics and marketing on, alerts off', async () => {
    await expect(service.get(owner)).resolves.toEqual({
      restrictProcessing: false,
      analytics: true,
      marketing: true,
      deviceAlerts: false,
      canManageBusiness: true,
    });
  });

  it('lets an owner restrict processing and keeps other preferences', async () => {
    await service.update(owner, { restrictProcessing: true, marketing: false });
    expect(businesses.update).toHaveBeenCalledWith('b1', {
      privacySettings: { restrictProcessing: true },
    });
    expect(users.update).toHaveBeenCalledWith('u1', {
      notificationPreferences: { push: true, marketing: false },
    });
  });

  it('ignores business-wide fields from staff but saves their own', async () => {
    await service.update(staff, {
      restrictProcessing: true,
      deviceAlerts: true,
    });
    expect(businesses.update).not.toHaveBeenCalled();
    expect(users.update).toHaveBeenCalledWith('u2', {
      securityPreferences: { deviceAlerts: true },
    });
  });

  it('allows processing by default and blocks per purpose', async () => {
    await expect(service.allows('b1', 'ai')).resolves.toBe(true);
    businesses.findOne.mockResolvedValue({
      id: 'b1',
      privacySettings: { analytics: false },
    });
    await expect(service.allows('b1', 'ai')).resolves.toBe(true);
    await expect(service.allows('b1', 'analytics')).resolves.toBe(false);
    businesses.findOne.mockResolvedValue({
      id: 'b1',
      privacySettings: { restrictProcessing: true },
    });
    await expect(service.allows('b1', 'ai')).resolves.toBe(false);
  });

  it('logs a rectification without emailing when DPO_EMAIL is unset', async () => {
    requests.save.mockImplementation((row) =>
      Promise.resolve({ ...row, id: 'r1', createdAt: new Date() }),
    );
    const result = await service.requestRectification(owner, {
      type: 'rectification',
      details: 'Fix my business address please',
    });
    expect(result.status).toBe('open');
    expect(result.reference).toMatch(/^DR-[0-9A-F]{8}$/);
    expect(mail.sendGenericEmail).not.toHaveBeenCalled();
  });

  it('exports the business tables and strips tokens', async () => {
    users.manager.query.mockImplementation((sql: string) =>
      Promise.resolve(
        sql.includes('"catalogue_orders"')
          ? [{ id: 'o1', sessionToken: 's', trackingToken: 't' }]
          : [{ id: 'x' }],
      ),
    );
    requests.save.mockImplementation((row) =>
      Promise.resolve({ ...row, id: 'r2' }),
    );
    const file = await service.export(owner);
    const archive = JSON.parse(Buffer.from(file.content, 'base64').toString());
    expect(archive.orders).toEqual([{ id: 'o1' }]);
    expect(Object.keys(archive)).toEqual(
      expect.arrayContaining([
        'business',
        'team',
        'branches',
        'catalogueItems',
        'deals',
        'contacts',
        'posSales',
        'campaigns',
      ]),
    );
    expect(users.manager.query).toHaveBeenCalledTimes(10);
  });

  it('guard refuses a restricted business', async () => {
    const guard = new ProcessingConsentGuard(
      { get: () => 'ai' } as unknown as Reflector,
      service,
    );
    businesses.findOne.mockResolvedValue({
      id: 'b1',
      privacySettings: { restrictProcessing: true },
    });
    const context = {
      getHandler: () => undefined,
      switchToHttp: () => ({
        getRequest: () => ({ user: { businessId: 'b1' } }),
      }),
    } as any;
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
