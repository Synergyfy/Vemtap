import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { BytidClient } from './bytid/bytid.client';
import type {
  BytidCacCheck,
  BytidDocumentCheck,
  BytidIdentityCheck,
  BytidWebhookEvent,
} from './bytid/bytid.types';
import {
  IdentityDocumentType,
  VerificationCheck,
  VerificationCheckKind,
  VerificationCheckStatus,
} from './entities/verification-check.entity';
import {
  Business,
  BusinessVerificationStatus,
} from '../businesses/entities/business.entity';
import { User } from '../users/entities/user.entity';
import {
  ManualReviewDto,
  UnregisteredBusinessDto,
  VerifyBusinessDto,
  VerifyIdentityDto,
} from './dto/verify.dto';
import {
  businessNameMatches,
  maskIdNumber,
  ownerListedOnCac,
  personNameMatches,
} from './verification-rules';
import { NotificationsService } from '../notifications/notifications.service';
import { PushNotificationService } from '../notifications/push-notification.service';

/** Uploaded evidence must be one of our own hosted files. */
const ALLOWED_DOCUMENT_HOSTS = ['res.cloudinary.com'];
const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024;

export interface CheckView {
  id: string;
  kind: VerificationCheckKind;
  idType: IdentityDocumentType;
  status: VerificationCheckStatus;
  maskedId: string | null;
  recordName: string | null;
  reasons: string[];
  faceMatch: { status: string; score: number | null } | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
}

/**
 * Business verification on bytID: who runs the account (ID + selfie) and the
 * business itself (CAC). Both passing with matching names verifies the
 * business on the spot; anything uncertain waits for a person at VEMTAP.
 */
