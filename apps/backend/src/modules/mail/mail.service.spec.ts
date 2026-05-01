import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

describe('MailService', () => {
  let service: MailService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'RESEND_API_KEY') return 'test-resend-key';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateOrderNotificationHtml', () => {
    const mockOrder = {
      id: 'order-12345678',
      createdAt: new Date(),
      totalAmount: 5000,
      customer: { firstName: 'John' },
      items: [
        {
          quantity: 1,
          priceAtOrder: 5000,
          item: { name: 'Burger', shortDescription: 'Tasty' },
        },
      ],
    };

    const mockBusiness = {
      name: 'Test Biz',
      address: '123 Street',
      phone: '123456',
    };

    it('should generate HTML with correct status for "placed"', () => {
      const { subject, html } = service.generateOrderNotificationHtml(
        mockOrder,
        'placed',
        mockBusiness,
      );

      expect(subject).toContain('Order Confirmation');
      expect(html).toContain('Order Placed');
      expect(html).toContain('John');
      expect(html).toContain('Burger');
      expect(html).toContain('₦5,000');
    });

    it('should generate HTML with correct status for "completed"', () => {
      const { subject, html } = service.generateOrderNotificationHtml(
        mockOrder,
        'completed',
        mockBusiness,
      );

      expect(subject).toContain('Order Delivered');
      expect(html).toContain('Completed');
      expect(html).toContain('ready and waiting');
    });

    it('should handle missing customer name gracefully', () => {
      const orderNoCustomer = { ...mockOrder, customer: null };
      const { html } = service.generateOrderNotificationHtml(
        orderNoCustomer,
        'placed',
        mockBusiness,
      );

      expect(html).toContain('Valued Customer');
    });
  });
});
