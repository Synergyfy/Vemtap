import { Test, TestingModule } from '@nestjs/testing';
import { ProviderRouterService } from './provider-router.service';
import { TermiiProvider } from '../providers/termii.provider';
import { TwilioProvider } from '../providers/twilio.provider';
import { AfricaTalkingProvider } from '../providers/africastalking.provider';
import { BestBulkSmsProvider } from '../providers/bestbulksms.provider';
import { EmailProvider } from '../providers/email.provider';
import { InHouseProvider } from '../providers/inhouse.provider';
import { Channel } from '../enums/channel.enum';

describe('ProviderRouterService', () => {
  let service: ProviderRouterService;
  let termiiProvider: TermiiProvider;
  let twilioProvider: TwilioProvider;
  let africaTalkingProvider: AfricaTalkingProvider;
  let bestBulkSmsProvider: BestBulkSmsProvider;
  let emailProvider: EmailProvider;
  let inHouseProvider: InHouseProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProviderRouterService,
        {
          provide: TermiiProvider,
          useValue: { sendMessage: jest.fn(), estimateCost: jest.fn() },
        },
        {
          provide: TwilioProvider,
          useValue: { sendMessage: jest.fn(), estimateCost: jest.fn() },
        },
        {
          provide: AfricaTalkingProvider,
          useValue: { sendMessage: jest.fn(), estimateCost: jest.fn() },
        },
        {
          provide: BestBulkSmsProvider,
          useValue: { sendMessage: jest.fn(), estimateCost: jest.fn() },
        },
        {
          provide: EmailProvider,
          useValue: { sendMessage: jest.fn(), estimateCost: jest.fn() },
        },
        {
          provide: InHouseProvider,
          useValue: { sendMessage: jest.fn(), estimateCost: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ProviderRouterService>(ProviderRouterService);
    termiiProvider = module.get<TermiiProvider>(TermiiProvider);
    twilioProvider = module.get<TwilioProvider>(TwilioProvider);
    africaTalkingProvider = module.get<AfricaTalkingProvider>(AfricaTalkingProvider);
    bestBulkSmsProvider = module.get<BestBulkSmsProvider>(BestBulkSmsProvider);
    emailProvider = module.get<EmailProvider>(EmailProvider);
    inHouseProvider = module.get<InHouseProvider>(InHouseProvider);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return BestBulkSmsProvider for SMS channel', () => {
    const provider = service.getProvider(Channel.SMS);
    expect(provider).toBe(bestBulkSmsProvider);
  });

  it('should return TwilioProvider for WHATSAPP channel', () => {
    const provider = service.getProvider(Channel.WHATSAPP);
    expect(provider).toBe(twilioProvider);
  });

  it('should return EmailProvider for EMAIL channel', () => {
    const provider = service.getProvider(Channel.EMAIL);
    expect(provider).toBe(emailProvider);
  });

  it('should return InHouseProvider for IN_HOUSE channel', () => {
    const provider = service.getProvider(Channel.IN_HOUSE);
    expect(provider).toBe(inHouseProvider);
  });
});
