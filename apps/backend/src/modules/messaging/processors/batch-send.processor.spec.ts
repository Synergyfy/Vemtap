import { Test, TestingModule } from '@nestjs/testing';
import { BatchSendProcessor } from './batch-send.processor';
import { Logger } from '@nestjs/common';
import { MessagingEngineService } from '../services/messaging-engine.service';
import { CampaignService } from '../services/campaign.service';
import { TemplateService } from '../services/template.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Contact } from '../../contacts/entities/contact.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Channel } from '../enums/channel.enum';
import { Job } from 'bullmq';

describe('BatchSendProcessor', () => {
  let processor: BatchSendProcessor;
  let engineMock: any;
  let campaignMock: any;
  let templateMock: any;
  let contactRepoMock: any;
  let branchRepoMock: any;

  beforeEach(async () => {
    engineMock = {
      processSingleSend: jest.fn(),
      calculateCost: jest.fn().mockReturnValue(0.1),
    };

    campaignMock = {
      updateCampaign: jest.fn(),
    };

    templateMock = {
      getTemplate: jest.fn(),
    };

    contactRepoMock = {
      findOne: jest.fn(),
    };

    branchRepoMock = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatchSendProcessor,
        { provide: MessagingEngineService, useValue: engineMock },
        { provide: CampaignService, useValue: campaignMock },
        { provide: TemplateService, useValue: templateMock },
        { provide: getRepositoryToken(Contact), useValue: contactRepoMock },
        { provide: getRepositoryToken(Branch), useValue: branchRepoMock },
      ],
    }).compile();

    processor = module.get<BatchSendProcessor>(BatchSendProcessor);

    // Suppress logger to keep test output clean
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  describe('process', () => {
    let mockJob: Job;

    beforeEach(() => {
      mockJob = {
        data: {
          campaignId: 'c1',
          branchId: 'br1',
          channel: Channel.SMS,
          contactIds: ['contact1', 'contact2'],
          templateId: 't1',
          content: 'test text',
        },
      } as any;
    });

    it('should return 0 success if branch is not found', async () => {
      branchRepoMock.findOne.mockResolvedValue(null);

      const result = await processor.process(mockJob);

      expect(result).toEqual({ successCount: 0, failureCount: 0 });
      expect(branchRepoMock.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'br1' } }),
      );
      expect(contactRepoMock.findOne).not.toHaveBeenCalled();
    });

    it('should process contacts and increment success/failure counts accordingly', async () => {
      branchRepoMock.findOne.mockResolvedValue({
        id: 'br1',
        name: 'Test Branch',
      });
      templateMock.getTemplate.mockResolvedValue({
        id: 't1',
        content: 'test text',
      });

      // First contact succeeds, second contact fails
      contactRepoMock.findOne
        .mockResolvedValueOnce({ id: 'contact1' })
        .mockResolvedValueOnce({ id: 'contact2' });

      engineMock.processSingleSend
        .mockResolvedValueOnce('msg1')
        .mockRejectedValueOnce(new Error('Send failed'));

      const result = await processor.process(mockJob);

      expect(result).toEqual({ successCount: 1, failureCount: 1 });
      expect(engineMock.calculateCost).toHaveBeenCalledWith(Channel.SMS, 1);
      expect(campaignMock.updateCampaign).toHaveBeenCalledWith(
        'c1',
        expect.objectContaining({
          actualCost: 0.1,
        }),
      );
    });
  });
});
