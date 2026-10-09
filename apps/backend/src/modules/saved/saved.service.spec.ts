import { Test, TestingModule } from '@nestjs/testing';
import { SavedService } from './saved.service';
import { SavedItemType } from './dto/saved.dto';
/**
 * Repositories are provided by entity *name* rather than by importing the
 * classes: importing entities across module barrels here trips a circular
 * dependency at DI time.
 */
const REPO = {
  business: 'SavedBusinessRepository',
  service: 'SavedServiceRepository',
  deal: 'DealSaveRepository',
  businessEntity: 'BusinessRepository',
  item: 'CatalogueItemRepository',
} as const;

/**
 * The unified feed already reads all three stores to merge them, so it can
 * report each store's count for free. These cover when that breakdown is
 * present and — more importantly — when it must be absent.
 */
describe('SavedService.getUnifiedSaved', () => {
  // TypeORM's findAndCount resolves to a [rows, total] tuple.
  const emptyPage = (total: number): [unknown[], number] => [[], total];

  const dealSaveRepo = { findAndCount: jest.fn() };
  const businessRepo = { findAndCount: jest.fn() };
  const serviceRepo = { findAndCount: jest.fn() };

  let service: SavedService;

  const build = (counts: {
    deals: number;
    businesses: number;
    services: number;
  }) => {
    dealSaveRepo.findAndCount.mockResolvedValue(emptyPage(counts.deals));
    businessRepo.findAndCount.mockResolvedValue(emptyPage(counts.businesses));
    serviceRepo.findAndCount.mockResolvedValue(emptyPage(counts.services));
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SavedService,
        { provide: REPO.business, useValue: businessRepo },
        { provide: REPO.service, useValue: serviceRepo },
        { provide: REPO.deal, useValue: dealSaveRepo },
        { provide: REPO.businessEntity, useValue: {} },
        { provide: REPO.item, useValue: {} },
      ],
    }).compile();

    service = module.get<SavedService>(SavedService);
  });

  afterEach(() => jest.clearAllMocks());

  it('reports every store count when no type filter is sent', async () => {
    build({ deals: 4, businesses: 3, services: 2 });

    const result = await service.getUnifiedSaved('user-1', {});

    expect(result.totals).toEqual({
      all: 9,
      deals: 4,
      businesses: 3,
      services: 2,
    });
    // The tab badges must agree with the envelope's own total.
    expect(result.totals?.all).toBe(result.total);
  });

  it('omits the breakdown for a filtered read', async () => {
    // A `type` read skips the other stores, so their counts are unknown rather
    // than zero; reporting 0 would be a false statement about the account.
    build({ deals: 4, businesses: 0, services: 0 });

    const result = await service.getUnifiedSaved('user-1', {
      type: SavedItemType.DEAL,
    });

    expect(result.totals).toBeUndefined();
    expect(result.total).toBe(4);
  });

  it('adds no queries to report the breakdown', async () => {
    build({ deals: 4, businesses: 3, services: 2 });

    await service.getUnifiedSaved('user-1', {});

    // One read per store, as before — the totals reuse what is already fetched.
    expect(dealSaveRepo.findAndCount).toHaveBeenCalledTimes(1);
    expect(businessRepo.findAndCount).toHaveBeenCalledTimes(1);
    expect(serviceRepo.findAndCount).toHaveBeenCalledTimes(1);
  });
});
