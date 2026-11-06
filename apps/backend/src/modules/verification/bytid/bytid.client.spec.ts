import { ConfigService } from '@nestjs/config';
import { HttpStatus, ServiceUnavailableException } from '@nestjs/common';
import axios, { AxiosError, AxiosHeaders } from 'axios';
import { BytidClient } from './bytid.client';

jest.mock('axios', () => {
  const actual = jest.requireActual('axios');
  const instance = { get: jest.fn(), post: jest.fn() };
  return {
    ...actual,
    __esModule: true,
    default: {
      ...actual.default,
      create: jest.fn(() => instance),
      isAxiosError: actual.isAxiosError,
    },
    create: jest.fn(() => instance),
    isAxiosError: actual.isAxiosError,
  };
});

const http = (axios.create as jest.Mock)();

function bytidError(status: number, code?: string): AxiosError {
  return new AxiosError('request failed', undefined, undefined, undefined, {
    status,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: code ? { success: false, error: { code, message: code } } : undefined,
  });
}

describe('BytidClient', () => {
  const config = (key = 'uvk_test_123') =>
    ({
      get: (name: string) => (name === 'BYTID_API_KEY' ? key : undefined),
    }) as unknown as ConfigService;

  beforeEach(() => {
    http.get.mockReset();
    http.post.mockReset();
    jest.spyOn(global, 'setTimeout').mockImplementation(((fn: () => void) => {
      fn();
      return 0;
    }) as unknown as typeof setTimeout);
  });
  afterEach(() => jest.restoreAllMocks());

  it('unwraps the data envelope', async () => {
    http.post.mockResolvedValue({
      data: { success: true, data: { id: 'chk_1', status: 'verified' } },
    });
    const client = new BytidClient(config());
    await expect(
      client.lookupCac({ reference: 'ver_1', id_number: 'RC1' }),
    ).resolves.toEqual({
      id: 'chk_1',
      status: 'verified',
    });
    expect(http.post).toHaveBeenCalledWith('/business/cac', {
      reference: 'ver_1',
      id_number: 'RC1',
    });
  });

  it('retries a 500 with the same reference', async () => {
    http.post
      .mockRejectedValueOnce(bytidError(500, 'internal_error'))
      .mockResolvedValueOnce({
        data: { success: true, data: { id: 'chk_2' } },
      });
    const client = new BytidClient(config());
    await client.lookupCac({ reference: 'ver_2', id_number: 'RC2' });
    expect(http.post).toHaveBeenCalledTimes(2);
    expect(http.post.mock.calls[1][1]).toEqual({
      reference: 'ver_2',
      id_number: 'RC2',
    });
  });

  it('answers a duplicate reference with the earlier result', async () => {
    http.post.mockRejectedValue(bytidError(409, 'duplicate_reference'));
    http.get.mockResolvedValue({
      data: { success: true, data: [{ id: 'chk_earlier' }] },
    });
    const client = new BytidClient(config());
    await expect(
      client.verifyIdentity('nin', {
        reference: 'ver_3',
        id_number: '12345678901',
        liveness_session_id: 'liv_1',
      }),
    ).resolves.toEqual({ id: 'chk_earlier' });
    expect(http.get).toHaveBeenCalledWith('/verifications?reference=ver_3');
  });

  it('hides account problems from the user and maps rate limits', async () => {
    const client = new BytidClient(config());
    http.post.mockRejectedValueOnce(bytidError(402, 'insufficient_balance'));
    await expect(
      client.lookupCac({ reference: 'r', id_number: 'RC1' }),
    ).rejects.toThrow(ServiceUnavailableException);
    http.post.mockRejectedValueOnce(bytidError(429, 'rate_limited'));
    await expect(
      client.lookupCac({ reference: 'r', id_number: 'RC1' }),
    ).rejects.toMatchObject({
      status: HttpStatus.TOO_MANY_REQUESTS,
    });
    http.post.mockRejectedValueOnce(bytidError(422, 'liveness_not_usable'));
    await expect(
      client.lookupCac({ reference: 'r', id_number: 'RC1' }),
    ).rejects.toThrow(/selfie check has expired/);
  });

  it('refuses to call bytID without a key', async () => {
    const client = new BytidClient(config(''));
    expect(client.configured).toBe(false);
    await expect(client.createLivenessSession('liv_1')).rejects.toThrow(
      'Identity verification is not configured',
    );
    expect(http.post).not.toHaveBeenCalled();
  });
});
