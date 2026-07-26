export interface LegalAgreement {
  id: string;
  slug: string;
  title: string;
  version: string;
  effectiveDate: string;
  summary?: string;
  contentUrl?: string;
  documentType: 'terms' | 'privacy' | 'dpa' | 'cookies' | 'sla' | 'custom';
  isActive: boolean;
  requiresReacceptance: boolean;
  userAccepted?: boolean;
  acceptedAt?: string | null;
  acceptedVersion?: string | null;
}

export interface LegalAgreementAcceptance {
  id: string;
  userId: string;
  agreementId: string;
  agreementVersion: string;
  acceptedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface PaginatedAgreementHistory {
  data: LegalAgreementAcceptance[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