/** Selfie sessions are referenced per business so status checks stay scoped. */
function livenessPrefix(businessId: string): string {
  return `liv_${businessId.replace(/-/g, '')}_`;
}

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    private readonly bytid: BytidClient,
    @InjectRepository(VerificationCheck)
    private readonly checkRepo: Repository<VerificationCheck>,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly moduleRef: ModuleRef,
    private readonly config: ConfigService,
  ) {}

  // ─── selfie ──────────────────────────────────────────────────────────

  async startLiveness(businessId: string, redirectUrl?: string) {
    await this.business(businessId);
    const session = await this.bytid.createLivenessSession(
      `${livenessPrefix(businessId)}${uuidv4().replace(/-/g, '')}`,
      this.livenessRedirect(redirectUrl),
    );
    return {
      sessionId: session.id,
      url: session.url,
      status: session.status,
      expiresAt: session.expires_at ?? null,
    };
  }

  /**
   * bytID only redirects to https. An https URL from the client is used as
   * is; an app link (vemtap://…) goes through our https return page
   * (`GET /verification/liveness/return`), which needs `API_PUBLIC_URL`.
   * Without it there is no redirect: the person closes the page and the app
   * asks for the session status instead.
   */
  private livenessRedirect(requested?: string): string | undefined {
    if (requested?.startsWith('https://')) return requested;
    const base = this.config
      .get<string>('API_PUBLIC_URL')
      ?.trim()
      .replace(/\/+$/, '');
    if (!requested || !base?.startsWith('https://')) return undefined;
    return `${base}/api/v1/verification/liveness/return`;
  }

  /** Whether a selfie session finished and can be used with an ID check. */
  async livenessStatus(businessId: string, sessionId: string) {
    const session = await this.bytid.getLivenessSession(sessionId);
    if (!session.reference?.startsWith(livenessPrefix(businessId))) {
      throw new NotFoundException('Selfie check not found');
    }
    return {
      sessionId: session.id,
      status: session.status,
      usableForFaceMatch: session.usable_for_face_match,
      reasons: session.reasons ?? [],
      expiresAt: session.expires_at ?? null,
    };
  }

  // ─── identity ────────────────────────────────────────────────────────

  async verifyIdentity(
    businessId: string,
    userId: string,
    dto: VerifyIdentityDto,
  ) {
    const [business, user] = await Promise.all([
      this.business(businessId),
      this.userRepo.findOne({ where: { id: userId } }),
    ]);
    if (!user) throw new NotFoundException('User not found');

    const check = await this.checkRepo.save(
      this.checkRepo.create({
        businessId,
        userId,
        kind: VerificationCheckKind.IDENTITY,
        idType: dto.idType as IdentityDocumentType,
        idNumberMasked: maskIdNumber(dto.idNumber),
        reference: `ver_${uuidv4()}`,
        livenessSessionId: dto.livenessSessionId,
        documentUrls: dto.documentUrl ? [dto.documentUrl] : null,
        status: VerificationCheckStatus.PENDING,
      }),
    );
    await this.markInProgress(business);

    try {
      if (dto.idType === 'passport') {
        const image = await this.fetchDocument(dto.documentUrl!);
        const result = await this.bytid.verifyDocument({
          reference: check.reference,
          front_image: image,
          document_type: 'passport',
          liveness_session_id: dto.livenessSessionId,
        });
        this.applyDocumentResult(check, result, user);
      } else {
        const result = await this.bytid.verifyIdentity(dto.idType, {
          reference: check.reference,
          id_number: dto.idNumber!.replace(/\s+/g, ''),
          first_name: dto.firstName,
          last_name: dto.lastName,
          ...(dto.dob && { dob: dto.dob }),
          liveness_session_id: dto.livenessSessionId,
        });
        this.applyIdentityResult(check, result, user);
      }
    } catch (error) {
      check.status = VerificationCheckStatus.FAILED;
      check.reasons = check.reasons?.length
        ? check.reasons
        : ['provider_error'];
      await this.checkRepo.save(check);
      throw error;
    }

    await this.checkRepo.save(check);
    await this.evaluate(businessId);
    return this.view(check);
  }

  applyIdentityResult(
    check: VerificationCheck,
    result: BytidIdentityCheck,
    user: User,
  ) {
    check.providerCheckId = result.id;
    if (result.status === 'not_found') {
      check.status = VerificationCheckStatus.FAILED;
      check.reasons = ['id_not_found'];
      return;
    }
    if (result.status === 'failed') {
      // The registry was unreachable: nothing to judge yet.
      check.status = VerificationCheckStatus.FAILED;
      check.reasons = ['registry_unavailable'];
      throw new ServiceUnavailableException(
        'The ID registry is not responding right now. Please try again shortly.',
      );
    }

    const recordName =
      result.data?.full_name ??
      [
        result.data?.first_name,
        result.data?.middle_name,
        result.data?.last_name,
      ]
        .filter(Boolean)
        .join(' ');
    const nameMatched = personNameMatches(user, result.data ?? undefined);
    check.nameMatch = {
      recordName: recordName || null,
      accountName: [user.firstName, user.lastName].filter(Boolean).join(' '),
      matched: nameMatched,
      fieldMatches: result.field_matches,
    };
    check.faceMatch = result.face_match
      ? { status: result.face_match.status, score: result.face_match.score }
      : null;

    const reasons: string[] = [];
    if (result.face_match?.status !== 'matched') {
      reasons.push(
        result.face_match?.status === 'not_matched'
          ? 'face_not_matched'
          : 'face_unavailable',
      );
    }
    if (!nameMatched) reasons.push('name_mismatch');
    check.reasons = reasons;
    check.status = reasons.length
      ? VerificationCheckStatus.NEEDS_REVIEW
      : VerificationCheckStatus.VERIFIED;
  }

  applyDocumentResult(
    check: VerificationCheck,
    result: BytidDocumentCheck,
    user: User,
  ) {
    check.providerCheckId = result.id;
    check.idNumberMasked =
      maskIdNumber(result.extracted?.id_number ?? result.id_number) ??
      check.idNumberMasked;
    const nameMatched = personNameMatches(user, result.extracted ?? undefined);
    const recordName = [
      result.extracted?.first_name,
      result.extracted?.middle_name,
      result.extracted?.last_name,
    ]
      .filter(Boolean)
      .join(' ');
    check.nameMatch = {
      recordName: recordName || null,
      accountName: [user.firstName, user.lastName].filter(Boolean).join(' '),
      matched: nameMatched,
    };
    const face = result.checks?.face_match;
    if (face && typeof face === 'object') {
      check.faceMatch = {
        status: face.status ?? 'unknown',
        score: face.score ?? null,
      };
    }
    const reasons = [...(result.reasons ?? [])];
    if (!nameMatched) reasons.push('name_mismatch');
    check.reasons = reasons;
    check.status =
      result.status === 'rejected'
        ? VerificationCheckStatus.FAILED
        : result.status === 'verified' && nameMatched
          ? VerificationCheckStatus.VERIFIED
          : VerificationCheckStatus.NEEDS_REVIEW;
  }

  /** Download an uploaded passport photo as base64 for bytID. */
  private async fetchDocument(url: string): Promise<string> {
    const host = new URL(url).hostname;
    if (!ALLOWED_DOCUMENT_HOSTS.includes(host)) {
      throw new BadRequestException(
        'Upload the document with POST /uploads first',
      );
    }
    const response = await axios.get<ArrayBuffer>(url, {
      responseType: 'arraybuffer',
      timeout: 20_000,
      maxContentLength: MAX_DOCUMENT_BYTES,
    });
    return Buffer.from(response.data).toString('base64');
  }

  // ─── business ────────────────────────────────────────────────────────

  async verifyBusiness(
    businessId: string,
    userId: string,
    dto: VerifyBusinessDto,
  ) {
    const business = await this.business(businessId);
    const owner = await this.userRepo.findOne({
      where: { id: business.ownerId },
    });
    const number = dto.registrationNumber.toUpperCase().replace(/[\s-]+/g, '');

    const check = await this.checkRepo.save(
      this.checkRepo.create({
        businessId,
        userId,
        kind: VerificationCheckKind.BUSINESS,
        idType: IdentityDocumentType.CAC,
        idNumberMasked: number,
        reference: `ver_${uuidv4()}`,
        status: VerificationCheckStatus.PENDING,
      }),
    );
    await this.markInProgress(business);

    try {
      const result = await this.bytid.lookupCac({
        reference: check.reference,
        id_number: number,
      });
      this.applyCacResult(check, result, business, owner);
    } catch (error) {
      check.status = VerificationCheckStatus.FAILED;
      check.reasons = check.reasons?.length
        ? check.reasons
        : ['provider_error'];
      await this.checkRepo.save(check);
      throw error;
    }

    await this.checkRepo.save(check);
    await this.evaluate(businessId);
    return this.view(check);
  }

  applyCacResult(
    check: VerificationCheck,
    result: BytidCacCheck,
    business: Business,
    owner: User | null,
  ) {
    check.providerCheckId = result.id;
    if (result.status === 'not_found') {
      check.status = VerificationCheckStatus.FAILED;
      check.reasons = ['cac_not_found'];
      return;
    }
    if (result.status === 'failed') {
      check.status = VerificationCheckStatus.FAILED;
      check.reasons = ['registry_unavailable'];
      throw new ServiceUnavailableException(
        'The CAC registry is not responding right now. Please try again shortly.',
      );
    }
    const people = [
      ...(result.data?.directors ?? []),
      ...(result.data?.beneficial_owners ?? []),
    ];
    const nameMatched = businessNameMatches(
      business.name,
      result.data?.legal_name,
    );
    // Business-name (BN) records list no directors; the name match carries it.
    const ownerListed =
      people.length === 0 || (owner ? ownerListedOnCac(owner, people) : false);
    const active = !result.data?.status || /^active$/i.test(result.data.status);

    check.nameMatch = {
      recordName: result.data?.legal_name ?? null,
      businessName: business.name,
      matched: nameMatched,
      ownerListed,
      companyStatus: result.data?.status ?? null,
    };
    const reasons: string[] = [];
    if (!nameMatched) reasons.push('business_name_mismatch');
    if (!ownerListed) reasons.push('owner_not_listed');
    if (!active) reasons.push('company_not_active');
    check.reasons = reasons;
    check.status = reasons.length
      ? VerificationCheckStatus.NEEDS_REVIEW
      : VerificationCheckStatus.VERIFIED;
  }

  /** A business without CAC registration: always reviewed by a person. */
  async submitUnregistered(
    businessId: string,
    userId: string,
    dto: UnregisteredBusinessDto,
  ) {
    const business = await this.business(businessId);
    for (const url of dto.documentUrls ?? []) {
      if (!ALLOWED_DOCUMENT_HOSTS.includes(new URL(url).hostname)) {
        throw new BadRequestException(
          'Upload documents with POST /uploads first',
        );
      }
    }
    const check = await this.checkRepo.save(
      this.checkRepo.create({
        businessId,
        userId,
        kind: VerificationCheckKind.BUSINESS,
        idType: IdentityDocumentType.UNREGISTERED,
        reference: `ver_${uuidv4()}`,
        status: VerificationCheckStatus.NEEDS_REVIEW,
        reasons: ['unregistered_business'],
        note: dto.note ?? null,
        documentUrls: dto.documentUrls ?? null,
      }),
    );
    await this.markInProgress(business);
    await this.evaluate(businessId);
    return this.view(check);
  }

  /** The owner asks a person to look at a check that did not pass. */
  async requestManualReview(businessId: string, dto: ManualReviewDto) {
    const check = dto.checkId
      ? await this.checkRepo.findOne({ where: { id: dto.checkId, businessId } })
      : await this.latest(businessId, VerificationCheckKind.IDENTITY);
    if (!check) throw new NotFoundException('No verification to review');
    if (check.status === VerificationCheckStatus.VERIFIED) {
      throw new BadRequestException('This check already passed');
    }
    check.status = VerificationCheckStatus.NEEDS_REVIEW;
    check.note = dto.note ?? check.note;
    check.reasons = [
      ...new Set([...(check.reasons ?? []), 'manual_review_requested']),
    ];
    await this.checkRepo.save(check);
    await this.evaluate(businessId);
    return this.view(check);
  }

  // ─── status ──────────────────────────────────────────────────────────

  async status(businessId: string) {
    const business = await this.business(businessId);
    const [identity, businessCheck] = await Promise.all([
      this.latest(businessId, VerificationCheckKind.IDENTITY),
      this.latest(businessId, VerificationCheckKind.BUSINESS),
    ]);
    const identityOk = identity?.status === VerificationCheckStatus.VERIFIED;
    const businessOk =
      businessCheck?.status === VerificationCheckStatus.VERIFIED;
    const nextStep =
      business.verificationStatus === BusinessVerificationStatus.VERIFIED
        ? 'done'
        : business.verificationStatus ===
            BusinessVerificationStatus.NEEDS_REVIEW
          ? 'review'
          : !identityOk
            ? 'identity'
            : !businessOk
              ? 'business'
              : 'review';
    return {
      status: business.verificationStatus,
      isVerified: business.isVerified,
      verifiedAt: business.verifiedAt?.toISOString() ?? null,
      nextStep,
      identity: identity ? this.view(identity) : null,
      business: businessCheck ? this.view(businessCheck) : null,
    };
  }

  /**
   * Recompute the business's verification from its latest checks. Identity
   * and business both passing verifies it; a check waiting for review puts
   * the business in review. An admin decision is not undone by later failed
   * attempts.
   */
  async evaluate(businessId: string): Promise<BusinessVerificationStatus> {
    const business = await this.business(businessId);
    const [identity, businessCheck] = await Promise.all([
      this.latest(businessId, VerificationCheckKind.IDENTITY),
      this.latest(businessId, VerificationCheckKind.BUSINESS),
    ]);
    const statuses = [identity?.status, businessCheck?.status];

    let next: BusinessVerificationStatus;
    if (statuses.every((s) => s === VerificationCheckStatus.VERIFIED)) {
      next = BusinessVerificationStatus.VERIFIED;
    } else if (
      business.verificationStatus === BusinessVerificationStatus.VERIFIED
    ) {
      return business.verificationStatus;
    } else if (statuses.includes(VerificationCheckStatus.NEEDS_REVIEW)) {
      next = BusinessVerificationStatus.NEEDS_REVIEW;
    } else if (
      business.verificationStatus === BusinessVerificationStatus.REJECTED
    ) {
      // Stays rejected until a new attempt passes or needs review.
      return business.verificationStatus;
    } else {
      next = statuses.some(Boolean)
        ? BusinessVerificationStatus.IN_PROGRESS
        : BusinessVerificationStatus.UNVERIFIED;
    }

    if (next !== business.verificationStatus) {
      const becameVerified = next === BusinessVerificationStatus.VERIFIED;
      await this.businessRepo.update(businessId, {
        verificationStatus: next,
        ...(becameVerified && { isVerified: true, verifiedAt: new Date() }),
      });
      if (becameVerified) {
        await this.notifyOwner(
          business,
          'Your business is verified',
          `${business.name} now shows the verified badge.`,
          'success',
        );
      }
    }
    return next;
  }

  // ─── admin ───────────────────────────────────────────────────────────

  async adminDetail(businessId: string) {
    const business = await this.business(businessId);
    const checks = await this.checkRepo.find({
      where: { businessId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    return {
      businessId,
      businessName: business.name,
      status: business.verificationStatus,
      isVerified: business.isVerified,
      verifiedAt: business.verifiedAt?.toISOString() ?? null,
      checks: checks.map((check) => ({
        ...this.view(check),
        nameMatch: check.nameMatch,
        documentUrls: check.documentUrls ?? [],
        note: check.note,
        userId: check.userId,
      })),
    };
  }

  async adminDecide(
    businessId: string,
    adminId: string,
    decision: 'approve' | 'reject',
    note?: string,
  ) {
    const business = await this.business(businessId);
    const approve = decision === 'approve';
    const pending = await this.checkRepo.find({
      where: { businessId, status: VerificationCheckStatus.NEEDS_REVIEW },
    });
    for (const check of pending) {
      check.status = approve
        ? VerificationCheckStatus.VERIFIED
        : VerificationCheckStatus.FAILED;
      check.reviewedById = adminId;
      check.reviewedAt = new Date();
      check.reviewNote = note ?? null;
    }
    if (pending.length) await this.checkRepo.save(pending);

    await this.businessRepo.update(businessId, {
      verificationStatus: approve
        ? BusinessVerificationStatus.VERIFIED
        : BusinessVerificationStatus.REJECTED,
      isVerified: approve,
      verifiedAt: approve ? new Date() : null,
    });
    await this.notifyOwner(
      business,
      approve ? 'Your business is verified' : 'Verification needs another look',
      approve
        ? `${business.name} now shows the verified badge.`
        : `We couldn't verify ${business.name}${note ? `: ${note}` : '.'} You can update your details and try again.`,
      approve ? 'success' : 'warning',
    );
    return this.adminDetail(businessId);
  }

  // ─── webhooks ────────────────────────────────────────────────────────

  /**
   * bytID tells us when an asynchronous check finishes. Checks run inline
   * already, so this mainly catches document checks bytID completes later.
   * Applying the same result twice is harmless, which makes retries safe.
   */
  async handleWebhook(event: BytidWebhookEvent): Promise<void> {
    if (
      event.type !== 'document.completed' &&
      event.type !== 'verification.completed'
    )
      return;
    const providerId = event.data?.id;
    const reference = event.data?.reference;
    const check = await this.checkRepo.findOne({
      where: providerId
        ? [
            { providerCheckId: providerId },
            ...(reference ? [{ reference }] : []),
          ]
        : { reference },
    });
    if (!check || check.status !== VerificationCheckStatus.PENDING) return;
    const user = check.userId
      ? await this.userRepo.findOne({ where: { id: check.userId } })
      : null;
    if (!user) return;

    if (event.type === 'document.completed' && providerId) {
      this.applyDocumentResult(
        check,
        await this.bytid.getDocumentCheck(providerId),
        user,
      );
    } else if (check.kind === VerificationCheckKind.IDENTITY) {
      this.applyIdentityResult(
        check,
        await this.bytid.findByReference<BytidIdentityCheck>(check.reference),
        user,
      );
    } else {
      const business = await this.business(check.businessId);
      const owner = await this.userRepo.findOne({
        where: { id: business.ownerId },
      });
      this.applyCacResult(
        check,
        await this.bytid.findByReference<BytidCacCheck>(check.reference),
        business,
        owner,
      );
    }
    await this.checkRepo.save(check);
    await this.evaluate(check.businessId);
  }

  // ─── helpers ─────────────────────────────────────────────────────────

  private async business(businessId: string): Promise<Business> {
    if (!businessId) throw new BadRequestException('Business context required');
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }

  private async markInProgress(business: Business) {
    if (
      business.verificationStatus === BusinessVerificationStatus.UNVERIFIED ||
      !business.verificationStatus
    ) {
      await this.businessRepo.update(business.id, {
        verificationStatus: BusinessVerificationStatus.IN_PROGRESS,
      });
      business.verificationStatus = BusinessVerificationStatus.IN_PROGRESS;
    }
  }

  private latest(businessId: string, kind: VerificationCheckKind) {
    return this.checkRepo.findOne({
      where: { businessId, kind },
      order: { createdAt: 'DESC' },
    });
  }

  view(check: VerificationCheck): CheckView {
    return {
      id: check.id,
      kind: check.kind,
      idType: check.idType,
      status: check.status,
      maskedId: check.idNumberMasked,
      recordName:
        (check.nameMatch?.recordName as string | null | undefined) ?? null,
      reasons: check.reasons ?? [],
      faceMatch: check.faceMatch,
      createdAt: (check.createdAt ?? new Date()).toISOString(),
      reviewedAt: check.reviewedAt?.toISOString() ?? null,
      reviewNote: check.reviewNote,
    };
  }

  private async notifyOwner(
    business: Business,
    title: string,
    message: string,
    type: string,
  ) {
    if (!business.ownerId) return;
    const data = {
      type: 'verification',
      category: 'account',
      url: '/business/verification',
    };
    try {
      await this.moduleRef
        .get(NotificationsService, { strict: false })
        .create(
          business.ownerId,
          title,
          message,
          type,
          '/business/verification',
          data,
        );
      await this.moduleRef
        .get(PushNotificationService, { strict: false })
        .sendNotification(business.ownerId, title, message, data);
    } catch (err) {
      this.logger.warn(
        `Verification notice to ${business.ownerId} failed: ${(err as Error).message}`,
      );
    }
  }
}
