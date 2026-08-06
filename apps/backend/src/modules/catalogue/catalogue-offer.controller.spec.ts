import { Test, TestingModule } from '@nestjs/testing';
import { CatalogueOfferController } from './catalogue-offer.controller';
import { CatalogueOfferService } from './catalogue-offer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

describe('CatalogueOfferController', () => {
  let controller: CatalogueOfferController;
  let service: any;

  const mockOfferService = {
    generateTerms: jest.fn(),
    createOffer: jest.fn(),
    updateOffer: jest.fn(),
    deleteOffer: jest.fn(),
    findOneOffer: jest.fn(),
    findAllOffersAdmin: jest.fn(),
    findAllOffersPublicGlobal: jest.fn(),
    findAllOffersPublic: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CatalogueOfferController],
      providers: [
        {
          provide: CatalogueOfferService,
          useValue: mockOfferService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CatalogueOfferController>(
      CatalogueOfferController,
    );
    service = module.get<CatalogueOfferService>(CatalogueOfferService);
  });

  describe('generateTerms', () => {
    it('should call offerService.generateTerms with dto and req.user.businessId', async () => {
      const dto = { title: 'BOGO Pizza', description: 'Buy one get one free' };
      const req = { user: { businessId: 'biz-123' } };
      const expectedResult = {
        terms: ['Valid for BOGO Pizza', 'Cannot be combined with other offers'],
      };

      mockOfferService.generateTerms.mockResolvedValue(expectedResult);

      const result = await controller.generateTerms(dto, req);

      expect(service.generateTerms).toHaveBeenCalledWith(dto, 'biz-123');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('createOffer', () => {
    it('should create an offer including delivery fields and longDescription', async () => {
      const dto: any = {
        name: 'Summer Sale',
        description: 'Short text',
        deliveryScope: 'city_wide',
        deliveryRadius: 15,
        deliveryUnit: 'km',
        deliveryRegion: 'Lagos State',
        minOrderAmount: 2000,
        longDescription: 'Extended description text for details tab',
        pricingType: 'sum',
        branchId: 'branch-1',
        itemIds: ['item-1'],
      };
      const req = { user: { businessId: 'biz-123' } };
      const expectedOffer = { id: 'offer-1', ...dto, businessId: 'biz-123' };

      mockOfferService.createOffer.mockResolvedValue(expectedOffer);

      const result = await controller.createOffer(dto, req);

      expect(service.createOffer).toHaveBeenCalledWith(dto, 'biz-123');
      expect(result).toEqual(expectedOffer);
    });
  });

  describe('getOfferPublic', () => {
    it('should return public offer detail with longDescription', async () => {
      const expectedOffer = {
        id: 'offer-1',
        name: 'Summer Sale',
        description: 'Short description',
        longDescription: 'Extended detailed description for UI details tab',
        terms: ['Valid today'],
      };

      mockOfferService.findOneOffer.mockResolvedValue(expectedOffer);

      const result = await controller.getOfferPublic('offer-1');

      expect(service.findOneOffer).toHaveBeenCalledWith('offer-1');
      expect(result).toEqual(expectedOffer);
      expect(result.longDescription).toBeDefined();
    });
  });
});
