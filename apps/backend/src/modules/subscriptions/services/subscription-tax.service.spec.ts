import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  SubscriptionTaxService,
} from './subscription-tax.service';
import {
  SubscriptionTaxConfig,
  TaxType,
} from '../entities/subscription-tax-config.entity';

describe('SubscriptionTaxService', () => {
  let service: SubscriptionTaxService;
  let taxConfigRepository: Repository<SubscriptionTaxConfig>;
  let dataSource: DataSource;

  const mockActiveConfig: Partial<SubscriptionTaxConfig> = {
    id: 'tax-config-1',
    name: 'VAT',
    taxType: TaxType.PERCENTAGE,
    rate: 7.5,
    isEnabled: true,
    isActive: true,
    changedById: 'admin-1',
    changeReason: 'Initial setup',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTaxConfigRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((dto) => Promise.resolve({ id: 'tax-config-saved', ...dto })),
  };

  const mockEntityManager = {
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    create: jest.fn().mockImplementation((entityClass, dto) => dto),
    save: jest.fn().mockImplementation((entityClass, dto) => Promise.resolve({ id: 'tax-config-new', ...dto })),
  };

  const mockDataSource = {
    transaction: jest.fn().mockImplementation(async (cb) => cb(mockEntityManager)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionTaxService,
        {
          provide: getRepositoryToken(SubscriptionTaxConfig),
          useValue: mockTaxConfigRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<SubscriptionTaxService>(SubscriptionTaxService);
    taxConfigRepository = module.get<Repository<SubscriptionTaxConfig>>(
      getRepositoryToken(SubscriptionTaxConfig),
    );
    dataSource = module.get<DataSource>(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getActiveConfig', () => {
    it('should return the active tax configuration when found in DB', async () => {
      mockTaxConfigRepository.findOne.mockResolvedValue(mockActiveConfig);

      const result = await service.getActiveConfig();

      expect(mockTaxConfigRepository.findOne).toHaveBeenCalledWith({
        where: { isActive: true },
        relations: ['changedBy'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockActiveConfig);
    });

    it('should return a fallback default configuration if none exists', async () => {
      mockTaxConfigRepository.findOne.mockResolvedValue(null);

      const result = await service.getActiveConfig();

      expect(result.name).toBe('VAT');
      expect(result.taxType).toBe(TaxType.PERCENTAGE);
      expect(result.rate).toBe(7.5);
      expect(result.isEnabled).toBe(false);
    });
  });

  describe('updateTaxConfig', () => {
    it('should deactivate old rows and create a new active row to preserve history', async () => {
      const updateDto = {
        name: 'Standard VAT',
        taxType: TaxType.PERCENTAGE,
        rate: 10,
        isEnabled: true,
        changeReason: 'Updated VAT to 10%',
      };

      const result = await service.updateTaxConfig('admin-user-id', updateDto);

      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(mockEntityManager.update).toHaveBeenCalledWith(
        SubscriptionTaxConfig,
        { isActive: true },
        { isActive: false },
      );
      expect(mockEntityManager.create).toHaveBeenCalledWith(
        SubscriptionTaxConfig,
        expect.objectContaining({
          name: 'Standard VAT',
          taxType: TaxType.PERCENTAGE,
          rate: 10,
          isEnabled: true,
          isActive: true,
          changedById: 'admin-user-id',
          changeReason: 'Updated VAT to 10%',
        }),
      );
      expect(result.id).toBe('tax-config-new');
      expect(result.isActive).toBe(true);
    });

    it('should support updating to a fixed tax rate', async () => {
      const updateDto = {
        name: 'Fixed Surcharge',
        taxType: TaxType.FIXED,
        rate: 500,
        isEnabled: true,
        changeReason: 'Switched to fixed 500 NGN fee',
      };

      const result = await service.updateTaxConfig('admin-user-id', updateDto);

      expect(mockEntityManager.create).toHaveBeenCalledWith(
        SubscriptionTaxConfig,
        expect.objectContaining({
          taxType: TaxType.FIXED,
          rate: 500,
        }),
      );
      expect(result.taxType).toBe(TaxType.FIXED);
    });
  });

  describe('toggleTax', () => {
    it('should toggle enabled state by creating a new history row', async () => {
      mockTaxConfigRepository.findOne.mockResolvedValue(mockActiveConfig);

      const result = await service.toggleTax('admin-user-id', {
        isEnabled: false,
        changeReason: 'Disabled VAT',
      });

      expect(mockEntityManager.update).toHaveBeenCalledWith(
        SubscriptionTaxConfig,
        { isActive: true },
        { isActive: false },
      );
      expect(mockEntityManager.create).toHaveBeenCalledWith(
        SubscriptionTaxConfig,
        expect.objectContaining({
          isEnabled: false,
          rate: 7.5,
          changedById: 'admin-user-id',
        }),
      );
    });
  });

  describe('getHistory', () => {
    it('should return all historical records ordered by createdAt DESC', async () => {
      const mockHistory = [
        { id: '2', isActive: true, rate: 10 },
        { id: '1', isActive: false, rate: 7.5 },
      ];
      mockTaxConfigRepository.find.mockResolvedValue(mockHistory);

      const result = await service.getHistory();

      expect(mockTaxConfigRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { createdAt: 'DESC' },
          relations: ['changedBy'],
        }),
      );
      expect(result).toEqual(mockHistory);
    });
  });

  describe('calculateTax', () => {
    it('should calculate percentage tax accurately (7.5% on 10,000)', () => {
      const config = {
        id: 'cfg-1',
        name: 'VAT',
        taxType: TaxType.PERCENTAGE,
        rate: 7.5,
        isEnabled: true,
        isActive: true,
      } as SubscriptionTaxConfig;

      const result = service.calculateTax(10000, config);

      expect(result.subtotal).toBe(10000);
      expect(result.taxAmount).toBe(750);
      expect(result.total).toBe(10750);
      expect(result.taxRule.rate).toBe(7.5);
      expect(result.taxRule.isEnabled).toBe(true);
    });

    it('should calculate fixed tax accurately (500 fixed on 10,000)', () => {
      const config = {
        id: 'cfg-2',
        name: 'VAT',
        taxType: TaxType.FIXED,
        rate: 500,
        isEnabled: true,
        isActive: true,
      } as SubscriptionTaxConfig;

      const result = service.calculateTax(10000, config);

      expect(result.subtotal).toBe(10000);
      expect(result.taxAmount).toBe(500);
      expect(result.total).toBe(10500);
      expect(result.taxRule.rate).toBe(500);
    });

    it('should return 0 tax when isEnabled is false', () => {
      const config = {
        id: 'cfg-3',
        name: 'VAT',
        taxType: TaxType.PERCENTAGE,
        rate: 7.5,
        isEnabled: false,
        isActive: true,
      } as SubscriptionTaxConfig;

      const result = service.calculateTax(10000, config);

      expect(result.subtotal).toBe(10000);
      expect(result.taxAmount).toBe(0);
      expect(result.total).toBe(10000);
    });

    it('should handle zero or invalid subtotal safely', () => {
      const config = {
        id: 'cfg-4',
        name: 'VAT',
        taxType: TaxType.PERCENTAGE,
        rate: 7.5,
        isEnabled: true,
        isActive: true,
      } as SubscriptionTaxConfig;

      const result = service.calculateTax(0, config);

      expect(result.subtotal).toBe(0);
      expect(result.taxAmount).toBe(0);
      expect(result.total).toBe(0);
    });
  });
});
