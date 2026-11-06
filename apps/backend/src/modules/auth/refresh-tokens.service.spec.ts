import { createHash } from 'crypto';
import { RefreshTokensService } from './refresh-tokens.service';

const SESSION_ID = '11111111-1111-4111-8111-111111111111';
const hash = (value: string) =>
  createHash('sha256').update(value).digest('hex');

describe('RefreshTokensService', () => {
  let service: RefreshTokensService;
  let stored: Record<string, unknown> | null;
  const update = jest.fn();

  beforeEach(() => {
    update.mockReset().mockResolvedValue({ affected: 1 });
    stored = {
      id: SESSION_ID,
      refreshTokenHash: hash('current'),
      previousRefreshTokenHash: hash('old'),
      refreshRotatedAt: new Date(),
      refreshExpiresAt: new Date(Date.now() + 60_000),
    };
    const builder = {
      addSelect: () => builder,
      where: () => builder,
      andWhere: () => builder,
      getOne: () => Promise.resolve(stored),
    };
    service = new RefreshTokensService({
      update,
      createQueryBuilder: () => builder,
    } as never);
  });

  it('stores only a hash of the token it issues', async () => {
    const token = await service.issue(SESSION_ID, { role: 'Customer' });

    const [, saved] = update.mock.calls[0];
    expect(token.startsWith(`${SESSION_ID}.`)).toBe(true);
    expect(saved.refreshTokenHash).toBe(hash(token.split('.')[1]));
    expect(JSON.stringify(saved)).not.toContain(token.split('.')[1]);
  });

  it('swaps the current token for a new one', async () => {
    const rotated = await service.rotate(`${SESSION_ID}.current`);

    expect(rotated?.refreshToken).toMatch(new RegExp(`^${SESSION_ID}\\.`));
    expect(rotated?.refreshToken).not.toBe(`${SESSION_ID}.current`);
    expect(update.mock.calls[0][1].previousRefreshTokenHash).toBe(
      hash('current'),
    );
  });

  it('gives no new token when another request won the swap', async () => {
    update.mockResolvedValue({ affected: 0 });

    const rotated = await service.rotate(`${SESSION_ID}.current`);

    expect(rotated?.session).toBe(stored);
    expect(rotated?.refreshToken).toBeNull();
  });

  it('lets the previous token through just after a swap', async () => {
    const rotated = await service.rotate(`${SESSION_ID}.old`);

    expect(rotated?.refreshToken).toBeNull();
    expect(update).not.toHaveBeenCalled();
  });

  it('ends the session when an old token comes back later', async () => {
    stored!.refreshRotatedAt = new Date(Date.now() - 60_000);

    await expect(service.rotate(`${SESSION_ID}.old`)).resolves.toBeNull();

    expect(update).toHaveBeenCalledWith(SESSION_ID, {
      revokedAt: expect.any(Date),
    });
  });

  it('refuses an unknown secret without ending the session', async () => {
    await expect(service.rotate(`${SESSION_ID}.guess`)).resolves.toBeNull();
    expect(update).not.toHaveBeenCalled();
  });

  it('refuses expired, revoked and malformed tokens', async () => {
    stored!.refreshExpiresAt = new Date(Date.now() - 1000);
    await expect(service.rotate(`${SESSION_ID}.current`)).resolves.toBeNull();

    stored = null;
    await expect(service.rotate(`${SESSION_ID}.current`)).resolves.toBeNull();

    await expect(service.rotate('not-a-token')).resolves.toBeNull();
    await expect(service.rotate('abc.def')).resolves.toBeNull();
  });
});
