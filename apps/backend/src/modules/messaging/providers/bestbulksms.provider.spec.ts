import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { BestBulkSmsProvider } from './bestbulksms.provider';
import { Channel } from '../enums/channel.enum';
import { AxiosResponse } from 'axios';

describe('BestBulkSmsProvider', () => {
  let provider: BestBulkSmsProvider;
  let httpService: HttpService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BestBulkSmsProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'BESTBULKSMS_API_KEY') return 'test-api-key';
              return null;
            }),
          },
        },
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
      ],
    }).compile();

    provider = module.get<BestBulkSmsProvider>(BestBulkSmsProvider);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('sendMessage', () => {
    it('should send SMS successfully', async () => {
      const payload = {
        to: '2348012345678',
        from: 'VemTap',
        content: 'Hello World',
        channel: Channel.SMS,
      };

      const mockResponse: AxiosResponse = {
        data: {
          status: 'success',
          message: 'Message sent successfully',
          data: {
            message_id: '12345',
            units_used: 1,
            balance: 100,
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

      const result = await provider.sendMessage(payload);

      expect(result).toEqual({
        messageId: '12345',
        status: 'sent',
        rawResponse: mockResponse.data,
      });
      expect(httpService.post).toHaveBeenCalledWith(
        'https://bestbulksms.com.ng/api/v1/send_sms',
        expect.objectContaining({
          api_key: 'test-api-key',
          to: '2348012345678',
          message: 'Hello World',
        }),
      );
    });

    it('should handle failure response', async () => {
      const payload = {
        to: '2348012345678',
        content: 'Hello World',
        channel: Channel.SMS,
      };

      const mockResponse: AxiosResponse = {
        data: {
          status: 'error',
          message: 'Insufficient units',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

      const result = await provider.sendMessage(payload);

      expect(result.status).toBe('failed');
      expect(result.messageId).toBeNull();
    });

    it('should throw error if channel is not SMS', async () => {
      const payload = {
        to: 'test@example.com',
        content: 'Hello',
        channel: Channel.EMAIL,
      };

      await expect(provider.sendMessage(payload as any)).rejects.toThrow(
        'Channel EMAIL not supported by BestBulkSmsProvider',
      );
    });

    it('should throw error if API key is missing', async () => {
      jest.spyOn(configService, 'get').mockReturnValue(null);

      const payload = {
        to: '2348012345678',
        content: 'Hello',
        channel: Channel.SMS,
      };

      await expect(provider.sendMessage(payload)).rejects.toThrow(
        'BestBulkSMS API Key missing',
      );
    });
  });

  describe('parseWebhook', () => {
    it('should parse delivery report', async () => {
      const payload = {
        message_id: '12345',
        status: 'delivered',
      };

      const result = await provider.parseWebhook(payload);

      expect(result).toEqual({
        type: 'delivery',
        data: {
          messageId: '12345',
          status: 'DELIVERED',
          rawPayload: payload,
        },
      });
    });

    it('should return null for invalid payload', async () => {
      const result = await provider.parseWebhook({});
      expect(result).toBeNull();
    });
  });
});
