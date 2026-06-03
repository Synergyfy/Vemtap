import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';

export interface ObservabilityRequestLog {
  id: string;
  traceId?: string;
  timestamp: string;
  method: string;
  url: string;
  route: string;
  statusCode: number;
  responseTime: number;
  ip?: string;
  userAgent?: string;
  userId?: string;
  userEmail?: string;
  /** Only safe, non-sensitive headers (content-type, x-forwarded-for, origin). */
  requestHeaders?: Record<string, string>;
  queryParams?: Record<string, any>;
  /** Truncated preview of the request body (max 512 chars). Never the full payload. */
  requestBody?: string;
  /**
   * responseBody and responseHeaders are intentionally excluded from the in-memory
   * store. Full response payloads are the single largest source of RAM growth.
   * They are still written to structured stdout logs via pino.
   */
  error?: {
    message: string;
    stack?: string;
    name?: string;
  };
}

export interface LogFilters {
  search?: string;
  method?: string;
  statusClass?: string; // 2xx, 3xx, 4xx, 5xx
  minLatency?: number;
  limit?: number;
  offset?: number;
}

// ---------------------------------------------------------------------------
// Running stats accumulators — updated incrementally in addLog() so that
// getStats() is O(1) instead of re-scanning every log on every call.
// ---------------------------------------------------------------------------
interface StatsAccumulators {
  totalLatency: number;
  errorCount: number;
  slowCount: number;
  methodMap: Record<string, number>;
  statusMap: Record<string, number>;
  /**
   * Sorted list of latencies maintained in sorted order via binary-insertion.
   * This lets us compute p95 in O(1) (just index lookup) at the cost of an
   * O(log n) insertion — which is still far cheaper than sorting 500 items on
   * every getStats() call.
   */
  sortedLatencies: number[];
}

/** Binary-search insertion to keep `sortedLatencies` sorted at all times. */
function sortedInsert(arr: number[], value: number): void {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (arr[mid] < value) lo = mid + 1;
    else hi = mid;
  }
  arr.splice(lo, 0, value);
}

/** Remove a single value from the sorted array (O(log n) find + O(n) splice — only on eviction). */
function sortedRemove(arr: number[], value: number): void {
  let lo = 0;
  let hi = arr.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    if (arr[mid] === value) {
      arr.splice(mid, 1);
      return;
    }
    if (arr[mid] < value) lo = mid + 1;
    else hi = mid - 1;
  }
}

@Injectable()
export class ObservabilityStoreService {
  /**
   * Maximum number of request logs held in memory.
   * Lower = less RAM; increase if you need more history in the admin dashboard.
   * Can be overridden via the LOG_STORE_MAX_SIZE env var.
   */
  private readonly MAX_SIZE = parseInt(process.env.LOG_STORE_MAX_SIZE || '200', 10);

  // ---------------------------------------------------------------------------
  // Ring buffer — O(1) enqueue and eviction, no array reindexing (no shift()).
  // ---------------------------------------------------------------------------
  /** Pre-allocated fixed-length slots. */
  private readonly slots: (ObservabilityRequestLog | undefined)[];
  /** Index of the next slot to write into. Wraps around at MAX_SIZE. */
  private head = 0;
  /** How many valid entries currently exist (0 → MAX_SIZE). */
  private count = 0;

  private readonly accumulators: StatsAccumulators = {
    totalLatency: 0,
    errorCount: 0,
    slowCount: 0,
    methodMap: {},
    statusMap: {},
    sortedLatencies: [],
  };

  private readonly logStream$ = new Subject<ObservabilityRequestLog>();

