import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

export interface VemTapQrThriveTokenPayload {
  sub: string;
  businessId: string;
  subscriptionStatus: 'active' | 'trial' | 'expired';
  qrThrivePlanId: string;
  planCapabilities: {
    qrCodeLimit: number;
    allowedQRTypes: string[];
    canScan: boolean;
    canAnalytics: boolean;
  };
  exp: number;
  iat: number;
}

@Injectable()
export class SubscriptionTokenService {
  private readonly logger = new Logger(SubscriptionTokenService.name);
  private readonly secret: string;
  private readonly TOKEN_TTL = 3600;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => SubscriptionsService))
    private readonly subscriptionsService: SubscriptionsService,
  ) {
    this.secret = this.configService.get<string>('VEMTAP_QR_THRIVE_SECRET') || '';
    if (!this.secret) {
      this.logger.warn('VEMTAP_QR_THRIVE_SECRET is not configured');
    }
  }

  async generateToken(user: User, businessId: string): Promise<string> {
    const subscriptionStatus = await this.getSubscriptionStatus(businessId);
    const qrThrivePlanId = await this.getQrThrivePlanId(businessId);
    const planCapabilities = await this.getPlanCapabilities(qrThrivePlanId);

    const payload: Omit<VemTapQrThriveTokenPayload, 'exp' | 'iat'> = {
      sub: user?.id || 'unknown',
      businessId,
      subscriptionStatus,
      qrThrivePlanId,
      planCapabilities,
    };

    return this.jwtService.sign(payload, {
      secret: this.secret,
      expiresIn: this.TOKEN_TTL,
    });
  }

  private async getSubscriptionStatus(businessId: string): Promise<'active' | 'trial' | 'expired'> {
    try {
      const sub = await this.subscriptionsService.activeSubscription(businessId);
      
      if (!sub) {
        return 'expired';
      }

      if (sub.status === 'active' || sub.status === 'trial') {
        return sub.status;
      }

      return 'expired';
    } catch (error) {
      this.logger.error(`Failed to get subscription status: ${error.message}`);
      return 'expired';
    }
  }

  private async getQrThrivePlanId(businessId: string): Promise<string> {
    try {
      const sub = await this.subscriptionsService.activeSubscription(businessId);
      
      if (sub?.plan?.qrThrivePlanId) {
        return sub.plan.qrThrivePlanId;
      }

      // If no subscription or no qrThrivePlanId, return empty string
      // QR-Thrive will use its default/fallback logic
      return '';
    } catch (error) {
      this.logger.error(`Failed to get QR-Thrive plan ID: ${error.message}`);
      return '';
    }
  }

  private async getPlanCapabilities(qrThrivePlanId: string): Promise<VemTapQrThriveTokenPayload['planCapabilities']> {
    try {
      // Since VemTap Plan doesn't have qrCodeLimit/qrCodeTypes directly,
      // we'll use defaults and let QR-Thrive handle the actual limits based on qrThrivePlanId
      // For now, provide reasonable defaults based on subscription status
      return this.getDefaultCapabilities();
    } catch (error) {
      this.logger.warn(`Failed to get plan capabilities: ${error.message}, using defaults`);
      return this.getDefaultCapabilities();
    }
  }

  private async getBusinessIdFromPlan(qrThrivePlanId: string): Promise<string> {
    return '';
  }

  private getDefaultCapabilities(): VemTapQrThriveTokenPayload['planCapabilities'] {
    return {
      qrCodeLimit: 10,
      allowedQRTypes: ['url', 'text'],
      canScan: true,
      canAnalytics: false,
    };
  }

  async verifyToken(token: string): Promise<VemTapQrThriveTokenPayload | null> {
    try {
      return await this.jwtService.verifyAsync<VemTapQrThriveTokenPayload>(token, {
        secret: this.secret,
      });
    } catch (error) {
      this.logger.warn(`Token verification failed: ${error.message}`);
      return null;
    }
  }
}