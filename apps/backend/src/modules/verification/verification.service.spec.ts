import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ModuleRef } from '@nestjs/core';
import { ServiceUnavailableException } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { BytidClient } from './bytid/bytid.client';
import {
  VerificationCheck,
  VerificationCheckKind,
  VerificationCheckStatus,
} from './entities/verification-check.entity';
import {
  Business,
  BusinessVerificationStatus,
} from '../businesses/entities/business.entity';
import { User } from '../users/entities/user.entity';

describe('VerificationService', () => {
  let service: VerificationService;
  let checks: any[];
  let checkRepo: any;
  let businessRepo: any;
  let userRepo: any;
  let bytid: any;
  let notifications: any;
  let business: any;

  const owner = { id: 'owner-1', firstName: 'Adaeze', lastName: 'Okafor' };
  const ninResult = (overrides: Record<string, unknown> = {}) => ({
    id: 'chk_nin',
    status: 'verified',
    face_match: { status: 'matched', score: 95, liveness: 'passed' },
    field_matches: { first_name: true, last_name: true, date_of_birth: null },
    data: { first_name: 'ADAEZE', middle_name: 'TEST', last_name: 'OKAFOR' },
    ...overrides,
  });
  const cacResult = (overrides: Record<string, unknown> = {}) => ({
    id: 'chk_cac',
    status: 'verified',
    data: {
      legal_name: 'MAMA PUT NIG LIMITED',
      status: 'ACTIVE',
      directors: [{ name: 'ADAEZE TEST OKAFOR' }],
      beneficial_owners: [],
    },
    ...overrides,
  });

  beforeEach(async () => {
    checks = [];
    business = {
      id: 'b1',
      name: 'Mama Put',
      ownerId: 'owner-1',
      verificationStatus: BusinessVerificationStatus.UNVERIFIED,
      isVerified: false,
      verifiedAt: null,
    };
    checkRepo = {
      create: jest.fn((data) => ({ ...data })),
      save: jest.fn(async (input) => {
        const list = Array.isArray(input) ? input : [input];
        for (const check of list) {
          if (!check.id) {
            check.id = `c${checks.length + 1}`;
            check.createdAt = new Date(Date.now() + checks.length);
            checks.push(check);
          }
        }
        return input;
      }),
      findOne: jest.fn(async ({ where, order }) => {
        const match = checks.filter(
          (c) =>
            (!where.businessId || c.businessId === where.businessId) &&
            (!where.kind || c.kind === where.kind) &&
            (!where.id || c.id === where.id),
        );
        if (order) match.sort((a, b) => b.createdAt - a.createdAt);
        return match[0] ?? null;
      }),
      find: jest.fn(async ({ where }) =>
        checks.filter(
          (c) =>
            c.businessId === where.businessId &&
            (!where.status || c.status === where.status),
        ),
      ),
    };
    businessRepo = {
      findOne: jest.fn(async () => ({ ...business })),
      update: jest.fn(async (_id, patch) => Object.assign(business, patch)),
    };
    userRepo = { findOne: jest.fn(async () => owner) };
    bytid = {
      createLivenessSession: jest.fn(),
      verifyIdentity: jest.fn(async () => ninResult()),
      verifyDocument: jest.fn(),
      lookupCac: jest.fn(async () => cacResult()),
      getDocumentCheck: jest.fn(),
      findByReference: jest.fn(),
    };
    notifications = { create: jest.fn(), sendNotification: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        VerificationService,
        { provide: BytidClient, useValue: bytid },
        { provide: getRepositoryToken(VerificationCheck), useValue: checkRepo },
        { provide: getRepositoryToken(Business), useValue: businessRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: ModuleRef, useValue: { get: () => notifications } },
      ],
    }).compile();
    service = module.get(VerificationService);
  });

  const nin = {
    idType: 'nin' as const,
    idNumber: '12345678901',
    firstName: 'Adaeze',
    lastName: 'Okafor',
    livenessSessionId: 'liv_1',
  };

  describe('identity', () => {
    it('passes a matching NIN with a matching selfie, storing only the masked number', async () => {
      const result = await service.verifyIdentity('b1', 'owner-1', nin);

      expect(result).toMatchObject({
        status: 'verified',
        maskedId: '•••••••8901',
        recordName: 'ADAEZE TEST OKAFOR',
        reasons: [],
      });
      expect(bytid.verifyIdentity).toHaveBeenCalledWith(
        'nin',
        expect.objectContaining({
          reference: expect.stringMatching(/^ver_/),
          id_number: '12345678901',
          liveness_session_id: 'liv_1',
        }),
      );
      expect(business.verificationStatus).toBe(
        BusinessVerificationStatus.IN_PROGRESS,
      );
    });

    it('sends a face mismatch or a different name to review', async () => {
      bytid.verifyIdentity.mockResolvedValueOnce(
        ninResult({
          face_match: { status: 'not_matched', score: 21, liveness: 'passed' },
        }),
      );
      await expect(
        service.verifyIdentity('b1', 'owner-1', nin),
      ).resolves.toMatchObject({
        status: 'needs_review',
        reasons: ['face_not_matched'],
      });

      bytid.verifyIdentity.mockResolvedValueOnce(
        ninResult({ data: { first_name: 'TUNDE', last_name: 'BELLO' } }),
      );
      await expect(
        service.verifyIdentity('b1', 'owner-1', nin),
      ).resolves.toMatchObject({
        status: 'needs_review',
        reasons: ['name_mismatch'],
      });
      expect(business.verificationStatus).toBe(
        BusinessVerificationStatus.NEEDS_REVIEW,
      );
    });

    it('fails an ID that is not on the registry', async () => {
      bytid.verifyIdentity.mockResolvedValueOnce(
        ninResult({ status: 'not_found', data: null }),
      );
      await expect(
        service.verifyIdentity('b1', 'owner-1', nin),
      ).resolves.toMatchObject({
        status: 'failed',
        reasons: ['id_not_found'],
      });
    });

    it('records a registry outage and asks the user to retry', async () => {
      bytid.verifyIdentity.mockResolvedValueOnce(
        ninResult({ status: 'failed' }),
      );
      await expect(
        service.verifyIdentity('b1', 'owner-1', nin),
      ).rejects.toThrow(ServiceUnavailableException);
      expect(checks[0]).toMatchObject({
        status: 'failed',
        reasons: ['registry_unavailable'],
      });
    });

    it('only fetches passport photos from our own upload host', async () => {
      await expect(
        service.verifyIdentity('b1', 'owner-1', {
          ...nin,
          idType: 'passport',
          idNumber: undefined,
          documentUrl: 'https://evil.example.com/passport.jpg',
        }),
      ).rejects.toThrow(/POST \/uploads/);
      expect(bytid.verifyDocument).not.toHaveBeenCalled();
    });

    it('treats a passport bytID flags for review as needing review', () => {
      const check: any = { reasons: [] };
      service.applyDocumentResult(
        check,
        {
          id: 'doc_1',
          status: 'review',
          reasons: ['low_quality'],
          extracted: {
            id_number: 'A12345678',
            first_name: 'ADAEZE',
            last_name: 'OKAFOR',
          },
          checks: { face_match: { status: 'matched', score: 90 } },
        } as any,
        owner as any,
      );
      expect(check).toMatchObject({
        status: 'needs_review',
        reasons: ['low_quality'],
        idNumberMasked: '•••••5678',
      });
    });
  });

  describe('business', () => {
    it('verifies a matching CAC record and, with identity passed, the whole business', async () => {
      await service.verifyIdentity('b1', 'owner-1', nin);
      const result = await service.verifyBusiness('b1', 'owner-1', {
        registrationNumber: 'rc 123-4567',
      });

      expect(bytid.lookupCac).toHaveBeenCalledWith(
        expect.objectContaining({ id_number: 'RC1234567' }),
      );
      expect(result.status).toBe('verified');
      expect(business).toMatchObject({
        verificationStatus: BusinessVerificationStatus.VERIFIED,
        isVerified: true,
      });
      expect(business.verifiedAt).toBeInstanceOf(Date);
      expect(notifications.create).toHaveBeenCalledWith(
        'owner-1',
        'Your business is verified',
        expect.any(String),
        'success',
        '/business/verification',
        expect.any(Object),
      );
    });

    it('sends a different business, an unlisted owner or an inactive company to review', async () => {
      bytid.lookupCac.mockResolvedValueOnce(
        cacResult({
          data: {
            legal_name: 'SKY LOUNGE LIMITED',
            status: 'INACTIVE',
            directors: [{ name: 'TUNDE BELLO' }],
          },
        }),
      );
      await expect(
        service.verifyBusiness('b1', 'owner-1', { registrationNumber: 'RC1' }),
      ).resolves.toMatchObject({
        status: 'needs_review',
        reasons: [
          'business_name_mismatch',
          'owner_not_listed',
          'company_not_active',
        ],
      });
    });

    it('accepts a business-name record with no directors on the name alone', async () => {
      bytid.lookupCac.mockResolvedValueOnce(
        cacResult({
          data: {
            legal_name: 'MAMA PUT ENTERPRISES',
            directors: [],
            beneficial_owners: [],
          },
        }),
      );
      await expect(
        service.verifyBusiness('b1', 'owner-1', { registrationNumber: 'BN99' }),
      ).resolves.toMatchObject({ status: 'verified' });
    });

    it('puts an unregistered business in review', async () => {
      const result = await service.submitUnregistered('b1', 'owner-1', {
        note: 'Home kitchen',
        documentUrls: [
          'https://res.cloudinary.com/vemtap/image/upload/shop.jpg',
        ],
      });
      expect(result).toMatchObject({
        status: 'needs_review',
        idType: 'unregistered',
      });
      expect(business.verificationStatus).toBe(
        BusinessVerificationStatus.NEEDS_REVIEW,
      );
    });
  });

  it('lets the owner ask for a manual review of a failed check', async () => {
    bytid.verifyIdentity.mockResolvedValueOnce(
      ninResult({ status: 'not_found', data: null }),
    );
    await service.verifyIdentity('b1', 'owner-1', nin);
    const reviewed = await service.requestManualReview('b1', {
      note: 'Maiden name on record',
    });
    expect(reviewed).toMatchObject({
      status: 'needs_review',
      reasons: ['id_not_found', 'manual_review_requested'],
    });
  });

  it('reports status with the next step for the app', async () => {
    await expect(service.status('b1')).resolves.toMatchObject({
      status: 'unverified',
      nextStep: 'identity',
      identity: null,
    });
    await service.verifyIdentity('b1', 'owner-1', nin);
    await expect(service.status('b1')).resolves.toMatchObject({
      nextStep: 'business',
    });
  });

  describe('admin', () => {
    it('approves: checks awaiting review pass and the business is verified', async () => {
      await service.submitUnregistered('b1', 'owner-1', {});
      await service.adminDecide('b1', 'admin-1', 'approve', 'Visited the shop');
      expect(checks[0]).toMatchObject({
        status: 'verified',
        reviewedById: 'admin-1',
        reviewNote: 'Visited the shop',
      });
      expect(business).toMatchObject({
        verificationStatus: 'verified',
        isVerified: true,
      });
    });

    it('rejects, and a later failed attempt does not undo it', async () => {
      await service.submitUnregistered('b1', 'owner-1', {});
      await service.adminDecide('b1', 'admin-1', 'reject', 'Blurry documents');
      expect(business).toMatchObject({
        verificationStatus: 'rejected',
        isVerified: false,
      });

      bytid.verifyIdentity.mockResolvedValueOnce(
        ninResult({ status: 'not_found', data: null }),
      );
      await service.verifyIdentity('b1', 'owner-1', nin);
      expect(business.verificationStatus).toBe('rejected');
    });
  });

  it('applies a document check bytID finishes later, once', async () => {
    checks.push({
      id: 'c-doc',
      businessId: 'b1',
      userId: 'owner-1',
      kind: VerificationCheckKind.IDENTITY,
      status: VerificationCheckStatus.PENDING,
      providerCheckId: 'doc_9',
      reference: 'ver_doc',
      createdAt: new Date(),
    });
    checkRepo.findOne.mockResolvedValueOnce(checks[0]);
    bytid.getDocumentCheck.mockResolvedValue({
      id: 'doc_9',
      status: 'verified',
      reasons: [],
      extracted: { first_name: 'Adaeze', last_name: 'Okafor' },
      checks: null,
    });

    await service.handleWebhook({
      id: 'evt_1',
      type: 'document.completed',
      data: { id: 'doc_9' },
    } as any);
    expect(checks[0].status).toBe('verified');

    // A retried delivery finds the check no longer pending and does nothing.
    checkRepo.findOne.mockResolvedValueOnce(checks[0]);
    bytid.getDocumentCheck.mockClear();
    await service.handleWebhook({
      id: 'evt_1',
      type: 'document.completed',
      data: { id: 'doc_9' },
    } as any);
    expect(bytid.getDocumentCheck).not.toHaveBeenCalled();
  });
});
