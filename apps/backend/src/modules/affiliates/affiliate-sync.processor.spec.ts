import { AffiliateSyncProcessor } from './affiliate-sync.processor';
import {
  ExternalAffiliateService,
  AffiliateSyncError,
} from './external-affiliate.service';

describe('AffiliateSyncProcessor', () => {
  let processor: AffiliateSyncProcessor;
  let externalService: { recordReferral: jest.Mock; processWithdrawal: jest.Mock };

  beforeEach(() => {
    externalService = {
      recordReferral: jest.fn(),
      processWithdrawal: jest.fn(),
    };
    processor = new AffiliateSyncProcessor(
      externalService as unknown as ExternalAffiliateService,
    );
  });

  const job = (name: string, data: any, id = 'job-1') =>
    ({ name, data, id }) as any;

  it('does not retry terminal errors (4xx)', async () => {
    externalService.recordReferral.mockRejectedValue(
      new AffiliateSyncError('Not found', false, 404),
    );

    await expect(
      processor.process(
        job('record-referral', { email: 'a@b.com', externalReference: 'b1' }),
      ),
    ).resolves.toBeUndefined();
  });

  it('retries transient errors by throwing', async () => {
    externalService.recordReferral.mockRejectedValue(
      new AffiliateSyncError('Upstream down', true, 503),
    );

    await expect(
      processor.process(
        job('record-referral', { email: 'a@b.com', externalReference: 'b1' }),
      ),
    ).rejects.toThrow('Upstream down');
  });

  it('retries network errors by throwing', async () => {
    externalService.processWithdrawal.mockRejectedValue(
      new Error('ECONNREFUSED'),
    );

    await expect(
      processor.process(
        job('process-withdrawal', {
          email: 'a@b.com',
          externalReference: 'w1',
        }),
      ),
    ).rejects.toThrow('ECONNREFUSED');
  });
});
