import { Test, TestingModule } from '@nestjs/testing';
import { FosPnlController } from './fos-pnl.controller';
import { FosPnlService } from './fos-pnl.service';

describe('FosPnlController', () => {
  let controller: FosPnlController;
  let service: FosPnlService;

  const mockService = {
    getBreakEven: jest.fn(),
    getRunway: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FosPnlController],
      providers: [
        {
          provide: FosPnlService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<FosPnlController>(FosPnlController);
    service = module.get<FosPnlService>(FosPnlService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getBreakEven', () => {
    it('should return break-even analysis', async () => {
      const result = {
        activeBusinesses: 340,
        arpu: 3676.47,
        breakEvenBusinesses: 200,
        breakEvenRevenue: 735294,
        progressPercent: 58.82,
        remainingGap: 514706,
        isProfitable: false,
        totalMonthlyCosts: 500000,
        monthlyFixedCosts: 250000,
        grossRevenue: 1250000,
      };
      mockService.getBreakEven.mockResolvedValue(result);

      expect(await controller.getBreakEven()).toEqual(result);
      expect(service.getBreakEven).toHaveBeenCalled();
    });
  });

  describe('getRunway', () => {
    it('should return cash runway data', async () => {
      const result = {
        openingCashBalance: 2500000,
        closingCashBalance: 2100000,
        monthlyNetCashFlow: -400000,
        monthlyBurnRate: 400000,
        runwayMonths: 5.25,
      };
      mockService.getRunway.mockResolvedValue(result);

      expect(await controller.getRunway()).toEqual(result);
      expect(service.getRunway).toHaveBeenCalled();
    });
  });
});
