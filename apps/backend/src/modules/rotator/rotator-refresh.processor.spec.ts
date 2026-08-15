import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bullmq';
import { RotatorRefreshProcessor } from './rotator-refresh.processor';
import { RotatorAnalyticsService } from './rotator-analytics.service';
import { RotatorEventType } from './entities/rotator-impression.entity';

describe('RotatorRefreshProcessor', () => {
  let processor: RotatorRefreshProcessor;

  const analytics = {
    persistImpressions: jest.fn().mockResolvedValue(undefined),
    persistViewOrClick: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RotatorRefreshProcessor,
        { provide: RotatorAnalyticsService, useValue: analytics },
      ],
    }).compile();

    processor = module.get(RotatorRefreshProcessor);
  });

  it('persists impression jobs', async () => {
    await processor.process({
      name: 'record-impressions',
      data: {
        clusterId: 'cl-1',
        offerIds: ['o1', 'o2'],
        windowId: 42,
        sessionToken: '11111111-1111-1111-1111-111111111111',
      },
    } as Job);

    expect(analytics.persistImpressions).toHaveBeenCalledTimes(1);
    expect(analytics.persistImpressions).toHaveBeenCalledWith(
      expect.objectContaining({ clusterId: 'cl-1', offerIds: ['o1', 'o2'] }),
    );
    expect(analytics.persistViewOrClick).not.toHaveBeenCalled();
  });

  it('persists view/click jobs', async () => {
    await processor.process({
      name: 'record-view-click',
      data: {
        eventType: RotatorEventType.CLICK,
        clusterId: 'cl-1',
        offerId: 'o1',
        windowId: 42,
        sessionToken: '11111111-1111-1111-1111-111111111111',
      },
    } as Job);

    expect(analytics.persistViewOrClick).toHaveBeenCalledTimes(1);
    expect(analytics.persistViewOrClick).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: RotatorEventType.CLICK,
        offerId: 'o1',
      }),
    );
    expect(analytics.persistImpressions).not.toHaveBeenCalled();
  });

  it('ignores unknown job names', async () => {
    await processor.process({
      name: 'something-else',
      data: {},
    } as Job);

    expect(analytics.persistImpressions).not.toHaveBeenCalled();
    expect(analytics.persistViewOrClick).not.toHaveBeenCalled();
  });
});
