/** Response shapes from https://www.bytid.com/docs (fields we use). */

export type BytidIdentityType = 'nin' | 'drivers_license' | 'voters_card';

export interface BytidEnvelope<T> {
  success: boolean;
  data: T;
  request_id?: string;
  error?: { code: string; message: string; details?: unknown };
}

export interface BytidIdentityCheck {
  id: string;
  reference: string;
  environment: 'live' | 'test';
  /** Found = verified (charged); not_found; failed = registry unreachable. */
  status: 'verified' | 'not_found' | 'failed';
  service: string;
  id_number: string;
  field_matches: {
    first_name: boolean | null;
    last_name: boolean | null;
    date_of_birth: boolean | null;
  } | null;
  face_match: {
    status: 'matched' | 'not_matched' | 'unavailable';
    score: number | null;
    liveness: string;
  } | null;
  data: {
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    full_name?: string;
    date_of_birth?: string;
  } | null;
  amount_charged?: number;
  created_at: string;
}

export interface BytidCacCheck {
  id: string;
  reference: string;
  status: 'verified' | 'not_found' | 'failed';
  id_number?: string;
  data: {
    legal_name?: string;
    registration_number?: string;
    company_type?: string;
    status?: string;
    registration_date?: string;
    address?: string;
    directors?: { name: string }[];
    beneficial_owners?: { name: string }[];
  } | null;
  created_at: string;
}

export interface BytidDocumentCheck {
  id: string;
  reference: string;
  status: 'verified' | 'review' | 'rejected';
  reasons: string[];
  document_type: string;
  id_number?: string;
  extracted: {
    id_number?: string;
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    date_of_birth?: string;
    expiry_date?: string;
  } | null;
  checks: {
    expired?: boolean;
    face_match?: { status?: string; score?: number } | string | null;
  } | null;
  created_at: string;
}

export interface BytidLivenessSession {
  id: string;
  reference?: string;
  status: 'pending' | 'passed' | 'failed' | 'expired';
  url: string;
  live: boolean;
  score: number | null;
  reasons: string[];
  usable_for_face_match: boolean;
  expires_at?: string;
}

export interface BytidWebhookEvent {
  id: string;
  type:
    | 'verification.completed'
    | 'liveness.completed'
    | 'document.completed'
    | 'kyc.completed'
    | 'address.completed'
    | 'aml.match_found'
    | 'webhook.test';
  created_at: string;
  environment: string;
  data: { id?: string; reference?: string; status?: string } & Record<
    string,
    unknown
  >;
}
