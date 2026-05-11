import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtModule } from '@nestjs/jwt';
import { QrThriveEncryptionService } from './qr-thrive-encryption.service';

describe('QR Thrive Subscription Assertion', () => {
  let encryptionService: QrThriveEncryptionService;
  let jwtService: JwtService;
  const mockSecret = 'test-secret-key-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({}),
      ],
      providers: [
        QrThriveEncryptionService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(mockSecret),
          },
        },
      ],
    }).compile();

    encryptionService = module.get<QrThriveEncryptionService>(QrThriveEncryptionService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should sign a payload and verify it correctly', () => {
    const payload = { planId: 'plan-123', status: 'active' };
    const token = encryptionService.signSubscriptionAssertion(payload);

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    // Verification logic (simulating QR Thrive side)
    const decoded = jwtService.verify(token!, { secret: mockSecret });
    
    expect(decoded.planId).toBe(payload.planId);
    expect(decoded.status).toBe(payload.status);
    expect(decoded.exp).toBeDefined();
  });

  it('should fail verification with a different secret', () => {
    const payload = { planId: 'plan-123', status: 'active' };
    const token = encryptionService.signSubscriptionAssertion(payload);

    expect(() => {
      jwtService.verify(token!, { secret: 'wrong-secret' });
    }).toThrow();
  });
});
