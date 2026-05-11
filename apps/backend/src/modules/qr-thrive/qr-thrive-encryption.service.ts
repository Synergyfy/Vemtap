import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class QrThriveEncryptionService {
  private readonly logger = new Logger(QrThriveEncryptionService.name);
  private readonly secret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.secret = this.configService.get<string>('VEMTAP_QR_THRIVE_SECRET')!;
  }

  signSubscriptionAssertion(payload: { planId: string; status: string }) {
    if (!this.secret) {
      this.logger.error('VEMTAP_QR_THRIVE_SECRET is not configured');
      return null;
    }

    // Assertion valid for 365 days. It will be refreshed on every sync.
    return this.jwtService.sign(payload, {
      secret: this.secret,
      expiresIn: '365d',
    });
  }
}
