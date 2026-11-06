import { NotFoundException } from '@nestjs/common';
import { BusinessQrService } from './business-qr.service';

describe('BusinessQrService', () => {
  const range = {
    from: '2026-10-01T00:00:00.000Z',
    to: '2026-10-08T00:00:00.000Z',
    previousFrom: '2026-09-24T00:00:00.000Z',
    previousTo: '2026-10-01T00:00:00.000Z',
    days: 7,
    branchId: null,
  };
  const query = jest.fn();
  const analytics = { resolveRange: jest.fn().mockResolvedValue(range) };
  const config = { get: jest.fn().mockReturnValue('https://vemtap.com/') };
  const service = new BusinessQrService(
    { query } as any,
    analytics as any,
    config as any,
  );

  beforeEach(() => query.mockReset());

  it('builds business, branch and device links on the app domain', () => {
    expect(service.businessUrl('ABC 1')).toBe('https://vemtap.com/b/ABC%201');
    expect(
      service.deviceUrl({ username: 'wuse', uniqueCode: 'BR1' }, 'DEV9'),
    ).toBe('https://vemtap.com/wuse/DEV9');
    // No username: the device falls back to its branch page.
    expect(
      service.deviceUrl({ username: null, uniqueCode: 'BR1' }, 'DEV9'),
    ).toBe('https://vemtap.com/b/BR1');
  });

  it('renders a real SVG QR code for a link', async () => {
    const art = await service.art('https://vemtap.com/b/ABC');
    expect(art.url).toBe('https://vemtap.com/b/ABC');
    expect(art.svg.startsWith('<svg')).toBe(true);
    expect(art.svg).toContain('<path');
  });

  it('404s when the business is gone', async () => {
    query.mockResolvedValueOnce([]);
    await expect(service.getSummary('biz', {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('shapes stats, branches and points from grouped rows', async () => {
    const recent = new Date().toISOString();
    query.mockImplementation((sql: string) => {
      if (sql.includes('FROM "businesses"')) {
        return Promise.resolve([
          { id: 'biz', name: 'Urban Grill', uniqueCode: 'BIZ1', logoUrl: null },
        ]);
      }
      if (sql.includes('AS claimers')) {
        return Promise.resolve([
          {
            scans: 10,
            previousScans: 4,
            newCustomers: 3,
            previousNewCustomers: 1,
            scanners: 8,
            claimers: 2,
          },
        ]);
      }
      if (sql.includes('FROM "branches" b')) {
        return Promise.resolve([
          {
            id: 'b1',
            name: 'Wuse',
            address: null,
            uniqueCode: 'BR1',
            username: 'wuse',
            isMainBranch: true,
            isActive: true,
            scans: 10,
            previousScans: 4,
          },
        ]);
      }
      if (sql.includes('FROM "devices" d')) {
        return Promise.resolve([
          {
            id: 'd1',
            name: 'Till 01',
            code: 'DEV1',
            type: 'Card',
            status: 'active',
            location: 'Counter',
            totalScans: 40,
            lastActive: recent,
            branchId: 'b1',
            scans: 6,
            weekScans: 2,
          },
          {
            id: 'd2',
            name: 'Door',
            code: 'DEV2',
            type: 'Stand',
            status: 'inactive',
            location: null,
            totalScans: 1,
            lastActive: null,
            branchId: 'b1',
            scans: 0,
            weekScans: 0,
          },
        ]);
      }
      return Promise.resolve([]);
    });

    const summary = await service.getSummary('biz', {});

    expect(summary.business.qr.url).toBe('https://vemtap.com/b/BIZ1');
    expect(summary.stats).toEqual({
      scans: { current: 10, previous: 4 },
      newCustomers: { current: 3, previous: 1 },
      claimRate: 0.25,
    });
    expect(summary.branches[0].qr.url).toBe('https://vemtap.com/b/BR1');
    expect(summary.points.map((p) => [p.id, p.live, p.qr.url])).toEqual([
      ['d1', true, 'https://vemtap.com/wuse/DEV1'],
      ['d2', false, 'https://vemtap.com/wuse/DEV2'],
    ]);
    expect(summary.totals).toEqual({
      branches: 1,
      points: 2,
      activePoints: 1,
      livePoints: 1,
      weekScans: 2,
    });
  });
});
