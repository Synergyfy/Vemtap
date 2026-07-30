import { Test, TestingModule } from '@nestjs/testing';
import { PosService } from './pos.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PosSale } from './entities/pos-sale.entity';
import {
  PaymentMethod,
  SaleStatus,
  RegisterSessionStatus,
} from './entities/pos-enums';
import { PosSaleItem } from './entities/pos-sale-item.entity';
import { PosSplitPayment } from './entities/pos-split-payment.entity';
import { PosHeldSale } from './entities/pos-held-sale.entity';
import { PosHeldSaleItem } from './entities/pos-held-sale-item.entity';
import { PosRegisterSession } from './entities/pos-register-session.entity';
import { PosRefund } from './entities/pos-refund.entity';
import { PosRefundItem } from './entities/pos-refund-item.entity';
import {
  CatalogueItem,
  CatalogueItemStatus,
} from '../catalogue/entities/catalogue-item.entity';
import { CatalogueOffer } from '../catalogue/entities/catalogue-offer.entity';
import { CatalogueOrder } from '../catalogue-orders/entities/catalogue-order.entity';
import { CatalogueOrderItem } from '../catalogue-orders/entities/catalogue-order-item.entity';
import { Business } from '../businesses/entities/business.entity';
import { Branch } from '../branches/entities/branch.entity';
import { User, UserRole } from '../users/entities/user.entity';
import {
  FinancialTransaction,
  FosTransactionType,
  FosPlatform,
} from '../fos-core/entities/financial-transaction.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PushNotificationService } from '../notifications/push-notification.service';
import { CatalogueOrderService } from '../catalogue-orders/catalogue-orders.service';
import { LoyaltyService } from '../loyalty/loyalty.service';

