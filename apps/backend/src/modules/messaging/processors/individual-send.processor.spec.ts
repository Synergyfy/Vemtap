import { Test, TestingModule } from '@nestjs/testing';
import { IndividualSendProcessor } from './individual-send.processor';
import { MessagingEngineService } from '../services/messaging-engine.service';
import { Channel } from '../enums/channel.enum';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

describe('IndividualSendProcessor', () => {
  let processor: IndividualSendProcessor;
  let engineMock: any;

  beforeEach(async () => {
    engineMock = {
      processSingleSend: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IndividualSendProcessor,
        { provide: MessagingEngineService, useValue: engineMock },
      ],
    }).compile();

    processor = module.get<IndividualSendProcessor>(IndividualSendProcessor);

    // Suppress logger to keep test output clean
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  describe('process', () => {
    it('should call processSingleSend with job data', async () => {
      const mockJob = {
        data: {
          branchId: 'branch-1',
          contactId: 'contact-1',
          content: 'Hello {Name}',
          channel: Channel.SMS,
          from: 'VEMTAP',
          campaignId: 'camp-1',
        },
      } as Job;

      engineMock.processSingleSend.mockResolvedValue({ id: 'msg-1' });

      const result = await processor.process(mockJob);

      expect(result).toEqual({ success: true });
      expect(engineMock.processSingleSend).toHaveBeenCalledWith(
        'branch-1',
        'contact-1',
        'Hello {Name}',
        Channel.SMS,
        'VEMTAP',
        'camp-1',
      );
    });

    it('should throw error if processSingleSend fails', async () => {
      const mockJob = {
        data: {
          branchId: 'branch-1',
          contactId: 'contact-1',
          content: 'Hello {Name}',
          channel: Channel.SMS,
          from: 'VEMTAP',
        },
      } as Job;

      const error = new Error('Send failed');
      engineMock.processSingleSend.mockRejectedValue(error);

      await expect(processor.process(mockJob)).rejects.toThrow('Send failed');
    });
  });
});
