import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TwilioProvider } from './twilio.provider';
import { Channel } from '../enums/channel.enum';

// Define mocks at the top level with 'mock' prefix so they can be used in jest.mock
const mockTwilioMessages = {
  create: jest.fn(),
};
const mockTwilioClientInstance = {
  messages: mockTwilioMessages,
};

jest.mock('twilio', () => {
  return jest.fn().mockReturnValue({
    messages: {
      create: (opts: any) => mockTwilioMessages.create(opts),
    },
  });
});

import twilio from 'twilio';

describe('TwilioProvider', () => {
  let provider: TwilioProvider;
  let configService: ConfigService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwilioProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'TWILIO_ACCOUNT_SID') return 'AC123';
              if (key === 'TWILIO_AUTH_TOKEN') return 'token123';
              if (key === 'TWILIO_WHATSAPP_NUMBER') return '+14155238886';
              return null;
            }),
          },
        },
      ],
    }).compile();

    provider = module.get<TwilioProvider>(TwilioProvider);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('sendMessage', () => {
    it('should send a whatsapp message with correct prefixes', async () => {
      mockTwilioMessages.create.mockResolvedValue({
        sid: 'SM123',
        status: 'queued',
      });

      const payload = {
        to: '+2348012345678',
        from: '+14155238886',
        content: 'Hello World',
        channel: Channel.WHATSAPP,
      };

      const result = await provider.sendMessage(payload);

      expect(twilio).toHaveBeenCalledWith('AC123', 'token123');
      expect(mockTwilioMessages.create).toHaveBeenCalledWith({
        to: 'whatsapp:+2348012345678',
        from: 'whatsapp:+14155238886',
        body: 'Hello World',
      });
      expect(result.messageId).toBe('SM123');
      expect(result.status).toBe('QUEUED');
    });

    it('should handle mediaUrl', async () => {
      mockTwilioMessages.create.mockResolvedValue({
        sid: 'MM123',
        status: 'sent',
      });

      const payload = {
        to: '+2348012345678',
        content: 'Check this out',
        channel: Channel.WHATSAPP,
        mediaUrl: 'https://example.com/image.png',
      };

      await provider.sendMessage(payload);

      expect(mockTwilioMessages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mediaUrl: ['https://example.com/image.png'],
        }),
      );
    });
  });

  describe('parseWebhook', () => {
    it('should parse inbound messages', async () => {
      const payload = {
        SmsSid: 'SM123',
        From: 'whatsapp:+2348012345678',
        To: 'whatsapp:+14155238886',
        Body: 'Hello back',
      };

      const result = await provider.parseWebhook(payload as any);

      expect(result?.type).toBe('inbound');
      expect(result?.data).toEqual(
        expect.objectContaining({
          from: '+2348012345678',
          content: 'Hello back',
          providerMessageId: 'SM123',
        }),
      );
    });

    it('should parse delivery reports', async () => {
      const payload = {
        MessageSid: 'SM123',
        MessageStatus: 'delivered',
      };

      const result = await provider.parseWebhook(payload as any);

      expect(result?.type).toBe('delivery');
      expect(result?.data).toEqual(
        expect.objectContaining({
          messageId: 'SM123',
          status: 'DELIVERED',
        }),
      );
    });
  });
});
