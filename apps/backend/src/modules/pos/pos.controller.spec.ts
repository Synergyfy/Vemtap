import { Test, TestingModule } from '@nestjs/testing';
import { PosController } from './pos.controller';
import { PosService } from './pos.service';
import { PosSettingsService } from './pos-settings.service';
import { PosTillsService } from './pos-tills.service';
import { PosPeripheralsService } from './pos-peripherals.service';
import { PosStaffPinsService } from './pos-staff-pins.service';
import { PaymentMethod } from './entities/pos-enums';
import { User, UserRole } from '../users/entities/user.entity';

describe('PosController', () => {
  let controller: PosController;

  const mockPosService = {
    completeSale: jest.fn(),
    findAllSales: jest.fn(),
    findOneSale: jest.fn(),
    getSaleDetail: jest.fn(),
    getCustomerRewards: jest.fn(),
    updateSaleStatus: jest.fn(),
    holdSale: jest.fn(),
    findAllHeldSales: jest.fn(),
    resumeHeldSale: jest.fn(),
    deleteHeldSale: jest.fn(),
    openRegister: jest.fn(),
    closeRegister: jest.fn(),
    getRegisterStatus: jest.fn(),
    getRegisterHistory: jest.fn(),
    getDashboard: jest.fn(),
    getTopProducts: jest.fn(),
    adjustStock: jest.fn(),
    batchSyncSales: jest.fn(),
  };

  const mockPosSettingsService = {
    get: jest.fn(),
    update: jest.fn(),
    summary: jest.fn(),
  };

  const mockTillsService = {
    count: jest.fn(),
    branchSummary: jest.fn(),
  };

  const mockUser: User = {
    id: 'user-1',
    businessId: 'bus-1',
    branchId: 'br-1',
    role: UserRole.STAFF,
    firstName: 'Test',
    lastName: 'User',
    email: 'test@test.com',
  } as any;

  const mockReq = { user: mockUser } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PosController],
      providers: [
        { provide: PosService, useValue: mockPosService },
        { provide: PosSettingsService, useValue: mockPosSettingsService },
        { provide: PosTillsService, useValue: mockTillsService },
        { provide: PosPeripheralsService, useValue: { count: jest.fn() } },
        { provide: PosStaffPinsService, useValue: { count: jest.fn() } },
      ],
    }).compile();

    controller = module.get<PosController>(PosController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('completeSale', () => {
    it('should call service.completeSale with dto and user', async () => {
      const dto = {
        items: [{ productId: 'p1', quantity: 2 }],
        payment: { method: PaymentMethod.CASH, amountPaid: 9000 },
        branchId: 'br-1',
      };

      await controller.completeSale(dto, mockReq);

      expect(mockPosService.completeSale).toHaveBeenCalledWith(dto, mockUser, {
        enforceDiscountPolicy: true,
      });
    });
  });

  describe('listSales', () => {
    it('should call service.findAllSales with businessId and query', async () => {
      const query = { page: 1, limit: 10 };

      await controller.listSales(query, mockReq);

      expect(mockPosService.findAllSales).toHaveBeenCalledWith('bus-1', query);
    });
  });

  describe('getSale', () => {
    it('should call service.getSaleDetail with id and businessId', async () => {
      await controller.getSale('sale-1', mockReq);

      expect(mockPosService.getSaleDetail).toHaveBeenCalledWith(
        'sale-1',
        'bus-1',
      );
    });
  });

  describe('updateSaleStatus', () => {
    it('should call service.updateSaleStatus', async () => {
      const dto = { status: 'refunded' as any };

      await controller.updateSaleStatus('sale-1', dto, mockReq);

      expect(mockPosService.updateSaleStatus).toHaveBeenCalledWith(
        'sale-1',
        dto,
        'bus-1',
        'user-1',
        mockUser,
      );
    });
  });

  describe('holdSale', () => {
    it('should call service.holdSale', async () => {
      const dto = { branchId: 'br-1', items: [] };

      await controller.holdSale(dto, mockReq);

      expect(mockPosService.holdSale).toHaveBeenCalledWith(dto, mockUser);
    });
  });

  describe('listHeldSales', () => {
    it('should call service.findAllHeldSales', async () => {
      await controller.listHeldSales({ branchId: 'br-1' }, mockReq);

      expect(mockPosService.findAllHeldSales).toHaveBeenCalledWith(
        'bus-1',
        'br-1',
      );
    });
  });

  describe('getHeldSale', () => {
    it('should call service.resumeHeldSale', async () => {
      await controller.getHeldSale('held-1', mockReq);

      expect(mockPosService.resumeHeldSale).toHaveBeenCalledWith(
        'held-1',
        'bus-1',
      );
    });
  });

  describe('deleteHeldSale', () => {
    it('should call service.deleteHeldSale', async () => {
      await controller.deleteHeldSale('held-1', mockReq);

      expect(mockPosService.deleteHeldSale).toHaveBeenCalledWith(
        'held-1',
        'bus-1',
      );
    });
  });

  describe('openRegister', () => {
    it('should call service.openRegister', async () => {
      const dto = { openingCash: 50000 };

      await controller.openRegister(dto, mockReq);

      expect(mockPosService.openRegister).toHaveBeenCalledWith(dto, mockUser);
    });
  });

  describe('closeRegister', () => {
    it('should call service.closeRegister', async () => {
      await controller.closeRegister({}, mockReq);

      expect(mockPosService.closeRegister).toHaveBeenCalledWith(mockUser, {});
    });

    it('should forward the counted cash so the drawer can be reconciled', async () => {
      const dto = { countedCash: 342850 };

      await controller.closeRegister(dto, mockReq);

      expect(mockPosService.closeRegister).toHaveBeenCalledWith(mockUser, dto);
    });
  });

  describe('getRegisterStatus', () => {
    it('should call service.getRegisterStatus', async () => {
      await controller.getRegisterStatus(mockReq);

      expect(mockPosService.getRegisterStatus).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getRegisterHistory', () => {
    it('should call service.getRegisterHistory', async () => {
      const query = { page: 1, limit: 10 };

      await controller.getRegisterHistory(query, mockReq);

      expect(mockPosService.getRegisterHistory).toHaveBeenCalledWith(
        'bus-1',
        query,
      );
    });
  });

  describe('getDashboard', () => {
    it('should call service.getDashboard', async () => {
      await controller.getDashboard({ branchId: 'br-1' }, mockReq);

      expect(mockPosService.getDashboard).toHaveBeenCalledWith('bus-1', 'br-1');
    });
  });

  describe('getTopProducts', () => {
    it('should call service.getTopProducts', async () => {
      await controller.getTopProducts({ branchId: 'br-1' }, mockReq);

      expect(mockPosService.getTopProducts).toHaveBeenCalledWith(
        'bus-1',
        'br-1',
      );
    });
  });

  describe('adjustStock', () => {
    it('should call service.adjustStock', async () => {
      await controller.adjustStock(
        'prod-1',
        { quantity: 50, reason: 'Recount' },
        mockReq,
      );

      expect(mockPosService.adjustStock).toHaveBeenCalledWith(
        'prod-1',
        'bus-1',
        50,
        { reason: 'Recount', userId: 'user-1', branchId: 'br-1' },
      );
    });
  });

  describe('settings', () => {
    it('reads the settings for the caller business', async () => {
      await controller.getSettings(mockReq);
      expect(mockPosSettingsService.get).toHaveBeenCalledWith('bus-1');
    });

    it('updates the settings for the caller business only', async () => {
      const dto = { taxEnabled: true, taxRate: 7.5 };
      await controller.updateSettings(dto, mockReq);
      expect(mockPosSettingsService.update).toHaveBeenCalledWith('bus-1', dto);
    });
  });

  describe('branch summary', () => {
    it('marks the caller branch as current', async () => {
      await controller.getBranchSummary(mockReq);
      expect(mockTillsService.branchSummary).toHaveBeenCalledWith(
        'bus-1',
        'br-1',
      );
    });
  });

  describe('getCustomerRewards', () => {
    it('scopes the lookup to the caller business and branch filter', async () => {
      await controller.getCustomerRewards(
        'cust-1',
        { branchId: 'br-1' },
        mockReq,
      );
      expect(mockPosService.getCustomerRewards).toHaveBeenCalledWith(
        'cust-1',
        'bus-1',
        'br-1',
      );
    });
  });

  describe('batchSyncSales', () => {
    it('should call service.batchSyncSales with dtos and user', async () => {
      const dtos = [{ items: [], payment: {} as any, branchId: 'br-1' }];

      await controller.batchSyncSales(dtos, mockReq);

      expect(mockPosService.batchSyncSales).toHaveBeenCalledWith(
        dtos,
        mockUser,
      );
    });
  });
});
