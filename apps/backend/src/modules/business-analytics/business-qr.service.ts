import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';
import {
  BusinessAnalyticsService,
  type AnalyticsRange,
} from './business-analytics.service';
import { AnalyticsRangeQueryDto } from './dto/analytics-range.dto';
import { FROM, PREV_FROM, TO, inBranch } from './business-analytics.sql';

const DAY_MS = 86_400_000;
/** A device seen within this many days counts as live. */
const LIVE_DEVICE_DAYS = 7;

const num = (value: unknown) => Number(value) || 0;
const ratio = (part: number, whole: number) =>
  whole > 0 ? Math.round((part / whole) * 100) / 100 : 0;

export interface QrCodeArt {
  url: string;
  /** Standalone SVG markup of the QR code for `url`. */
  svg: string;
}

/**
 * The business's own QR codes — no external service: the business link
 * (`/b/{businessCode}`), one per branch (`/b/{branchCode}`) and one per
 * VemTap tap device (`/{branchUsername}/{deviceCode}`), with scan counts from
 * the visits those taps record.
 */
@Injectable()
export class BusinessQrService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly analytics: BusinessAnalyticsService,
    private readonly config: ConfigService,
  ) {}

  private get appUrl(): string {
    return (
      this.config.get<string>('VEMTAP_APP_URL') ?? 'https://vemtap.com'
    ).replace(/\/+$/, '');
  }

  businessUrl(code: string) {
    return `${this.appUrl}/b/${encodeURIComponent(code)}`;
  }

  deviceUrl(
    branch: { username: string | null; uniqueCode: string },
    deviceCode: string,
  ) {
    return branch.username
      ? `${this.appUrl}/${encodeURIComponent(branch.username)}/${encodeURIComponent(deviceCode)}`
      : this.businessUrl(branch.uniqueCode);
  }

  async art(url: string): Promise<QrCodeArt> {
    const svg = await QRCode.toString(url, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 1,
    });
    return { url, svg };
  }

  private async loadBusiness(businessId: string) {
    const [business] = await this.dataSource.query<
      { id: string; name: string; uniqueCode: string; logoUrl: string | null }[]
    >(
      `SELECT "id", "name", "uniqueCode", "logoUrl" FROM "businesses"
       WHERE "id" = $1 AND "deletedAt" IS NULL`,
      [businessId],
    );
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }

  async getSummary(businessId: string, query: AnalyticsRangeQueryDto) {
    const range = await this.analytics.resolveRange(businessId, query);
    const business = await this.loadBusiness(businessId);
    const params = [
      businessId,
      range.previousFrom,
      range.from,
      range.to,
      range.branchId,
    ];

    const [stats, branches, devices] = await Promise.all([
      this.dataSource.query<Record<string, string | number>[]>(
        `WITH scans AS (
           SELECT v."customerId", v."createdAt" AS at
           FROM "visits" v
           WHERE v."businessId" = $1 AND v."deletedAt" IS NULL
             AND v."createdAt" >= ${PREV_FROM} AND v."createdAt" < ${TO}
             AND ${inBranch(`v."branchId"`)}
         ),
         firsts AS (
           SELECT v."customerId", MIN(v."createdAt") AS "firstAt"
           FROM "visits" v
           WHERE v."businessId" = $1 AND v."deletedAt" IS NULL AND v."customerId" IS NOT NULL
           GROUP BY v."customerId"
         ),
         scanners AS (
           SELECT DISTINCT "customerId" FROM scans
           WHERE at >= ${FROM} AND "customerId" IS NOT NULL
         )
         SELECT
           (SELECT COUNT(*) FROM scans WHERE at >= ${FROM})::int AS scans,
           (SELECT COUNT(*) FROM scans WHERE at < ${FROM})::int AS "previousScans",
           (SELECT COUNT(*) FROM firsts WHERE "firstAt" >= ${FROM} AND "firstAt" < ${TO})::int
             AS "newCustomers",
           (SELECT COUNT(*) FROM firsts
             WHERE "firstAt" >= ${PREV_FROM} AND "firstAt" < ${FROM})::int AS "previousNewCustomers",
           (SELECT COUNT(*) FROM scanners)::int AS scanners,
           (SELECT COUNT(*) FROM scanners s
             WHERE EXISTS (
               SELECT 1 FROM "catalogue_offer_claims" c
               JOIN "catalogue_offers" o ON o."id" = c."offerId"
               WHERE c."userId" = s."customerId" AND o."businessId" = $1
                 AND c."deletedAt" IS NULL
                 AND c."createdAt" >= ${FROM} AND c."createdAt" < ${TO}
             ))::int AS claimers`,
        params,
      ),
      this.dataSource.query<
        {
          id: string;
          name: string;
          address: string | null;
          uniqueCode: string;
          username: string | null;
          isMainBranch: boolean;
          isActive: boolean;
          scans: number;
          previousScans: number;
        }[]
      >(
        `SELECT b."id", b."name", b."address", b."uniqueCode", b."username",
                b."isMainBranch", b."isActive",
                COUNT(v."id") FILTER (WHERE v."createdAt" >= ${FROM})::int AS scans,
                COUNT(v."id") FILTER (WHERE v."createdAt" < ${FROM})::int AS "previousScans"
         FROM "branches" b
         LEFT JOIN "visits" v ON v."branchId" = b."id" AND v."deletedAt" IS NULL
           AND v."createdAt" >= ${PREV_FROM} AND v."createdAt" < ${TO}
         WHERE b."businessId" = $1 AND b."deletedAt" IS NULL AND ${inBranch(`b."id"`)}
         GROUP BY b."id"
         ORDER BY b."isMainBranch" DESC, b."name"`,
        params,
      ),
      this.dataSource.query<
        {
          id: string;
          name: string;
          code: string;
          type: string;
          status: string;
          location: string | null;
          totalScans: number;
          lastActive: string | null;
          branchId: string;
          scans: number;
          weekScans: number;
        }[]
      >(
        `SELECT d."id", d."name", d."code", d."type", d."status", d."location",
                d."totalScans", d."lastActive", d."branchId",
                COUNT(v."id") FILTER (WHERE v."createdAt" >= ${FROM})::int AS scans,
                COUNT(v."id") FILTER (
                  WHERE v."createdAt" >= ${TO} - interval '7 days'
                )::int AS "weekScans"
         FROM "devices" d
         JOIN "branches" b ON b."id" = d."branchId" AND b."deletedAt" IS NULL
         LEFT JOIN "visits" v ON v."deviceId" = d."id" AND v."deletedAt" IS NULL
           AND v."createdAt" >= LEAST(${FROM}, ${TO} - interval '7 days') AND v."createdAt" < ${TO}
         WHERE b."businessId" = $1 AND d."deletedAt" IS NULL AND ${inBranch(`d."branchId"`)}
           AND $2::text IS NOT NULL
         GROUP BY d."id"
         ORDER BY scans DESC, d."name"`,
        params,
      ),
    ]);

    const s = stats[0] ?? {};
    const branchById = new Map(branches.map((branch) => [branch.id, branch]));
    const liveSince = Date.now() - LIVE_DEVICE_DAYS * DAY_MS;

    const [businessArt, branchArt, deviceArt] = await Promise.all([
      this.art(this.businessUrl(business.uniqueCode)),
      Promise.all(
        branches.map((branch) => this.art(this.businessUrl(branch.uniqueCode))),
      ),
      Promise.all(
        devices.map((device) => {
          const branch = branchById.get(device.branchId);
          return this.art(
            branch
              ? this.deviceUrl(branch, device.code)
              : this.businessUrl(business.uniqueCode),
          );
        }),
      ),
    ]);

    const points = devices.map((device, index) => ({
      id: device.id,
      name: device.name,
      code: device.code,
      type: device.type,
      location: device.location,
      branchId: device.branchId,
      branchName: branchById.get(device.branchId)?.name ?? null,
      active: device.status === 'active',
      live:
        device.status === 'active' &&
        !!device.lastActive &&
        new Date(device.lastActive).getTime() >= liveSince,
      lastActive: device.lastActive,
      totalScans: num(device.totalScans),
      scans: num(device.scans),
      weekScans: num(device.weekScans),
      qr: deviceArt[index],
    }));

    return {
      range,
      business: {
        id: business.id,
        name: business.name,
        logoUrl: business.logoUrl,
        code: business.uniqueCode,
        qr: businessArt,
      },
      stats: {
        scans: { current: num(s.scans), previous: num(s.previousScans) },
        newCustomers: {
          current: num(s.newCustomers),
          previous: num(s.previousNewCustomers),
        },
        claimRate: ratio(num(s.claimers), num(s.scanners)),
      },
      branches: branches.map((branch, index) => ({
        id: branch.id,
        name: branch.name,
        address: branch.address,
        code: branch.uniqueCode,
        username: branch.username,
        isMainBranch: branch.isMainBranch,
        isActive: branch.isActive,
        scans: {
          current: num(branch.scans),
          previous: num(branch.previousScans),
        },
        qr: branchArt[index],
      })),
      points,
      totals: {
        branches: branches.length,
        points: points.length,
        activePoints: points.filter((point) => point.active).length,
        livePoints: points.filter((point) => point.live).length,
        weekScans: points.reduce((sum, point) => sum + point.weekScans, 0),
      },
    };
  }

  /**
   * A printable PDF with the business QR and every branch and device QR, each
   * labelled with what it opens — what owners print as stickers and standees.
   */
  async getKit(businessId: string, query: AnalyticsRangeQueryDto) {
    const summary = await this.getSummary(businessId, query);
    const range: AnalyticsRange = summary.range;
    const cards: { title: string; subtitle: string; url: string }[] = [
      {
        title: summary.business.name,
        subtitle: 'Business QR',
        url: summary.business.qr.url,
      },
      ...summary.branches.map((branch) => ({
        title: branch.name,
        subtitle: 'Branch QR',
        url: branch.qr.url,
      })),
      ...summary.points.map((point) => ({
        title: point.name,
        subtitle:
          [point.branchName, point.location].filter(Boolean).join(' · ') ||
          'Tap point',
        url: point.qr.url,
      })),
    ];
    const pngs = await Promise.all(
      cards.map((card) =>
        QRCode.toBuffer(card.url, { type: 'png', width: 360, margin: 1 }),
      ),
    );

    const buffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 36 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const columns = 2;
      const cellWidth = (doc.page.width - 72) / columns;
      const cellHeight = 300;
      cards.forEach((card, index) => {
        const slot = index % (columns * 2);
        if (index > 0 && slot === 0) doc.addPage();
        const x = 36 + (slot % columns) * cellWidth;
        const y = 36 + Math.floor(slot / columns) * cellHeight;
        doc
          .font('Helvetica-Bold')
          .fontSize(13)
          .text(card.title, x, y, {
            width: cellWidth - 12,
            align: 'center',
            lineBreak: false,
            ellipsis: true,
          });
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#555555')
          .text(card.subtitle, x, y + 18, {
            width: cellWidth - 12,
            align: 'center',
            lineBreak: false,
            ellipsis: true,
          });
        doc.image(pngs[index], x + (cellWidth - 12 - 200) / 2, y + 36, {
          width: 200,
        });
        doc.fontSize(8).text(card.url, x, y + 244, {
          width: cellWidth - 12,
          align: 'center',
          lineBreak: false,
          ellipsis: true,
        });
        doc.fillColor('#000000');
      });
      doc.end();
    });

    const slug =
      summary.business.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'business';
    return {
      filename: `${slug}-qr-kit${range.branchId ? '-branch' : ''}.pdf`,
      mimeType: 'application/pdf',
      contentBase64: buffer.toString('base64'),
      sizeBytes: buffer.length,
      codes: cards.length,
    };
  }
}
