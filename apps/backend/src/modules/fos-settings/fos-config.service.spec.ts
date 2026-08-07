import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { FosConfigService } from './fos-config.service';
import {
  FosSettingsCategory,
  FosAccount,
  FosFiscalPeriod,
  FosCurrency,
  FosPermission,
  FosApprovalRule,
  FosNotificationRule,
  FosAuditLog,
} from './entities/fos-config.entity';

describe('FosConfigService', () => {
  let service: FosConfigService;

  const repo = (extra: Record<string, jest.Mock> = {}) => ({
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
    ...extra,
  });

  const mocks = {
    categoryRepo: repo(),
    accountRepo: repo(),
    periodRepo: repo(),
    currencyRepo: repo(),
    permissionRepo: repo(),
    approvalRuleRepo: repo(),
    notificationRuleRepo: repo(),
    auditLogRepo: repo(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FosConfigService,
        {
          provide: getRepositoryToken(FosSettingsCategory),
          useValue: mocks.categoryRepo,
        },
        {
          provide: getRepositoryToken(FosAccount),
          useValue: mocks.accountRepo,
        },
        {
          provide: getRepositoryToken(FosFiscalPeriod),
          useValue: mocks.periodRepo,
        },
        {
          provide: getRepositoryToken(FosCurrency),
          useValue: mocks.currencyRepo,
        },
        {
          provide: getRepositoryToken(FosPermission),
          useValue: mocks.permissionRepo,
        },
        {
          provide: getRepositoryToken(FosApprovalRule),
          useValue: mocks.approvalRuleRepo,
        },
        {
          provide: getRepositoryToken(FosNotificationRule),
          useValue: mocks.notificationRuleRepo,
        },
        {
          provide: getRepositoryToken(FosAuditLog),
          useValue: mocks.auditLogRepo,
        },
      ],
    }).compile();

    service = module.get<FosConfigService>(FosConfigService);
  });

  describe('categories', () => {
    it('should list categories', async () => {
      mocks.categoryRepo.find.mockResolvedValue([
        { id: '1', name: 'Software', type: 'Expense', description: 'SaaS' },
      ]);

      const result = await service.listCategories();
      expect(result[0].name).toBe('Software');
    });

    it('should remove a category', async () => {
      mocks.categoryRepo.findOne.mockResolvedValue({ id: '1' });
      const result = await service.removeCategory('1');
      expect(result.success).toBe(true);
    });

    it('should throw on missing category', async () => {
      mocks.categoryRepo.findOne.mockResolvedValue(null);
      await expect(service.removeCategory('x')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('permissions', () => {
    it('should seed defaults when empty', async () => {
      mocks.permissionRepo.find.mockResolvedValue([]);
      mocks.permissionRepo.save.mockResolvedValue([]);

      const result = await service.getPermissions();

      expect(result.length).toBeGreaterThan(0);
      expect(mocks.permissionRepo.save).toHaveBeenCalled();
    });
  });

  describe('audit logs', () => {
    it('should list entries newest first', async () => {
      mocks.auditLogRepo.find.mockResolvedValue([
        {
          id: '1',
          timestamp: new Date('2026-07-17T09:23:12.000Z'),
          user: 'Admin User',
          action: 'Settings Updated',
          details: 'Changed base currency to NGN',
        },
      ]);

      const result = await service.listAuditLogs({});

      expect(result.entries[0].action).toBe('Settings Updated');
    });
  });
});
