import { Test, TestingModule } from '@nestjs/testing';
import { QrThriveCallbackController } from './qr-thrive-callback.controller';
import { IntegrationApiKeyGuard } from './guards/integration-api-key.guard';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

describe('QrThriveCallbackController', () => {
  let controller: QrThriveCallbackController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QrThriveCallbackController],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              if (key === 'VEMTAP_INTEGRATION_KEY') return 'test-key-123';
              return null;
            }),
          },
        },
      ],
    })
      .overrideGuard(IntegrationApiKeyGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<QrThriveCallbackController>(
      QrThriveCallbackController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleCallback', () => {
    it('should acknowledge receipt of valid payload', async () => {
      const payload = { event: 'subscription.updated', userId: '123' };
      const loggerSpy = jest.spyOn(controller['logger'], 'log');

      const result = await controller.handleCallback(payload);

      expect(result).toEqual({
        status: 'success',
        message: 'Callback received',
      });
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining(JSON.stringify(payload)),
      );
    });

    it('should handle empty payloads gracefully', async () => {
      const result = await controller.handleCallback({});
      expect(result.status).toBe('success');
    });
  });
});
