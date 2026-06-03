import { Test, TestingModule } from '@nestjs/testing';
import { ObservabilityStoreService, ObservabilityRequestLog } from './observability-store.service';
import { take } from 'rxjs/operators';

describe('ObservabilityStoreService', () => {
  let service: ObservabilityStoreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ObservabilityStoreService],
    }).compile();

    service = module.get<ObservabilityStoreService>(ObservabilityStoreService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addLog', () => {
    it('should add a log and emit it to the stream', async () => {
      const mockLog: ObservabilityRequestLog = {
        id: 'req_1',
        timestamp: new Date().toISOString(),
        method: 'GET',
        url: '/api/v1/users',
        route: '/users',
        statusCode: 200,
        responseTime: 45,
      };

      // Subscribe to the stream first
      const promise = service.getLogStream().pipe(take(1)).toPromise();

      service.addLog(mockLog);

      const emittedLog = await promise;
      expect(emittedLog).toEqual(mockLog);

      const logs = service.getLogs({ limit: 10 });
      expect(logs.items.length).toBe(1);
      expect(logs.items[0]).toEqual(mockLog);
      expect(logs.total).toBe(1);
    });

    it('should maintain a size cap of 200 items (configurable via LOG_STORE_MAX_SIZE)', () => {
      const generateLog = (id: string): ObservabilityRequestLog => ({
        id,
        timestamp: new Date().toISOString(),
        method: 'POST',
        url: '/api/v1/data',
        route: '/data',
        statusCode: 201,
        responseTime: 10,
      });

      // Push 205 logs — 5 over the default MAX_SIZE of 200
      for (let i = 1; i <= 205; i++) {
        service.addLog(generateLog(`req_${i}`));
      }

      const logs = service.getLogs({ limit: 200 });
      expect(logs.total).toBe(200);
      expect(logs.items.length).toBe(200);

      // The oldest 5 logs (req_1 to req_5) should have been evicted.
      // Since it returns them newest-first, the last item should be req_6.
      expect(logs.items[logs.items.length - 1].id).toBe('req_6');

      // The first item (newest) should be req_205.
      expect(logs.items[0].id).toBe('req_205');
    });
  });

  describe('clearLogs', () => {
    it('should flush all in-memory logs', () => {
      service.addLog({
        id: 'req_1',
        timestamp: new Date().toISOString(),
        method: 'GET',
        url: '/url',
        route: '/route',
        statusCode: 200,
        responseTime: 12,
      });

      expect(service.getLogs({}).total).toBe(1);
      service.clearLogs();
      expect(service.getLogs({}).total).toBe(0);
    });
  });

  describe('getLogs (Filtering)', () => {
    beforeEach(() => {
      // Setup mock logs with different properties for filters
      const logsToSeed: ObservabilityRequestLog[] = [
        {
          id: 'req_1',
          timestamp: new Date(Date.now() - 3000).toISOString(),
          method: 'GET',
          url: '/api/v1/users',
          route: '/users',
          statusCode: 200,
          responseTime: 50,
          userId: 'usr_abc',
          userEmail: 'abc@example.com',
        },
        {
          id: 'req_2',
          timestamp: new Date(Date.now() - 2000).toISOString(),
          method: 'POST',
          url: '/api/v1/payments',
          route: '/payments',
          statusCode: 201,
          responseTime: 600, // Slow
        },
        {
          id: 'req_3',
          timestamp: new Date(Date.now() - 1000).toISOString(),
          method: 'GET',
          url: '/api/v1/auth/login',
          route: '/auth/login',
          statusCode: 401, // Error status class 4xx
          responseTime: 120,
          error: { message: 'Unauthorized credentials' },
        },
        {
          id: 'req_4',
          timestamp: new Date().toISOString(),
          method: 'PUT',
          url: '/api/v1/admin/health',
          route: '/admin/health',
          statusCode: 500, // Error status class 5xx
          responseTime: 1800, // Critical slow
          error: { message: 'DB connection failure', stack: 'Stack...' },
        },
      ];

      for (const log of logsToSeed) {
        service.addLog(log);
      }
    });

    it('should return logs in descending chronological order (newest first)', () => {
      const logs = service.getLogs({});
      expect(logs.items[0].id).toBe('req_4');
      expect(logs.items[1].id).toBe('req_3');
      expect(logs.items[2].id).toBe('req_2');
      expect(logs.items[3].id).toBe('req_1');
    });

    it('should filter by search query', () => {
      // Search email
      let result = service.getLogs({ search: 'abc@example.com' });
      expect(result.total).toBe(1);
      expect(result.items[0].id).toBe('req_1');

      // Search endpoint url
      result = service.getLogs({ search: 'payments' });
      expect(result.total).toBe(1);
      expect(result.items[0].id).toBe('req_2');

      // Search error message
      result = service.getLogs({ search: 'credentials' });
      expect(result.total).toBe(1);
      expect(result.items[0].id).toBe('req_3');
    });

    it('should filter by HTTP method', () => {
      const result = service.getLogs({ method: 'POST' });
      expect(result.total).toBe(1);
      expect(result.items[0].id).toBe('req_2');
    });

    it('should filter by status class', () => {
      // 5xx filter
      let result = service.getLogs({ statusClass: '5xx' });
      expect(result.total).toBe(1);
      expect(result.items[0].statusCode).toBe(500);

      // 4xx filter
      result = service.getLogs({ statusClass: '4xx' });
      expect(result.total).toBe(1);
      expect(result.items[0].statusCode).toBe(401);

      // 2xx filter
      result = service.getLogs({ statusClass: '2xx' });
      expect(result.total).toBe(2);
    });

    it('should filter by minimum latency', () => {
      const result = service.getLogs({ minLatency: 500 });
      expect(result.total).toBe(2); // 600ms and 1800ms
      expect(result.items[0].id).toBe('req_4');
      expect(result.items[1].id).toBe('req_2');
    });
  });

  describe('getStats', () => {
    it('should return empty stats structure when there are no logs', () => {
      const stats = service.getStats();
      expect(stats.totalRequests).toBe(0);
      expect(stats.averageLatency).toBe(0);
      expect(stats.p95Latency).toBe(0);
      expect(stats.errorRate).toBe(0);
      expect(stats.slowRequestsCount).toBe(0);
    });

    it('should aggregate statistics correctly', () => {
      const logsToSeed: ObservabilityRequestLog[] = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          method: 'GET',
          url: '/url',
          route: '/route',
          statusCode: 200,
          responseTime: 10,
        },
        {
          id: '2',
          timestamp: new Date().toISOString(),
          method: 'POST',
          url: '/url',
          route: '/route',
          statusCode: 201,
          responseTime: 50,
        },
        {
          id: '3',
          timestamp: new Date().toISOString(),
          method: 'GET',
          url: '/url',
          route: '/route',
          statusCode: 400, // 4xx error
          responseTime: 550, // slow (>500ms)
        },
        {
          id: '4',
          timestamp: new Date().toISOString(),
          method: 'GET',
          url: '/url',
          route: '/route',
          statusCode: 500, // 5xx error
          responseTime: 190,
        },
      ];

      for (const log of logsToSeed) {
        service.addLog(log);
      }

      const stats = service.getStats();

      expect(stats.totalRequests).toBe(4);
      // Average latency: (10 + 50 + 550 + 190) / 4 = 800 / 4 = 200ms
      expect(stats.averageLatency).toBe(200);
      // Slow requests count (>500ms): only id '3' (550ms) -> 1
      expect(stats.slowRequestsCount).toBe(1);
      // Error rate: 2 error logs out of 4 -> 50%
      expect(stats.errorRate).toBe(50.0);
      // Method distribution: 3 GET, 1 POST
      expect(stats.methodDistribution).toEqual({ GET: 3, POST: 1 });
      // Status code distribution: 2xx: 2 (200, 201), 4xx: 1 (400), 5xx: 1 (500)
      expect(stats.statusCodeDistribution).toEqual({ '2xx': 2, '4xx': 1, '5xx': 1 });
      // P95 latency: sorted latencies are [10, 50, 190, 550]. Index of 95% is Math.floor(4 * 0.95) = 3. Latency at index 3 is 550ms
      expect(stats.p95Latency).toBe(550);
      // Recent volume chart should have compiled up to 10 intervals
      expect(stats.recentVolumeChart.length).toBeGreaterThan(0);
    });
  });
});
