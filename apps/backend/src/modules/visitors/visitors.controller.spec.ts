import { Test, TestingModule } from '@nestjs/testing';
import { VisitorsController } from './visitors.controller';
import { VisitorsService } from './visitors.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { User, UserRole } from '../users/entities/user.entity';

describe('VisitorsController', () => {
  let controller: VisitorsController;
  let service: VisitorsService;

  const mockVisitorsService = {
    getVisitedBranches: jest.fn(),
    checkBranchAccess: jest.fn(),
  };

  const mockLoyaltyService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VisitorsController],
      providers: [
        { provide: VisitorsService, useValue: mockVisitorsService },
        { provide: LoyaltyService, useValue: mockLoyaltyService },
      ],
    }).compile();

    controller = module.get<VisitorsController>(VisitorsController);
    service = module.get<VisitorsService>(VisitorsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getVisitedBranches', () => {
    it('should call service.getVisitedBranches with customer id', async () => {
      const mockUser = { id: 'cust-1', role: UserRole.CUSTOMER } as User;
      const query = { page: 1, limit: 10, search: 'branch' };
      
      await controller.getVisitedBranches({ user: mockUser }, query);
      
      expect(service.getVisitedBranches).toHaveBeenCalledWith(mockUser.id, query);
    });
  });
});
