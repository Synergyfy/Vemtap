import { Test, TestingModule } from '@nestjs/testing';
import { PosController } from './pos.controller';
import { PosService } from './pos.service';
import { PaymentMethod } from './entities/pos-enums';
import { User, UserRole } from '../users/entities/user.entity';

describe('PosController', () => {
  let controller: PosController;
  let service: PosService;

  const mockPosService = {
    completeSale: jest.fn(),
    findAllSales: jest.fn(),
    findOneSale: jest.fn(),
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
      providers: [{ provide: PosService, useValue: mockPosService }],
    }).compile();

    controller = module.get<PosController>(PosController);
    service = module.get<PosService>(PosService);
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

      expect(mockPosService.completeSale).toHaveBeenCalledWith(dto, mockUser);
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
    it('should call service.findOneSale with id and businessId', async () => {
      await controller.getSale('sale-1', mockReq);

      expect(mockPosService.findOneSale).toHaveBeenCalledWith(
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
      await controller.listHeldSales('br-1', mockReq);

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
      await controller.closeRegister(mockReq);

      expect(mockPosService.closeRegister).toHaveBeenCalledWith(mockUser);
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
      await controller.getDashboard('br-1', mockReq);

      expect(mockPosService.getDashboard).toHaveBeenCalledWith('bus-1', 'br-1');
    });
  });

  describe('getTopProducts', () => {
    it('should call service.getTopProducts', async () => {
      await controller.getTopProducts('br-1', mockReq);

      expect(mockPosService.getTopProducts).toHaveBeenCalledWith(
        'bus-1',
        'br-1',
      );
    });
  });

  describe('adjustStock', () => {
    it('should call service.adjustStock', async () => {
      await controller.adjustStock('prod-1', 50, mockReq);

      expect(mockPosService.adjustStock).toHaveBeenCalledWith(
        'prod-1',
        'bus-1',
        50,
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
