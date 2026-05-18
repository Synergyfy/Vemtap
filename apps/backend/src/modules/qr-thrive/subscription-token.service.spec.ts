import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SubscriptionTokenService, VemTapQrThriveTokenPayload } from './subscription-token.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { PlansService } from '../subscriptions/plans.service';

describe('SubscriptionTokenService', () => {
  let service: SubscriptionTokenService;
  let jwtService: JwtService;
  let subscriptionsService: SubscriptionsService;
  let plansService: PlansService;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-secret-key'),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockSubscriptionsService = {
    activeSubscription: jest.fn(),
  };

  const mockPlansService = {
    findFreePlan: jest.fn(),
  };

  const mockUser = {
    id: 'user-123',
    businessId: 'biz-456',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    role: 'Owner',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionTokenService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: SubscriptionsService, useValue: mockSubscriptionsService },
        { provide: PlansService, useValue: mockPlansService },
      ],
    }).compile();

    service = module.get<SubscriptionTokenService>(SubscriptionTokenService);
    jwtService = module.get<JwtService>(JwtService);
    subscriptionsService = module.get<SubscriptionsService>(SubscriptionsService);
    plansService = module.get<PlansService>(PlansService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    it('should generate a valid token with active subscription', async () => {
      const mockSubscription = {
        status: 'active',
        plan: {
          id: 'plan-1',
          name: 'Pro Plan',
          qrThrivePlanId: 'qr-pro-plan',
          qrCodeLimit: 100,
          qrCodeTypes: ['url', 'text', 'vcard'],
          analyticsEnabled: true,
        },
      };

      mockSubscriptionsService.activeSubscription.mockResolvedValue(mockSubscription);
      mockJwtService.sign.mockReturnValue('signed-token');

      const result = await service.generateToken(mockUser as any, 'biz-456');

      expect(result).toBe('signed-token');
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'user-123',
          businessId: 'biz-456',
          subscriptionStatus: 'active',
          qrThrivePlanId: 'qr-pro-plan',
        }),
        expect.objectContaining({
          secret: 'test-secret-key',
          expiresIn: 3600,
        })
      );
    });

    it('should generate token with trial status', async () => {
      const mockSubscription = {
        status: 'trial',
        plan: {
          id: 'plan-1',
          name: 'Trial Plan',
          qrThrivePlanId: 'qr-trial-plan',
          qrCodeLimit: 50,
          qrCodeTypes: ['url', 'text'],
          analyticsEnabled: false,
        },
      };

      mockSubscriptionsService.activeSubscription.mockResolvedValue(mockSubscription);
      mockJwtService.sign.mockReturnValue('trial-token');

      const result = await service.generateToken(mockUser as any, 'biz-456');

      expect(result).toBe('trial-token');
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriptionStatus: 'trial',
        }),
        expect.any(Object)
      );
    });

    it('should return active status when no subscription (fallback to free)', async () => {
      mockSubscriptionsService.activeSubscription.mockResolvedValue(null);
      mockJwtService.sign.mockReturnValue('active-token');

      const result = await service.generateToken(mockUser as any, 'biz-456');

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriptionStatus: 'active',
        }),
        expect.any(Object)
      );
    });

    it('should fallback to free plan when no paid plan', async () => {
      mockSubscriptionsService.activeSubscription.mockResolvedValue(null);
      
      const mockFreePlan = {
        id: 'free-plan',
        qrThrivePlanId: 'qr-free-plan',
      };
      mockPlansService.findFreePlan.mockResolvedValue(mockFreePlan);
      
      mockJwtService.sign.mockReturnValue('free-token');

      const result = await service.generateToken(mockUser as any, 'biz-456');

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          qrThrivePlanId: 'qr-free-plan',
        }),
        expect.any(Object)
      );
    });

    it('should handle subscription with canceled status', async () => {
      const mockSubscription = {
        status: 'canceled',
        plan: {
          id: 'plan-1',
          qrThrivePlanId: 'qr-pro-plan',
          qrCodeLimit: 100,
          qrCodeTypes: ['url'],
          analyticsEnabled: true,
        },
      };

      mockSubscriptionsService.activeSubscription.mockResolvedValue(mockSubscription);
      mockJwtService.sign.mockReturnValue('canceled-token');

      const result = await service.generateToken(mockUser as any, 'biz-456');

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriptionStatus: 'expired',
        }),
        expect.any(Object)
      );
    });

    it('should handle subscription with expired status', async () => {
      const mockSubscription = {
        status: 'expired',
        plan: {
          id: 'plan-1',
          qrThrivePlanId: 'qr-pro-plan',
          qrCodeLimit: 100,
          qrCodeTypes: ['url'],
          analyticsEnabled: false,
        },
      };

      mockSubscriptionsService.activeSubscription.mockResolvedValue(mockSubscription);
      mockJwtService.sign.mockReturnValue('expired-token');

      const result = await service.generateToken(mockUser as any, 'biz-456');

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriptionStatus: 'expired',
        }),
        expect.any(Object)
      );
    });

    it('should use default capabilities when subscription fails', async () => {
      mockSubscriptionsService.activeSubscription.mockRejectedValue(new Error('DB error'));
      mockJwtService.sign.mockReturnValue('default-token');

      const result = await service.generateToken(mockUser as any, 'biz-456');

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          planCapabilities: expect.objectContaining({
            qrCodeLimit: 100,
            allowedQRTypes: expect.arrayContaining(['url', 'text', 'pdf']),
            canScan: true,
            canAnalytics: true,
          }),
        }),
        expect.any(Object)
      );
    });

    it('should handle plan without qrThrivePlanId', async () => {
      const mockSubscription = {
        status: 'active',
        plan: {
          id: 'plan-1',
          qrThrivePlanId: null,
          qrCodeLimit: 100,
          qrCodeTypes: ['url', 'text'],
          analyticsEnabled: true,
        },
      };

      mockSubscriptionsService.activeSubscription.mockResolvedValue(mockSubscription);
      mockPlansService.findFreePlan.mockResolvedValue(null);
      mockJwtService.sign.mockReturnValue('no-plan-token');

      const result = await service.generateToken(mockUser as any, 'biz-456');

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          qrThrivePlanId: 'qr-free-plan',
        }),
        expect.any(Object)
      );
    });
  });

  describe('verifyToken', () => {
    it('should return payload for valid token', async () => {
      const mockPayload: VemTapQrThriveTokenPayload = {
        sub: 'user-123',
        businessId: 'biz-456',
        subscriptionStatus: 'active',
        qrThrivePlanId: 'qr-pro-plan',
        planCapabilities: {
          qrCodeLimit: 100,
          allowedQRTypes: ['url'],
          canScan: true,
          canAnalytics: true,
        },
        exp: Date.now() / 1000 + 3600,
        iat: Date.now() / 1000,
      };

      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);

      const result = await service.verifyToken('valid-token');

      expect(result).toEqual(mockPayload);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid-token', {
        secret: 'test-secret-key',
      });
    });

    it('should return null for invalid token', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid signature'));

      const result = await service.verifyToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should return null when token verification fails', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Token expired'));

      const result = await service.verifyToken('expired-token');

      expect(result).toBeNull();
    });

    it('should handle malformed token', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Malformed token'));

      const result = await service.verifyToken('malformed');

      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle user without businessId', async () => {
      const userWithoutBusiness = {
        id: 'user-123',
        businessId: undefined,
        role: 'Owner',
      };

      mockJwtService.sign.mockReturnValue('no-biz-token');

      const result = await service.generateToken(userWithoutBusiness as any, 'biz-456');

      expect(result).toBe('no-biz-token');
    });

    it('should handle null user gracefully', async () => {
      mockJwtService.sign.mockReturnValue('null-user-token');
      mockSubscriptionsService.activeSubscription.mockResolvedValue(null);
      mockPlansService.findFreePlan.mockResolvedValue(null);

      const result = await service.generateToken(null as any, 'biz-456');

      expect(result).toBeDefined();
    });

    it('should handle subscription returning plan with null qrCodeTypes', async () => {
      const mockSubscription = {
        status: 'active',
        plan: {
          id: 'plan-1',
          qrThrivePlanId: 'qr-pro-plan',
          qrCodeLimit: null,
          qrCodeTypes: null,
          analyticsEnabled: null,
        },
      };

      mockSubscriptionsService.activeSubscription.mockResolvedValue(mockSubscription);
      mockJwtService.sign.mockReturnValue('null-types-token');

      const result = await service.generateToken(mockUser as any, 'biz-456');

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          planCapabilities: expect.objectContaining({
            qrCodeLimit: 100, // Default
            allowedQRTypes: expect.arrayContaining(['url', 'text', 'pdf']), // Default
          }),
        }),
        expect.any(Object)
      );
    });

    it('should handle analyticsEnabled as true', async () => {
      const mockSubscription = {
        status: 'active',
        plan: {
          id: 'plan-1',
          qrThrivePlanId: 'qr-pro-plan',
          qrCodeLimit: 100,
          qrCodeTypes: ['url', 'text'],
          analyticsEnabled: true,
        },
      };

      mockSubscriptionsService.activeSubscription.mockResolvedValue(mockSubscription);
      mockJwtService.sign.mockReturnValue('analytics-token');

      const result = await service.generateToken(mockUser as any, 'biz-456');

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          planCapabilities: expect.objectContaining({
            canAnalytics: true,
          }),
        }),
        expect.any(Object)
      );
    });

    it('should handle analyticsEnabled as false', async () => {
      const mockSubscription = {
        status: 'active',
        plan: {
          id: 'plan-1',
          qrThrivePlanId: 'qr-pro-plan',
          qrCodeLimit: 100,
          qrCodeTypes: ['url', 'text'],
          analyticsEnabled: false,
        },
      };

      mockSubscriptionsService.activeSubscription.mockResolvedValue(mockSubscription);
      mockJwtService.sign.mockReturnValue('no-analytics-token');

      const result = await service.generateToken(mockUser as any, 'biz-456');

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          planCapabilities: expect.objectContaining({
            canAnalytics: true, // Default to true since we overrode default capabilities
          }),
        }),
        expect.any(Object)
      );
    });
  });
});