describe('PosService', () => {
  let service: PosService;

  let savedSaleData: any = null;

  const mockSaleRepo = {
    create: jest.fn().mockImplementation((dto) => ({ ...dto })),
    save: jest.fn().mockImplementation((sale) => {
      savedSaleData = { id: 'sale-1', ...sale };
      return Promise.resolve(savedSaleData);
    }),
    findOne: jest.fn().mockImplementation(() => Promise.resolve(savedSaleData)),
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
    find: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
    createQueryBuilder: jest.fn().mockImplementation(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest
        .fn()
        .mockResolvedValue([{ id: 'sale-1', receiptNumber: 'RCT-001' }]),
      getManyAndCount: jest
        .fn()
        .mockResolvedValue([[{ id: 'sale-1', receiptNumber: 'RCT-001' }], 1]),
      getCount: jest.fn().mockResolvedValue(1),
    })),
  };

  const mockSaleItemRepo = {
    create: jest.fn().mockImplementation((dto) => dto),
    find: jest.fn().mockResolvedValue([]),
    save: jest.fn().mockImplementation((item) => Promise.resolve(item)),
  };

  const mockSplitPaymentRepo = {
    create: jest.fn().mockImplementation((dto) => dto),
  };

  const mockHeldSaleRepo = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest
      .fn()
      .mockImplementation((sale) => Promise.resolve({ id: 'held-1', ...sale })),
    findOne: jest.fn(),
    find: jest.fn().mockResolvedValue([]),
    softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
  };

  const mockHeldSaleItemRepo = {
    create: jest.fn().mockImplementation((dto) => dto),
  };

  const mockRegisterSessionRepo = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest
      .fn()
      .mockImplementation((s) => Promise.resolve({ id: 'reg-1', ...s })),
    findOne: jest.fn(),
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
  };

  const mockProductRepo = {
    findOne: jest.fn(),
    save: jest.fn().mockImplementation((p) => Promise.resolve(p)),
  };

  const mockRefundRepo = {
    create: jest.fn().mockImplementation((dto) => ({ ...dto })),
    save: jest
      .fn()
      .mockImplementation((r) => Promise.resolve({ id: 'refund-1', ...r })),
  };

  const mockRefundItemRepo = {
    create: jest.fn().mockImplementation((dto) => ({ ...dto })),
    save: jest
      .fn()
      .mockImplementation((ri) =>
        Promise.resolve({ id: 'refund-item-1', ...ri }),
      ),
  };

  const mockOfferRepo = {
    findOne: jest.fn(),
    save: jest.fn().mockImplementation((o) => Promise.resolve(o)),
  };

  const mockOrderRepo = {
    findOne: jest.fn(),
    save: jest.fn().mockImplementation((o) => Promise.resolve(o)),
  };

  const mockOrderItemRepo = {
    findOne: jest.fn(),
    save: jest.fn().mockImplementation((oi) => Promise.resolve(oi)),
  };

  const mockPushNotificationService = {
    sendNotification: jest.fn(),
  };

  const mockCatalogueOrderService = {
    createOrder: jest.fn(),
  };

  const mockLoyaltyService = {
    awardPoints: jest.fn(),
  };

  const mockBusinessRepo = {
    findOne: jest.fn(),
  };

  const mockBranchRepo = {
    findOne: jest.fn(),
  };

  const mockUserRepo = {
    findOne: jest.fn(),
    save: jest.fn().mockImplementation((u) => Promise.resolve(u)),
  };

  const mockFosTransactionRepo = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest
      .fn()
      .mockImplementation((t) => Promise.resolve({ id: 'fos-1', ...t })),
  };

  const mockCashier: User = {
    id: 'cashier-1',
    businessId: 'bus-1',
    branchId: 'br-1',
    role: UserRole.STAFF,
    firstName: 'Test',
    lastName: 'User',
    email: 'cashier@test.com',
  } as any;

  const mockItem = {
    id: 'prod-1',
    name: 'Classic Burger',
    price: 4500,
    costPrice: 2500,
    stockQuantity: 50,
    minStock: 5,
    status: CatalogueItemStatus.ACTIVE,
    sku: 'FF-001',
    barcode: 'VMT1',
    businessId: 'bus-1',
    allowBackOrder: true,
  };

  const mockItem2 = {
    id: 'prod-2',
    name: 'Beef Value Meal',
    price: 800,
    costPrice: 500,
    stockQuantity: 30,
    minStock: 3,
    status: CatalogueItemStatus.ACTIVE,
    sku: 'BV-001',
    barcode: 'VMT2',
    businessId: 'bus-1',
    allowBackOrder: true,
  };

  const mockEntityManager = {
    getRepository: jest.fn().mockImplementation((entity) => {
      if (entity === PosSale) return mockSaleRepo;
      if (entity === PosSaleItem) return mockSaleItemRepo;
      if (entity === PosSplitPayment) return mockSplitPaymentRepo;
      if (entity === PosHeldSale) return mockHeldSaleRepo;
      if (entity === PosHeldSaleItem) return mockHeldSaleItemRepo;
      if (entity === PosRegisterSession) return mockRegisterSessionRepo;
      if (entity === PosRefund) return mockRefundRepo;
      if (entity === PosRefundItem) return mockRefundItemRepo;
      if (entity === CatalogueItem) return mockProductRepo;
      if (entity === CatalogueOffer) return mockOfferRepo;
      if (entity === CatalogueOrder) return mockOrderRepo;
      if (entity === CatalogueOrderItem) return mockOrderItemRepo;
      if (entity === Business) return mockBusinessRepo;
      if (entity === Branch) return mockBranchRepo;
      if (entity === User) return mockUserRepo;
      if (entity === FinancialTransaction) return mockFosTransactionRepo;
      return null;
    }),
    findOne: jest.fn().mockImplementation((entity, options) => {
      const repo = mockEntityManager.getRepository(entity);
      return repo ? repo.findOne(options) : Promise.resolve(null);
    }),
    save: jest.fn().mockImplementation((entityOrObject, objectOrNothing) => {
      let entityClass = entityOrObject;
      let obj = objectOrNothing;
      if (!obj) {
        obj = entityOrObject;
        entityClass = entityOrObject.constructor;
      }
      const repo = mockEntityManager.getRepository(entityClass);
      if (repo) return repo.save(obj);
      return Promise.resolve(obj);
    }),
    count: jest.fn().mockImplementation((entity, options) => {
      const repo = mockEntityManager.getRepository(entity);
      return repo ? repo.count(options) : Promise.resolve(0);
    }),
    create: jest.fn().mockImplementation((entity, dto) => {
      const repo = mockEntityManager.getRepository(entity);
      return repo ? repo.create(dto) : dto;
    }),
  };

  const mockDataSource = {
    transaction: jest.fn().mockImplementation((cb) => cb(mockEntityManager)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PosService,
        { provide: DataSource, useValue: mockDataSource },
        { provide: getRepositoryToken(PosSale), useValue: mockSaleRepo },
        {
          provide: getRepositoryToken(PosSaleItem),
          useValue: mockSaleItemRepo,
        },
        {
          provide: getRepositoryToken(PosSplitPayment),
          useValue: mockSplitPaymentRepo,
        },
        {
          provide: getRepositoryToken(PosHeldSale),
          useValue: mockHeldSaleRepo,
        },
        {
          provide: getRepositoryToken(PosHeldSaleItem),
          useValue: mockHeldSaleItemRepo,
        },
        {
          provide: getRepositoryToken(PosRegisterSession),
          useValue: mockRegisterSessionRepo,
        },
        { provide: getRepositoryToken(PosRefund), useValue: mockRefundRepo },
        {
          provide: getRepositoryToken(PosRefundItem),
          useValue: mockRefundItemRepo,
        },
        {
          provide: getRepositoryToken(CatalogueItem),
          useValue: mockProductRepo,
        },
        {
          provide: getRepositoryToken(CatalogueOffer),
          useValue: mockOfferRepo,
        },
        {
          provide: getRepositoryToken(CatalogueOrder),
          useValue: mockOrderRepo,
        },
        {
          provide: getRepositoryToken(CatalogueOrderItem),
          useValue: mockOrderItemRepo,
        },
        { provide: getRepositoryToken(Business), useValue: mockBusinessRepo },
        { provide: getRepositoryToken(Branch), useValue: mockBranchRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        {
          provide: getRepositoryToken(FinancialTransaction),
          useValue: mockFosTransactionRepo,
        },
        {
          provide: PushNotificationService,
          useValue: mockPushNotificationService,
        },
        { provide: CatalogueOrderService, useValue: mockCatalogueOrderService },
        { provide: LoyaltyService, useValue: mockLoyaltyService },
      ],
    }).compile();

    service = module.get<PosService>(PosService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('completeSale', () => {
    it('should create a sale with cash payment successfully', async () => {
      mockBranchRepo.findOne.mockResolvedValue({
        id: 'br-1',
        businessId: 'bus-1',
      });
      mockProductRepo.findOne
        .mockResolvedValueOnce({ ...mockItem })
        .mockResolvedValueOnce({ ...mockItem2 });

      const result = await service.completeSale(
        {
          items: [
            { productId: 'prod-1', quantity: 2, discount: 0 },
            { productId: 'prod-2', quantity: 3, discount: 200 },
          ],
          payment: {
            method: PaymentMethod.CASH,
            amountPaid: 12000,
            change: 600,
          },
          branchId: 'br-1',
        },
        mockCashier,
      );

      expect(result).toBeDefined();
      expect(mockSaleRepo.save).toHaveBeenCalled();
      expect(mockProductRepo.save).toHaveBeenCalledTimes(2);
      expect(mockFosTransactionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          type: FosTransactionType.POS_SALE,
          platform: FosPlatform.VEMTAP,
        }),
      );
    });

    it('should deduct stock on completed sale', async () => {
      mockBranchRepo.findOne.mockResolvedValue({
        id: 'br-1',
        businessId: 'bus-1',
      });
      const p1 = { ...mockItem, stockQuantity: 10 };
      mockProductRepo.findOne.mockResolvedValueOnce(p1);

      await service.completeSale(
        {
          items: [{ productId: 'prod-1', quantity: 3, discount: 0 }],
          payment: { method: PaymentMethod.CASH, amountPaid: 13500, change: 0 },
          branchId: 'br-1',
        },
        mockCashier,
      );

      expect(mockProductRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'prod-1', stockQuantity: 7 }),
      );
    });

    it('should throw if insufficient stock', async () => {
      mockBranchRepo.findOne.mockResolvedValue({
        id: 'br-1',
        businessId: 'bus-1',
      });
      mockProductRepo.findOne.mockResolvedValueOnce({
        ...mockItem,
        stockQuantity: 1,
      });

      await expect(
        service.completeSale(
          {
            items: [{ productId: 'prod-1', quantity: 5, discount: 0 }],
            payment: {
              method: PaymentMethod.CASH,
              amountPaid: 1000,
              change: 0,
            },
            branchId: 'br-1',
          },
          mockCashier,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if branch not found', async () => {
      mockBranchRepo.findOne.mockResolvedValue(null);

      await expect(
        service.completeSale(
          {
            items: [{ productId: 'p1', quantity: 1 }],
            payment: { method: PaymentMethod.CASH, amountPaid: 100 },
            branchId: 'bad-br',
          },
          mockCashier,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if product not found', async () => {
      mockBranchRepo.findOne.mockResolvedValue({
        id: 'br-1',
        businessId: 'bus-1',
      });
      mockProductRepo.findOne.mockResolvedValue(null);

      await expect(
        service.completeSale(
          {
            items: [{ productId: 'unknown', quantity: 1 }],
            payment: { method: PaymentMethod.CASH, amountPaid: 100 },
            branchId: 'br-1',
          },
          mockCashier,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create split payment records for split method', async () => {
      mockBranchRepo.findOne.mockResolvedValue({
        id: 'br-1',
        businessId: 'bus-1',
      });
      mockProductRepo.findOne.mockResolvedValueOnce({
        ...mockItem,
        price: 10000,
      });

      const result = await service.completeSale(
        {
          items: [{ productId: 'prod-1', quantity: 1 }],
          payment: {
            method: PaymentMethod.SPLIT,
            amountPaid: 10000,
            change: 0,
            splitDetails: [
              { method: PaymentMethod.CASH, amount: 5000 },
              { method: PaymentMethod.TRANSFER, amount: 5000 },
            ],
          },
          branchId: 'br-1',
        },
        mockCashier,
      );

      expect(result).toBeDefined();
      expect(mockSaleRepo.save).toHaveBeenCalled();
    });

    it('should throw if split payment amounts do not sum to total', async () => {
      mockBranchRepo.findOne.mockResolvedValue({
        id: 'br-1',
        businessId: 'bus-1',
      });
      mockProductRepo.findOne.mockResolvedValueOnce({
        ...mockItem,
        price: 10000,
      });

      await expect(
        service.completeSale(
          {
            items: [{ productId: 'prod-1', quantity: 1 }],
            payment: {
              method: PaymentMethod.SPLIT,
              amountPaid: 10000,
              change: 0,
              splitDetails: [
                { method: PaymentMethod.CASH, amount: 3000 },
                { method: PaymentMethod.TRANSFER, amount: 3000 },
              ],
            },
            branchId: 'br-1',
          },
          mockCashier,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update customer lastActive', async () => {
      mockBranchRepo.findOne.mockResolvedValue({
        id: 'br-1',
        businessId: 'bus-1',
      });
      mockProductRepo.findOne.mockResolvedValueOnce({ ...mockItem });
      const customer = { id: 'cust-1', firstName: 'Jane', lastName: 'Doe' };
      mockUserRepo.findOne.mockResolvedValue(customer);

      await service.completeSale(
        {
          customerId: 'cust-1',
          items: [{ productId: 'prod-1', quantity: 1, discount: 0 }],
          payment: { method: PaymentMethod.CASH, amountPaid: 4500, change: 0 },
          branchId: 'br-1',
        },
        mockCashier,
      );

      expect(mockUserRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'cust-1', lastActive: expect.any(Date) }),
      );
    });

    it('should update open register expectedCash for cash sales', async () => {
      mockBranchRepo.findOne.mockResolvedValue({
        id: 'br-1',
        businessId: 'bus-1',
      });
      mockProductRepo.findOne.mockResolvedValueOnce({ ...mockItem });
      const openReg = {
        id: 'reg-1',
        cashierId: 'cashier-1',
        status: RegisterSessionStatus.OPEN,
        branchId: 'br-1',
        totalSales: 0,
        transactionCount: 0,
        expectedCash: 50000,
      };
      mockRegisterSessionRepo.findOne.mockResolvedValue(openReg);

      await service.completeSale(
        {
          items: [{ productId: 'prod-1', quantity: 1, discount: 0 }],
          payment: {
            method: PaymentMethod.CASH,
            amountPaid: 5000,
            change: 500,
          },
          branchId: 'br-1',
        },
        mockCashier,
      );

      expect(mockRegisterSessionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          totalSales: 4500,
          transactionCount: 1,
          expectedCash: 55000,
        }),
      );
    });
  });

  describe('adjustStock', () => {
    it('should update stock quantity and auto-update status', async () => {
      mockProductRepo.findOne.mockResolvedValue({
        ...mockItem,
        stockQuantity: 50,
        status: CatalogueItemStatus.LOW_STOCK,
      });

      await service.adjustStock('prod-1', 'bus-1', 100);

      expect(mockProductRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          stockQuantity: 100,
          status: CatalogueItemStatus.ACTIVE,
        }),
      );
    });

    it('should throw if product not found', async () => {
      mockProductRepo.findOne.mockResolvedValue(null);

      await expect(service.adjustStock('bad-id', 'bus-1', 10)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAllSales', () => {
    it('should return paginated sales', async () => {
      const result = await service.findAllSales('bus-1', {
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockSaleRepo.createQueryBuilder).toHaveBeenCalled();
    });

    it('should apply search filter', async () => {
      await service.findAllSales('bus-1', { search: 'RCT-001' });

      expect(mockSaleRepo.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('findOneSale', () => {
    it('should return a sale by id', async () => {
      mockSaleRepo.findOne.mockResolvedValue({
        id: 'sale-1',
        businessId: 'bus-1',
      });

      const result = await service.findOneSale('sale-1', 'bus-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('sale-1');
    });

    it('should throw if not found', async () => {
      mockSaleRepo.findOne.mockResolvedValue(null);

      await expect(service.findOneSale('bad-id', 'bus-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateSaleStatus', () => {
    it('should refund a completed sale', async () => {
      const saleObj = {
        id: 'sale-1',
        businessId: 'bus-1',
        status: SaleStatus.COMPLETED,
        total: 1000,
        paymentMethod: PaymentMethod.CASH,
        receiptNumber: 'RCT-001',
        items: [{ productId: 'prod-1', quantity: 2, productName: 'Burger' }],
      };
      mockSaleRepo.findOne.mockImplementation(() => Promise.resolve(saleObj));
      mockSaleRepo.save.mockImplementation((s) => {
        Object.assign(saleObj, s);
        return Promise.resolve(saleObj);
      });
      mockProductRepo.findOne.mockResolvedValue({
        ...mockItem,
        stockQuantity: 10,
      });

      const result = await service.updateSaleStatus(
        'sale-1',
        { status: SaleStatus.REFUNDED },
        'bus-1',
      );

      expect(result.status).toBe(SaleStatus.REFUNDED);
      expect(mockProductRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'prod-1', stockQuantity: 12 }),
      );
      expect(mockFosTransactionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          type: FosTransactionType.POS_REFUND,
          amount: -1000,
        }),
      );
    });

    it('should throw if sale is not completed', async () => {
      mockSaleRepo.findOne.mockResolvedValue({
        id: 'sale-1',
        businessId: 'bus-1',
        status: SaleStatus.REFUNDED,
      });

      await expect(
        service.updateSaleStatus(
          'sale-1',
          { status: SaleStatus.REFUNDED },
          'bus-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('holdSale / findAllHeldSales / resumeHeldSale / deleteHeldSale', () => {
    it('should hold a sale', async () => {
      mockBranchRepo.findOne.mockResolvedValue({
        id: 'br-1',
        businessId: 'bus-1',
      });

      const result = await service.holdSale(
        {
          branchId: 'br-1',
          items: [
            {
              productId: 'prod-1',
              productName: 'Burger',
              unitPrice: 4500,
              quantity: 2,
              totalPrice: 9000,
            },
          ],
          note: 'Waiting for customer',
        },
        mockCashier,
      );

      expect(result).toBeDefined();
      expect(mockHeldSaleRepo.save).toHaveBeenCalled();
    });

    it('should list held sales', async () => {
      mockHeldSaleRepo.find.mockResolvedValue([{ id: 'held-1', items: [] }]);

      const result = await service.findAllHeldSales('bus-1');

      expect(result).toHaveLength(1);
    });

    it('should resume a held sale', async () => {
      mockHeldSaleRepo.findOne.mockResolvedValue({
        id: 'held-1',
        businessId: 'bus-1',
        items: [],
        customer: null,
      });

      const result = await service.resumeHeldSale('held-1', 'bus-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('held-1');
    });

    it('should throw on resume if not found', async () => {
      mockHeldSaleRepo.findOne.mockResolvedValue(null);
      await expect(service.resumeHeldSale('bad-id', 'bus-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should delete a held sale', async () => {
      const result = await service.deleteHeldSale('held-1', 'bus-1');

      expect(result.message).toBe('Held sale deleted');
      expect(mockHeldSaleRepo.softDelete).toHaveBeenCalledWith({
        id: 'held-1',
        businessId: 'bus-1',
      });
    });

    it('should throw if held sale not found on delete', async () => {
      mockHeldSaleRepo.softDelete.mockResolvedValue({ affected: 0 });

      await expect(service.deleteHeldSale('bad-id', 'bus-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('openRegister / closeRegister / getRegisterStatus', () => {
    it('should open a register', async () => {
      mockRegisterSessionRepo.findOne.mockResolvedValue(null);

      const result = await service.openRegister(
        { openingCash: 50000 },
        mockCashier,
      );

      expect(result).toBeDefined();
      expect(mockRegisterSessionRepo.save).toHaveBeenCalled();
    });

    it('should throw if register already open', async () => {
      mockRegisterSessionRepo.findOne.mockResolvedValue({
        id: 'reg-1',
        status: RegisterSessionStatus.OPEN,
      });

      await expect(
        service.openRegister({ openingCash: 50000 }, mockCashier),
      ).rejects.toThrow(BadRequestException);
    });

    it('should close a register and recalculate from today sales', async () => {
      mockRegisterSessionRepo.findOne.mockResolvedValue({
        id: 'reg-1',
        status: RegisterSessionStatus.OPEN,
        openingCash: 50000,
        expectedCash: 50000,
        totalSales: 0,
        transactionCount: 0,
      });
      mockSaleRepo.find.mockResolvedValue([
        {
          paymentMethod: PaymentMethod.CASH,
          amountPaid: 5000,
          total: 4500,
          status: SaleStatus.COMPLETED,
        },
        {
          paymentMethod: PaymentMethod.TRANSFER,
          amountPaid: 10000,
          total: 10000,
          status: SaleStatus.COMPLETED,
        },
      ]);

      const result = await service.closeRegister(mockCashier);

      expect(result.status).toBe(RegisterSessionStatus.CLOSED);
      expect(result.closedAt).toBeDefined();
      expect(result.expectedCash).toBe(55000);
      expect(result.totalSales).toBe(14500);
      expect(result.transactionCount).toBe(2);
    });

    it('should throw close if no open register', async () => {
      mockRegisterSessionRepo.findOne.mockResolvedValue(null);
      await expect(service.closeRegister(mockCashier)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return register status', async () => {
      mockRegisterSessionRepo.findOne.mockResolvedValue({
        id: 'reg-1',
        status: RegisterSessionStatus.OPEN,
      });

      const result = await service.getRegisterStatus(mockCashier);

      expect(result.isOpen).toBe(true);
      expect(result.session).toBeDefined();
    });
  });

  describe('getDashboard', () => {
    it('should return dashboard stats for today', async () => {
      const mockSales = [
        {
          total: 15000,
          paymentMethod: PaymentMethod.CASH,
          status: SaleStatus.COMPLETED,
        },
        {
          total: 20000,
          paymentMethod: PaymentMethod.TRANSFER,
          status: SaleStatus.COMPLETED,
        },
      ];
      mockSaleRepo.find.mockResolvedValue(mockSales);

      const result = await service.getDashboard('bus-1');

      expect(result.revenue).toBe(35000);
      expect(result.transactionCount).toBe(2);
      expect(result.averageSaleValue).toBe(17500);
      expect(result.paymentBreakdown.cash).toBe(15000);
      expect(result.paymentBreakdown.transfer).toBe(20000);
    });
  });

  describe('getTopProducts', () => {
    it('should return top products by quantity', async () => {
      mockSaleItemRepo.find.mockResolvedValue([
        {
          productId: 'p1',
          productName: 'Burger',
          quantity: 5,
          totalPrice: 22500,
          sale: {},
        },
        {
          productId: 'p1',
          productName: 'Burger',
          quantity: 3,
          totalPrice: 13500,
          sale: {},
        },
        {
          productId: 'p2',
          productName: 'Fries',
          quantity: 10,
          totalPrice: 20000,
          sale: {},
        },
      ]);

      const result = await service.getTopProducts('bus-1');

      expect(result).toHaveLength(2);
      expect(result[0].productId).toBe('p2');
      expect(result[0].quantity).toBe(10);
      expect(result[1].productId).toBe('p1');
      expect(result[1].quantity).toBe(8);
    });
  });

  describe('Offline Sync & Idempotency', () => {
    let originalFindOne: unknown;

    beforeEach(() => {
      originalFindOne = mockSaleRepo.findOne;
      mockSaleRepo.findOne = jest
        .fn()
        .mockImplementation(
          (options: { where?: Record<string, string | null | undefined> }) => {
            const where = options?.where;
            if (!where) return Promise.resolve(null);

            // If searching by clientRef (idempotency check)
            if ('clientRef' in where) {
              if (where.clientRef === 'existing-sale-uuid') {
                return Promise.resolve({
                  id: 'existing-sale-uuid',
                  businessId: where.businessId,
                  clientRef: where.clientRef,
                } as unknown as PosSale);
              }
              return Promise.resolve(null);
            }

            // If searching by id (findOneSale)
            return Promise.resolve({
              id: where.id || 'sale-1',
              businessId: where.businessId,
              clientRef: where.clientRef || null,
              items: [],
              splitPayments: [],
            } as unknown as PosSale);
          },
        );
    });

    afterEach(() => {
      mockSaleRepo.findOne = originalFindOne;
    });

    it('should complete sale and save clientRef and orderedAt when provided', async () => {
      mockBranchRepo.findOne.mockResolvedValue({
        id: 'br-1',
        businessId: 'bus-1',
      });
      mockProductRepo.findOne.mockResolvedValue({
        id: 'prod-1',
        name: 'Product 1',
        price: 5000,
        stockQuantity: 10,
        enableLoyaltyPoints: false,
      });

      const clientRef = 'e3b8a36c-9411-4770-b1ff-92135c345388';
      const orderedAtStr = '2026-06-28T10:00:00.000Z';

      const result = await service.completeSale(
        {
          items: [{ productId: 'prod-1', quantity: 1, discount: 0 }],
          payment: {
            method: PaymentMethod.CASH,
            amountPaid: 5000,
            change: 0,
          },
          branchId: 'br-1',
          clientRef,
          orderedAt: orderedAtStr,
        },
        {
          id: 'cashier-1',
          businessId: 'bus-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        } as User,
      );

      expect(result).toBeDefined();
      expect(mockSaleRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          clientRef,
          orderedAt: new Date(orderedAtStr),
        }),
      );
    });

    it('should return existing sale if clientRef already exists for the business (idempotency)', async () => {
      mockBranchRepo.findOne.mockResolvedValue({
        id: 'br-1',
        businessId: 'bus-1',
      });

      const clientRef = 'existing-sale-uuid';

      const result = await service.completeSale(
        {
          items: [{ productId: 'prod-1', quantity: 1, discount: 0 }],
          payment: {
            method: PaymentMethod.CASH,
            amountPaid: 5000,
            change: 0,
          },
          branchId: 'br-1',
          clientRef,
        },
        {
          id: 'cashier-1',
          businessId: 'bus-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        } as User,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('existing-sale-uuid');
    });

    it('should throw BadRequestException if branch does not belong to the cashier business', async () => {
      mockBranchRepo.findOne.mockResolvedValue({
        id: 'br-1',
        businessId: 'bus-other',
      });

      await expect(
        service.completeSale(
          {
            items: [{ productId: 'prod-1', quantity: 1 }],
            payment: {
              method: PaymentMethod.CASH,
              amountPaid: 5000,
            },
            branchId: 'br-1',
          },
          { id: 'cashier-1', businessId: 'bus-1' } as User,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('batchSyncSales', () => {
    let originalFindOne: unknown;

    beforeEach(() => {
      originalFindOne = mockSaleRepo.findOne;
      mockSaleRepo.findOne = jest
        .fn()
        .mockImplementation(
          (options: { where?: Record<string, string | null | undefined> }) => {
            const where = options?.where;
            if (!where) return Promise.resolve(null);

            // If searching by clientRef (idempotency check)
            if ('clientRef' in where) {
              return Promise.resolve(null);
            }

            // If searching by id (findOneSale)
            return Promise.resolve({
              id: where.id || 'sale-1',
              businessId: where.businessId,
              clientRef: where.clientRef || null,
              items: [],
              splitPayments: [],
            } as unknown as PosSale);
          },
        );
    });

    afterEach(() => {
      mockSaleRepo.findOne = originalFindOne;
    });

    it('should process multiple sales and return status list', async () => {
      mockBranchRepo.findOne.mockResolvedValue({
        id: 'br-1',
        businessId: 'bus-1',
      });
      mockProductRepo.findOne.mockResolvedValue({
        id: 'prod-1',
        name: 'Product 1',
        price: 5000,
        stockQuantity: 10,
      });

      const dtos = [
        {
          items: [{ productId: 'prod-1', quantity: 1 }],
          payment: { method: PaymentMethod.CASH, amountPaid: 5000 },
          branchId: 'br-1',
          clientRef: 'ref-1',
        },
        {
          items: [{ productId: 'prod-1', quantity: 1 }],
          payment: { method: PaymentMethod.CASH, amountPaid: 5000 },
          branchId: 'br-1',
          clientRef: 'ref-2',
        },
      ];

      const results = await service.batchSyncSales(dtos, {
        id: 'cashier-1',
        businessId: 'bus-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      } as User);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(results[0].clientRef).toBe('ref-1');
      expect(results[1].clientRef).toBe('ref-2');
    });
  });
});
