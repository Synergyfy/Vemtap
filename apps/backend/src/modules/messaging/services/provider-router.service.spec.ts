import { Test, TestingModule } from '@nestjs/testing';
import { ProviderRouterService } from './provider-router.service';
import { TermiiProvider } from '../providers/termii.provider';
import { AfricaTalkingProvider } from '../providers/africastalking.provider';
import { EmailProvider } from '../providers/email.provider';
import { Channel } from '../enums/channel.enum';

describe('ProviderRouterService', () => {
  let service: ProviderRouterService;
  let termiiProvider: TermiiProvider;
  let africaTalkingProvider: AfricaTalkingProvider;
  let emailProvider: EmailProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProviderRouterService,
        {
          provide: TermiiProvider,
          useValue: { sendMessage: jest.fn(), estimateCost: jest.fn() },
        },
        {
          provide: AfricaTalkingProvider,
          useValue: { sendMessage: jest.fn(), estimateCost: jest.fn() },
        },
        {
          provide: EmailProvider,
          useValue: { sendMessage: jest.fn(), estimateCost: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ProviderRouterService>(ProviderRouterService);
    termiiProvider = module.get<TermiiProvider>(TermiiProvider);
    africaTalkingProvider = module.get<AfricaTalkingProvider>(AfricaTalkingProvider);
    emailProvider = module.get<EmailProvider>(EmailProvider);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return AfricaTalkingProvider for SMS channel', () => {
    const provider = service.getProvider(Channel.SMS);
    expect(provider).toBe(africaTalkingProvider);
  });

  it('should return TermiiProvider for WHATSAPP channel', () => {
    const provider = service.getProvider(Channel.WHATSAPP);
    expect(provider).toBe(termiiProvider);
  });

  it('should return EmailProvider for EMAIL channel', () => {
    const provider = service.getProvider(Channel.EMAIL);
    expect(provider).toBe(emailProvider);
  });
});
