import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import PDFDocument from 'pdfkit';
import { BusinessAnalyticsService } from './business-analytics.service';
import {
  AnalyticsExportDto,
  EXPORT_MODULES,
  ExportModule,
} from './dto/analytics-range.dto';

type Cell = string | number | null | undefined;

interface ReportTable {
  title: string;
  columns: string[];
  rows: Cell[][];
}

interface ReportSection {
  module: ExportModule;
  title: string;
  tables: ReportTable[];
}

export interface AnalyticsExportFile {
  filename: string;
  mimeType: string;
  contentBase64: string;
  sizeBytes: number;
  records: number;
  modules: ExportModule[];
  range: { from: string; to: string };
}

const MODULE_TITLES: Record<ExportModule, string> = {
  overview: 'Business overview & revenue',
  customers: 'Customer acquisition & retention',
  deals: 'Deal performance & redemption funnel',
  locations: 'Branch comparison',
  pos: 'POS sales & payment breakdown',
  audit: 'Supervisor overrides (audit log)',
};

/** Escapes one CSV cell (RFC 4180) and neutralises spreadsheet formulas. */
export function csvCell(value: Cell): string {
  if (value === null || value === undefined) return '';
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text) && typeof value === 'string') {
    text = `'${text}`;
  }
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const percent = (ratio: number) => `${Math.round(ratio * 1000) / 10}%`;

/**
 * Builds the analytics report a business downloads from the Export screen:
 * the same figures as the analytics endpoints, as CSV tables or a PDF.
 */
