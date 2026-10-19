import {
  BusinessAnalyticsExportService,
  csvCell,
} from './business-analytics-export.service';

describe('csvCell', () => {
  it('quotes separators, quotes and newlines', () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('two\nlines')).toBe('"two\nlines"');
  });

  it('neutralises spreadsheet formulas in text but keeps numbers', () => {
    expect(csvCell('=SUM(A1)')).toBe("'=SUM(A1)");
    expect(csvCell('@cmd')).toBe("'@cmd");
    expect(csvCell(-200)).toBe('-200');
  });

  it('renders empty values as empty cells', () => {
    expect(csvCell(null)).toBe('');
    expect(csvCell(undefined)).toBe('');
  });
});

describe('BusinessAnalyticsExportService', () => {
  const range = {
    from: '2026-10-01T00:00:00.000Z',
    to: '2026-10-11T00:00:00.000Z',
  };
  const analytics = {
    resolveRange: jest.fn().mockResolvedValue({
      ...range,
      previousFrom: '2026-09-21T00:00:00.000Z',
      previousTo: range.from,
      days: 10,
      branchId: null,
    }),
    getDeals: jest.fn().mockResolvedValue({
      deals: [
        {
          name: 'Lunch, combo',
          live: true,
          views: 100,
          saves: 4,
          claims: 10,
          redeemed: 5,
          claimRate: 0.1,
          revenue: 5000,
        },
      ],
    }),
    getOverrides: jest.fn().mockResolvedValue([]),
  };
  const dataSource = {
    query: jest.fn().mockResolvedValue([{ name: 'Urban Grill' }]),
  };
  const service = new BusinessAnalyticsExportService(
    analytics as any,
    dataSource as any,
  );

  it('builds a CSV of the chosen sections with a dated file name', async () => {
    const file = await service.export('biz', {
      format: 'csv',
      modules: ['deals', 'audit'],
    });
    const text = Buffer.from(file.contentBase64, 'base64').toString('utf8');

    expect(file.filename).toBe(
      'urban-grill-analytics-2026-10-01_2026-10-11.csv',
    );
    expect(file.mimeType).toBe('text/csv');
    expect(file.records).toBe(1);
    expect(file.modules).toEqual(['deals', 'audit']);
    expect(text).toContain('"Lunch, combo",Yes,100,4,10,5,10%,5000');
    expect(text).toContain('Supervisor overrides (audit log) — Overrides');
    expect(analytics.getOverrides).toHaveBeenCalledWith(
      'biz',
      expect.objectContaining(range),
    );
  });

  it('builds a PDF', async () => {
    const file = await service.export('biz', {
      format: 'pdf',
      modules: ['deals'],
    });
    const bytes = Buffer.from(file.contentBase64, 'base64');
    expect(file.mimeType).toBe('application/pdf');
    expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
    expect(file.sizeBytes).toBe(bytes.length);
  });
});
