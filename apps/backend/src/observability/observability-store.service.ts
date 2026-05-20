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
  requestHeaders?: Record<string, any>;
  queryParams?: Record<string, any>;
  requestBody?: any;
  responseHeaders?: Record<string, any>;
  responseBody?: any;
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

@Injectable()
export class ObservabilityStoreService {
  private readonly MAX_SIZE = 500;
  private logs: ObservabilityRequestLog[] = [];
  private readonly logStream$ = new Subject<ObservabilityRequestLog>();

  /**
   * Adds a request log to the in-memory circular queue.
   */
  addLog(log: ObservabilityRequestLog): void {
    this.logs.push(log);
    
    // Maintain fixed size to avoid memory growth
    if (this.logs.length > this.MAX_SIZE) {
      this.logs.shift();
    }

    // Emit live to stream subscribers
    this.logStream$.next(log);
  }

  /**
   * Returns a real-time hot observable stream of logs.
   */
  getLogStream(): Observable<ObservabilityRequestLog> {
    return this.logStream$.asObservable();
  }

  /**
   * Clears all in-memory logs.
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Retrieves paginated logs with dynamic filtering.
   */
  getLogs(filters: LogFilters) {
    let filtered = [...this.logs];

    // Filter by search query (URL, request ID, trace ID, user email, or ID)
    if (filters.search) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.url.toLowerCase().includes(query) ||
          log.id.toLowerCase().includes(query) ||
          (log.traceId && log.traceId.toLowerCase().includes(query)) ||
          (log.userEmail && log.userEmail.toLowerCase().includes(query)) ||
          (log.userId && log.userId.toLowerCase().includes(query)) ||
          (log.error?.message && log.error.message.toLowerCase().includes(query)),
      );
    }

    // Filter by HTTP Method
    if (filters.method && filters.method !== 'ALL') {
      const meth = filters.method.toUpperCase();
      filtered = filtered.filter((log) => log.method === meth);
    }

    // Filter by Status Class (2xx, 3xx, 4xx, 5xx)
    if (filters.statusClass && filters.statusClass !== 'ALL') {
      const cls = filters.statusClass.substring(0, 1); // Get '2', '3', '4', '5'
      filtered = filtered.filter(
        (log) => Math.floor(log.statusCode / 100).toString() === cls,
      );
    }

    // Filter by Minimum Latency (speed)
    if (filters.minLatency && filters.minLatency > 0) {
      const minLatency = filters.minLatency;
      filtered = filtered.filter((log) => log.responseTime >= minLatency);
    }

    // We want newest logs first in dashboard list
    filtered.reverse();

    const total = filtered.length;
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    const items = filtered.slice(offset, offset + limit);

    return {
      items,
      total,
      limit,
      offset,
    };
  }

  /**
   * Calculates live statistical KPIs and analytics out of current logs.
   */
  getStats() {
    const totalRequests = this.logs.length;
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

    let totalLatency = 0;
    let errorCount = 0;
    let slowRequestsCount = 0;
    const methodMap: Record<string, number> = {};
    const statusMap: Record<string, number> = {};
    const latencies: number[] = [];

    // Aggregate statistics
    for (const log of this.logs) {
      totalLatency += log.responseTime;
      latencies.push(log.responseTime);

      // Error check (4xx and 5xx)
      if (log.statusCode >= 400) {
        errorCount++;
      }

      // Slow request threshold > 500ms
      if (log.responseTime >= 500) {
        slowRequestsCount++;
      }

      // Method distribution
      methodMap[log.method] = (methodMap[log.method] || 0) + 1;

      // Status distribution
      const statusClass = `${Math.floor(log.statusCode / 100)}xx`;
      statusMap[statusClass] = (statusMap[statusClass] || 0) + 1;
    }

    // Sort latencies to calculate percentiles
    latencies.sort((a, b) => a - b);
    const p95Idx = Math.floor(latencies.length * 0.95);
    const p95Latency = latencies[p95Idx] || 0;
    const averageLatency = Math.round(totalLatency / totalRequests);
    const errorRate = parseFloat(((errorCount / totalRequests) * 100).toFixed(2));

    // Create a 10-bucket timeline of the recent activity (grouped by last 10 intervals)
    // To make it look gorgeous, we group logs by the last 10 seconds or minutes
    // In our case, simple sliding log chunks do the trick for visual telemetry
    const bucketSize = Math.max(1, Math.ceil(this.logs.length / 10));
    const recentVolumeChart: Array<{
      time: string;
      success: number;
      errors: number;
      latency: number;
    }> = [];
    
    for (let i = 0; i < this.logs.length; i += bucketSize) {
      const chunk = this.logs.slice(i, i + bucketSize);
      if (chunk.length === 0) continue;
      
      const chunkErrors = chunk.filter((l) => l.statusCode >= 400).length;
      const chunkSuccess = chunk.length - chunkErrors;
      const chunkAvgLatency = Math.round(
        chunk.reduce((sum, l) => sum + l.responseTime, 0) / chunk.length,
      );

      // Label with timestamp of the first item in the chunk
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
      slowRequestsCount,
      methodDistribution: methodMap,
      statusCodeDistribution: statusMap,
      recentVolumeChart,
    };
  }
}