@Injectable()
export class BusinessAnalyticsExportService {
  constructor(
    private readonly analytics: BusinessAnalyticsService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async export(
    businessId: string,
    dto: AnalyticsExportDto,
  ): Promise<AnalyticsExportFile> {
    const modules = dto.modules?.length ? dto.modules : [...EXPORT_MODULES];
    const query = { from: dto.from, to: dto.to, branchId: dto.branchId };
    const range = await this.analytics.resolveRange(businessId, query);
    const sections = await Promise.all(
      modules.map((module) => this.section(module, businessId, query, range)),
    );

    const [business] = await this.dataSource.query<{ name: string }[]>(
      `SELECT "name" FROM "businesses" WHERE "id" = $1`,
      [businessId],
    );
    const businessName = business?.name ?? 'Business';
    const records = sections.reduce(
      (sum, section) =>
        sum + section.tables.reduce((n, table) => n + table.rows.length, 0),
      0,
    );
    const stamp = `${range.from.slice(0, 10)}_${range.to.slice(0, 10)}`;
    const slug =
      businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'business';

    const format = dto.format ?? 'csv';
    const buffer =
      format === 'pdf'
        ? await this.toPdf(businessName, range, sections)
        : Buffer.from(this.toCsv(businessName, range, sections), 'utf8');

    return {
      filename: `${slug}-analytics-${stamp}.${format}`,
      mimeType: format === 'pdf' ? 'application/pdf' : 'text/csv',
      contentBase64: buffer.toString('base64'),
      sizeBytes: buffer.length,
      records,
      modules,
      range: { from: range.from, to: range.to },
    };
  }

  private async section(
    module: ExportModule,
    businessId: string,
    query: AnalyticsExportDto,
    range: Awaited<ReturnType<BusinessAnalyticsService['resolveRange']>>,
  ): Promise<ReportSection> {
    const title = MODULE_TITLES[module];
    switch (module) {
      case 'overview': {
        const o = await this.analytics.getOverview(businessId, query);
        return {
          module,
          title,
          tables: [
            {
              title: 'Summary',
              columns: ['Metric', 'This period', 'Previous period'],
              rows: [
                ['Revenue (NGN)', o.revenue.current, o.revenue.previous],
                ['Orders', o.orders.current, o.orders.previous],
                [
                  'Average order value (NGN)',
                  o.averageOrderValue.current,
                  o.averageOrderValue.previous,
                ],
                [
                  'Interactions',
                  o.interactions.current,
                  o.interactions.previous,
                ],
                [
                  'Redemption rate',
                  percent(o.redemptionRate.current),
                  percent(o.redemptionRate.previous),
                ],
                ['New customers', o.customers.new, o.customers.previousNew],
                [
                  'Active customers',
                  o.customers.active,
                  o.customers.previousActive,
                ],
              ],
            },
            {
              title: 'Daily revenue',
              columns: [
                'Date',
                'Revenue (NGN)',
                'Orders',
                'Visits',
                'Customers',
              ],
              rows: o.series.map((d) => [
                d.date,
                d.revenue,
                d.orders,
                d.visits,
                d.customers,
              ]),
            },
            {
              title: 'Top items',
              columns: ['Item', 'Quantity', 'Revenue (NGN)', 'From deals'],
              rows: o.topItems.map((i) => [
                i.name,
                i.quantity,
                i.revenue,
                percent(i.dealShare),
              ]),
            },
          ],
        };
      }
      case 'customers': {
        const c = await this.analytics.getCustomers(businessId, query);
        return {
          module,
          title,
          tables: [
            {
              title: 'Summary',
              columns: ['Metric', 'This period', 'Previous period'],
              rows: [
                ['Total customers', c.total.current, c.total.previous],
                ['Active customers', c.active.current, c.active.previous],
                ['New customers', c.new.current, c.new.previous],
                ['Dormant (90d+)', c.dormant.current, c.dormant.previous],
                [
                  'Repeat rate',
                  percent(c.repeatRate.current),
                  percent(c.repeatRate.previous),
                ],
                ['Average spend (NGN)', c.averageSpend, ''],
              ],
            },
            {
              title: 'Weekly growth',
              columns: ['Week starting', 'New', 'Returning'],
              rows: c.growth.map((g) => [g.weekStart, g.new, g.returning]),
            },
            {
              title: 'Top customers',
              columns: ['Customer', 'Visits', 'Spend (NGN)', 'Tier'],
              rows: c.topCustomers.map((t) => [
                t.name,
                t.visits,
                t.spend,
                t.tier,
              ]),
            },
          ],
        };
      }
      case 'deals': {
        const d = await this.analytics.getDeals(businessId, query);
        return {
          module,
          title,
          tables: [
            {
              title: 'Deals',
              columns: [
                'Deal',
                'Live',
                'Views',
                'Saves',
                'Claims',
                'Redeemed',
                'Claim rate',
                'Revenue (NGN)',
              ],
              rows: d.deals.map((deal) => [
                deal.name,
                deal.live ? 'Yes' : 'No',
                deal.views,
                deal.saves,
                deal.claims,
                deal.redeemed,
                percent(deal.claimRate),
                deal.revenue,
              ]),
            },
          ],
        };
      }
      case 'locations': {
        const l = await this.analytics.getLocations(businessId, query);
        return {
          module,
          title,
          tables: [
            {
              title: 'Branches',
              columns: [
                'Branch',
                'Revenue (NGN)',
                'Previous (NGN)',
                'Orders',
                'Average order (NGN)',
                'Visits',
                'Claims',
                'Rating',
              ],
              rows: l.branches.map((b) => [
                b.name,
                b.revenue.current,
                b.revenue.previous,
                b.orders.current,
                b.averageOrderValue,
                b.visits,
                b.claims,
                b.rating ?? '',
              ]),
            },
          ],
        };
      }
      case 'pos': {
        const p = await this.analytics.getPos(businessId, query);
        return {
          module,
          title,
          tables: [
            {
              title: 'Summary',
              columns: ['Metric', 'Value'],
              rows: [
                ['POS sales (NGN)', p.sales.current],
                ['Tickets', p.tickets.current],
                ['Average ticket (NGN)', p.averageTicket.current],
                ['Items sold', p.itemsSold],
                ['Refunds', p.refunds.count],
                ['Drawer variance (NGN)', p.drawer.variance],
              ],
            },
            {
              title: 'Tenders',
              columns: ['Method', 'Transactions', 'Amount (NGN)', 'Share'],
              rows: p.tenders.map((t) => [
                t.method,
                t.count,
                t.amount,
                percent(t.share),
              ]),
            },
            {
              title: 'Cashiers',
              columns: ['Cashier', 'Till', 'Tickets', 'Sales (NGN)'],
              rows: p.cashiers.map((c) => [
                c.name,
                c.tillName ?? '',
                c.tickets,
                c.sales,
              ]),
            },
          ],
        };
      }
      case 'audit': {
        const rows = await this.analytics.getOverrides(businessId, range);
        return {
          module,
          title,
          tables: [
            {
              title: 'Overrides',
              columns: [
                'When',
                'Action',
                'Supervisor',
                'Requested by',
                'Branch',
                'Reason',
              ],
              rows: rows.map((r) => [
                new Date(r.createdAt).toISOString(),
                r.action,
                r.supervisor,
                r.requestedBy,
                r.branchName,
                r.reason,
              ]),
            },
          ],
        };
      }
    }
  }

  toCsv(
    businessName: string,
    range: { from: string; to: string },
    sections: ReportSection[],
  ): string {
    const lines: string[] = [
      csvCell(`${businessName} — analytics report`),
      `${csvCell('Period')},${csvCell(range.from)},${csvCell(range.to)}`,
    ];
    for (const section of sections) {
      for (const table of section.tables) {
        lines.push('');
        lines.push(csvCell(`${section.title} — ${table.title}`));
        lines.push(table.columns.map(csvCell).join(','));
        for (const row of table.rows) {
          lines.push(row.map(csvCell).join(','));
        }
      }
    }
    return `${lines.join('\r\n')}\r\n`;
  }

  private toPdf(
    businessName: string,
    range: { from: string; to: string },
    sections: ReportSection[],
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(18).text(`${businessName}`, { continued: false });
      doc
        .fontSize(11)
        .fillColor('#555555')
        .text(
          `Analytics report · ${range.from.slice(0, 10)} to ${range.to.slice(0, 10)}`,
        );
      doc.fillColor('#000000');

      const width = doc.page.width - 80;
      for (const section of sections) {
        doc.moveDown(1.2);
        doc.fontSize(14).text(section.title);
        for (const table of section.tables) {
          doc.moveDown(0.5);
          doc.fontSize(11).fillColor('#333333').text(table.title);
          doc.fillColor('#000000');
          const colWidth = width / table.columns.length;
          const drawRow = (cells: Cell[], bold: boolean) => {
            if (doc.y > doc.page.height - 60) doc.addPage();
            const y = doc.y;
            doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.5);
            cells.forEach((cell, index) => {
              doc.text(
                cell == null ? '' : String(cell),
                40 + index * colWidth,
                y,
                {
                  width: colWidth - 4,
                  ellipsis: true,
                  lineBreak: false,
                },
              );
            });
            doc.x = 40;
            doc.y = y + 13;
          };
          drawRow(table.columns, true);
          if (!table.rows.length) {
            drawRow(['No data for this period'], false);
          }
          for (const row of table.rows) drawRow(row, false);
        }
      }
      doc
        .moveDown(1)
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#777777')
        .text(`Generated ${new Date().toISOString()}`);
      doc.end();
    });
  }
}
