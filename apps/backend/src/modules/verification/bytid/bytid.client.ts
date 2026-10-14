import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import type {
  BytidCacCheck,
  BytidDocumentCheck,
  BytidEnvelope,
  BytidIdentityCheck,
  BytidIdentityType,
  BytidLivenessSession,
} from './bytid.types';

const IDENTITY_PATHS: Record<BytidIdentityType, string> = {
  nin: '/identity/nin/face-match',
  drivers_license: '/identity/drivers-license/face-match',
  voters_card: '/identity/voters-card/face-match',
};

/** Retries for timeouts and 500s — always with the same reference. */
const MAX_ATTEMPTS = 3;

/**
 * Thin client for the bytID API (https://www.bytid.com/docs).
 *
 * - One base URL; the key (`uvk_test_…` sandbox, `uvk_live_…` live) picks the
 *   environment.
 * - Every call carries our own `reference`. bytID never charges twice for a
 *   reference, so timeouts and 500s are retried with the same one, and a
 *   `409 duplicate_reference` is answered by fetching the earlier result.
 * - A check that ran returns 200 whatever the outcome; callers decide on
 *   `data.status`.
 */
@Injectable()
export class BytidClient {
  private readonly logger = new Logger(BytidClient.name);
  private readonly http: AxiosInstance;
  readonly configured: boolean;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('BYTID_API_KEY') ?? '';
    this.configured = apiKey.length > 0;
    if (!this.configured) {
      this.logger.warn('bytID is not configured: BYTID_API_KEY is missing');
    }
    this.http = axios.create({
      baseURL:
        this.config.get<string>('BYTID_BASE_URL') || 'https://api.bytid.com/v1',
      timeout: 30_000,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /** Hosted liveness (selfie) session; send the person to `url`. */
  createLivenessSession(reference: string, redirectUrl?: string) {
    return this.post<BytidLivenessSession>('/liveness/sessions', {
      reference,
      ...(redirectUrl && { redirect_url: redirectUrl }),
    });
  }

  getLivenessSession(id: string) {
    return this.get<BytidLivenessSession>(
      `/liveness/sessions/${encodeURIComponent(id)}`,
    );
  }

  /** Registry lookup plus face match against a passed liveness session. */
  verifyIdentity(
    type: BytidIdentityType,
    body: {
      reference: string;
      id_number: string;
      first_name?: string;
      last_name?: string;
      dob?: string;
      liveness_session_id: string;
    },
  ) {
    return this.post<BytidIdentityCheck>(IDENTITY_PATHS[type], body, () =>
      this.findByReference<BytidIdentityCheck>(body.reference),
    );
  }

  /** Document check (passports have no registry, so this is how they verify). */
  verifyDocument(body: {
    reference: string;
    front_image: string;
    back_image?: string;
    document_type:
      'passport' | 'nin_slip' | 'nin_card' | 'drivers_license' | 'voters_card';
    liveness_session_id?: string;
  }) {
    return this.post<BytidDocumentCheck>('/documents/verify', body);
  }

  getDocumentCheck(id: string) {
    return this.get<BytidDocumentCheck>(`/documents/${encodeURIComponent(id)}`);
  }

  /** CAC lookup by RC…, BN… or IT… number. */
  lookupCac(body: {
    reference: string;
    id_number: string;
    business_type?: string;
  }) {
    return this.post<BytidCacCheck>('/business/cac', body, () =>
      this.findByReference<BytidCacCheck>(body.reference),
    );
  }

  /** The verification created earlier with this reference. */
  async findByReference<T>(reference: string): Promise<T> {
    const result = await this.get<T[] | { data: T[] } | T>(
      `/verifications?reference=${encodeURIComponent(reference)}`,
    );
    if (Array.isArray(result)) return result[0];
    const list = (result as { data?: T[] }).data;
    return Array.isArray(list) ? list[0] : (result as T);
  }

  private get<T>(path: string): Promise<T> {
    return this.request<T>(() => this.http.get<BytidEnvelope<T>>(path));
  }

  private post<T>(
    path: string,
    body: object,
    onDuplicate?: () => Promise<T>,
  ): Promise<T> {
    return this.request<T>(
      () => this.http.post<BytidEnvelope<T>>(path, body),
      onDuplicate,
    );
  }

  private async request<T>(
    send: () => Promise<{ data: BytidEnvelope<T> }>,
    onDuplicate?: () => Promise<T>,
  ): Promise<T> {
    if (!this.configured) {
      throw new ServiceUnavailableException(
        'Identity verification is not configured',
      );
    }
    for (let attempt = 1; ; attempt += 1) {
      try {
        const response = await send();
        return response.data.data;
      } catch (error) {
        if (!axios.isAxiosError(error)) throw error;
        const status = error.response?.status;
        const body = error.response?.data as BytidEnvelope<unknown> | undefined;
        const code = body?.error?.code;

        if (
          status === HttpStatus.CONFLICT &&
          code === 'duplicate_reference' &&
          onDuplicate
        ) {
          return onDuplicate();
        }
        const retryable =
          !status || status >= 500 || error.code === 'ECONNABORTED';
        if (retryable && attempt < MAX_ATTEMPTS) {
          await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
          continue;
        }
        throw this.toHttpException(
          status,
          code,
          body?.error?.message ?? error.message,
        );
      }
    }
  }

  /** bytID error codes → what our API tells the app. */
  private toHttpException(
    status: number | undefined,
    code: string | undefined,
    message: string,
  ) {
    this.logger.error(
      `bytID request failed (${status ?? 'network'} ${code ?? ''}): ${message}`,
    );
    switch (code) {
      case 'validation_error':
        return new BadRequestException(
          `Verification details were rejected: ${message}`,
        );
      case 'not_found':
        return new BadRequestException('Verification record not found');
      case 'liveness_not_usable':
        return new BadRequestException(
          'The selfie check has expired or was already used. Please take it again.',
        );
      case 'invalid_api_key':
      case 'live_not_enabled':
      case 'ip_not_allowed':
      case 'insufficient_scope':
      case 'business_suspended':
      case 'insufficient_balance':
        // Our account's problem, not the user's: don't leak the detail.
        return new ServiceUnavailableException(
          'Identity verification is temporarily unavailable. Please try again later.',
        );
      case 'rate_limited':
        return new HttpException(
          'Too many verification attempts. Please wait a minute and try again.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      default:
        if (status === HttpStatus.FORBIDDEN)
          return new ForbiddenException(message);
        return new ServiceUnavailableException(
          'Identity verification is temporarily unavailable. Please try again later.',
        );
    }
  }
}
