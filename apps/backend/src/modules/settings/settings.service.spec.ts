import { maskSecret, SettingsService } from './settings.service';
import { Setting } from './entities/setting.entity';

describe('SettingsService secrets', () => {
  const stored = (): Setting =>
    ({
      id: 's1',
      platformName: 'VemTap',
      paystackSecretKey: 'sk_live_abcdef123456',
      termiiApiKey: 'TL_termii_9876',
      whatsappApiToken: null,
      whatsappWebhookVerifyToken: 'verify_me',
    }) as unknown as Setting;

  const makeService = (current: Setting) => {
    const repo = {
      find: jest.fn().mockResolvedValue([current]),
      save: jest.fn().mockImplementation(async (s: Setting) => s),
    };
    return { service: new SettingsService(repo as any), repo };
  };

  it('masks a set secret to its last four characters and leaves unset ones null', () => {
    expect(maskSecret('sk_live_abcdef123456')).toBe('••••3456');
    expect(maskSecret(null)).toBeNull();
    expect(maskSecret('')).toBeNull();
  });

  it('never returns provider secrets in the admin view', () => {
    const { service } = makeService(stored());
    const view = service.toPublicView(stored()) as unknown as Record<
      string,
      unknown
    >;
    expect(view.paystackSecretKey).toBe('••••3456');
    expect(view.termiiApiKey).toBe('••••9876');
    expect(view.whatsappApiToken).toBeNull();
    expect(view.whatsappWebhookVerifyToken).toBe('••••y_me');
    expect(view.platformName).toBe('VemTap');
  });

  it('keeps the stored key when a form saves the masked value back', async () => {
    const current = stored();
    const { service } = makeService(current);
    const saved = await service.updateSettings({
      paystackSecretKey: '••••3456',
      platformName: 'Vemtap',
    } as any);
    expect(saved.paystackSecretKey).toBe('sk_live_abcdef123456');
    expect(saved.platformName).toBe('Vemtap');
  });

  it('replaces the key when a new one is entered', async () => {
    const { service } = makeService(stored());
    const saved = await service.updateSettings({
      termiiApiKey: 'TL_new_key_0001',
    } as any);
    expect(saved.termiiApiKey).toBe('TL_new_key_0001');
  });
});