  constructor() {
    this.slots = new Array(this.MAX_SIZE).fill(undefined);
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Adds a request log to the ring buffer in O(1).
   * If the buffer is full the oldest entry is evicted and its contribution
   * to the running accumulators is subtracted before the new entry is added.
   */
  addLog(log: ObservabilityRequestLog): void {
    // Evict the oldest entry if the buffer is full
    if (this.count === this.MAX_SIZE) {
      const evicted = this.slots[this.head]!;
      this.subtractAccumulators(evicted);
    } else {
      this.count++;
    }

    // Write into the ring
    this.slots[this.head] = log;
    this.head = (this.head + 1) % this.MAX_SIZE;

    // Update running accumulators — O(log n) insert into sorted latency array
    this.addAccumulators(log);

    // Emit to live stream subscribers
    this.logStream$.next(log);
  }

  /**
   * Returns a real-time hot observable stream of logs.
   */
  getLogStream(): Observable<ObservabilityRequestLog> {
    return this.logStream$.asObservable();
  }

  /**
   * Clears all in-memory logs and resets accumulators.
   */
  clearLogs(): void {
    this.slots.fill(undefined);
    this.head = 0;
    this.count = 0;
    this.accumulators.totalLatency = 0;
    this.accumulators.errorCount = 0;
    this.accumulators.slowCount = 0;
    this.accumulators.methodMap = {};
    this.accumulators.statusMap = {};
    this.accumulators.sortedLatencies = [];
  }

  /**
   * Retrieves paginated logs with dynamic filtering.
   *
   * Iterates the ring buffer newest-first without copying the entire array,
   * applying filters in a single pass.
   */
  getLogs(filters: LogFilters) {
    const limit = filters.limit ? Math.min(Number(filters.limit), this.MAX_SIZE) : 50;
    const offset = filters.offset ? Number(filters.offset) : 0;

    const search = filters.search?.toLowerCase();
    const method = filters.method && filters.method !== 'ALL' ? filters.method.toUpperCase() : undefined;
    const statusPrefix =
      filters.statusClass && filters.statusClass !== 'ALL'
        ? filters.statusClass.substring(0, 1)
        : undefined;
    const minLatency = filters.minLatency && filters.minLatency > 0 ? filters.minLatency : undefined;

    // Iterate from newest to oldest (ring-buffer reverse order)
    const matched: ObservabilityRequestLog[] = [];

    for (let i = 0; i < this.count; i++) {
      // Walk backwards from (head - 1) wrapping around
      const idx = (this.head - 1 - i + this.MAX_SIZE) % this.MAX_SIZE;
      const log = this.slots[idx];
      if (!log) continue;

      // Apply filters
      if (search) {
        const hit =
          log.url.toLowerCase().includes(search) ||
          log.id.toLowerCase().includes(search) ||
          (log.traceId && log.traceId.toLowerCase().includes(search)) ||
          (log.userEmail && log.userEmail.toLowerCase().includes(search)) ||
          (log.userId && log.userId.toLowerCase().includes(search)) ||
          (log.error?.message && log.error.message.toLowerCase().includes(search));
        if (!hit) continue;
      }
      if (method && log.method !== method) continue;
      if (statusPrefix && Math.floor(log.statusCode / 100).toString() !== statusPrefix) continue;
      if (minLatency && log.responseTime < minLatency) continue;

      matched.push(log);
    }

    const total = matched.length;
    const items = matched.slice(offset, offset + limit);

    return { items, total, limit, offset };
  }

  /**
   * Returns live statistical KPIs from running accumulators — O(1).
   *
   * No array allocation, no sort; all values are maintained incrementally.
   */
  getStats() {
    const totalRequests = this.count;

    if (totalRequests === 0) {
      return {
        totalRequests: 0,
        averageLatency: 0,
        p95Latency: 0,
        errorRate: 0,
        slowRequestsCount: 0,
        methodDistribution: {},
        statusCodeDistribution: {},
        recentVolumeChart: [],
      };
    }

    const { totalLatency, errorCount, slowCount, methodMap, statusMap, sortedLatencies } =
      this.accumulators;

    const averageLatency = Math.round(totalLatency / totalRequests);
    const p95Idx = Math.floor(sortedLatencies.length * 0.95);
    const p95Latency = sortedLatencies[p95Idx] ?? 0;
    const errorRate = parseFloat(((errorCount / totalRequests) * 100).toFixed(2));

    // Build a 10-bucket volume chart from the current ring contents (newest → oldest)
    const bucketSize = Math.max(1, Math.ceil(this.count / 10));
    const recentVolumeChart: Array<{
      time: string;
      success: number;
      errors: number;
      latency: number;
    }> = [];

    // We collect entries in chronological order for the chart (oldest → newest)
    const chronological: ObservabilityRequestLog[] = [];
    for (let i = this.count - 1; i >= 0; i--) {
      const idx = (this.head - 1 - i + this.MAX_SIZE) % this.MAX_SIZE;
      const log = this.slots[idx];
      if (log) chronological.push(log);
    }

    for (let i = 0; i < chronological.length; i += bucketSize) {
      const chunk = chronological.slice(i, i + bucketSize);
      if (chunk.length === 0) continue;

      const chunkErrors = chunk.filter((l) => l.statusCode >= 400).length;
      const chunkSuccess = chunk.length - chunkErrors;
      const chunkAvgLatency = Math.round(
        chunk.reduce((sum, l) => sum + l.responseTime, 0) / chunk.length,
      );

      const timeLabel = new Date(chunk[0].timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      recentVolumeChart.push({
        time: timeLabel,
        success: chunkSuccess,
        errors: chunkErrors,
        latency: chunkAvgLatency,
      });
    }

    return {
      totalRequests,
      averageLatency,
      p95Latency,
      errorRate,
      slowRequestsCount: slowCount,
      methodDistribution: { ...methodMap },
      statusCodeDistribution: { ...statusMap },
      recentVolumeChart,
    };
  }

  // ---------------------------------------------------------------------------
  // Private accumulator helpers
  // ---------------------------------------------------------------------------

  private addAccumulators(log: ObservabilityRequestLog): void {
    const acc = this.accumulators;
    acc.totalLatency += log.responseTime;
    if (log.statusCode >= 400) acc.errorCount++;
    if (log.responseTime >= 500) acc.slowCount++;
    acc.methodMap[log.method] = (acc.methodMap[log.method] || 0) + 1;
    const statusClass = `${Math.floor(log.statusCode / 100)}xx`;
    acc.statusMap[statusClass] = (acc.statusMap[statusClass] || 0) + 1;
    sortedInsert(acc.sortedLatencies, log.responseTime);
  }

  private subtractAccumulators(log: ObservabilityRequestLog): void {
    const acc = this.accumulators;
    acc.totalLatency -= log.responseTime;
    if (log.statusCode >= 400) acc.errorCount--;
    if (log.responseTime >= 500) acc.slowCount--;
    if (acc.methodMap[log.method]) acc.methodMap[log.method]--;
    const statusClass = `${Math.floor(log.statusCode / 100)}xx`;
    if (acc.statusMap[statusClass]) acc.statusMap[statusClass]--;
    sortedRemove(acc.sortedLatencies, log.responseTime);
  }
}
