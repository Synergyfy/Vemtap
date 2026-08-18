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

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with business and branch names when provided', async () => {
      const sendSpy = jest
        .spyOn((service as any).resend.emails, 'send')
        .mockResolvedValue({ data: { id: 'email-1' }, error: null });

      await service.sendWelcomeEmail(
        'staff@example.com',
        'Alex',
        '123456',
        'Azure Bistro',
        'Lekki Branch',
      );

      expect(sendSpy).toHaveBeenCalledWith({
        from: 'Azure Bistro via VemTap <hello@vemtap.com>',
        to: 'staff@example.com',
        subject: 'Welcome to Azure Bistro, Lekki Branch!',
        html: expect.stringContaining('Welcome to Azure Bistro, Lekki Branch, Alex!'),
      });
    });

    it('should fallback to VemTap when business and branch names are absent', async () => {
      const sendSpy = jest
        .spyOn((service as any).resend.emails, 'send')
        .mockResolvedValue({ data: { id: 'email-2' }, error: null });

      await service.sendWelcomeEmail('user@example.com', 'Sam', '654321');

      expect(sendSpy).toHaveBeenCalledWith({
        from: 'VemTap <hello@vemtap.com>',
        to: 'user@example.com',
        subject: 'Welcome to VemTap!',
        html: expect.stringContaining('Welcome to VemTap, Sam!'),
      });
    });
  });

  describe('generatePlanChangeEmailHtml & sendPlanChangeEmail', () => {
    const mockParams = {
      email: 'owner@example.com',
      customerName: 'Alice Smith',
      businessName: 'Apex Retail',
      planName: 'Enterprise Growth',
      billingPeriod: 'yearly',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2027-08-01'),
      isTrial: false,
      isAdminOverride: true,
      previousPlanName: 'Starter Free',
      features: ['Unlimited Staff', 'AI Assistant'],
      credits: {
        sms: 500,
        email: 2000,
        whatsapp: 100,
      },
      limits: {
        branches: 5,
      },
    };

    it('should generate plan change email HTML with correct details', () => {
      const { subject, html } = service.generatePlanChangeEmailHtml(mockParams);

      expect(subject).toContain('Your Plan has been Updated to Enterprise Growth');
      expect(html).toContain('Alice Smith');
      expect(html).toContain('Apex Retail');
      expect(html).toContain('Enterprise Growth');
      expect(html).toContain('Plan Updated by Admin');
      expect(html).toContain('Starter Free');
      expect(html).toContain('500 SMS');
      expect(html).toContain('2,000 Email');
      expect(html).toContain('5 locations');
      expect(html).toContain('Unlimited Staff');
    });

    it('should send plan change email via resend', async () => {
      const sendSpy = jest
        .spyOn((service as any).resend.emails, 'send')
        .mockResolvedValue({ data: { id: 'email-plan-change' }, error: null });

      const result = await service.sendPlanChangeEmail(mockParams);

      expect(result).toBe(true);
      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'owner@example.com',
          subject: expect.stringContaining('Enterprise Growth'),
          html: expect.stringContaining('Enterprise Growth'),
        }),
      );
    });
  });
});

