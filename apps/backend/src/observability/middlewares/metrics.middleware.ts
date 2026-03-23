import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as client from 'prom-client';

// Prometheus Metrics Setup
const registry = new client.Registry();

// Default metrics (CPU, RAM, Node.js internals) are not needed per constraints
// "No unnecessary dependencies. Track ONLY: http_requests_total, http_request_duration_seconds, http_errors_total"
// But it is common to collect default metrics, we will skip based on "Track ONLY..." strict instruction.

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  // Efficient buckets for web applications
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

export const httpErrorsTotal = new client.Counter({
  name: 'http_errors_total',
  help: 'Total number of HTTP errors',
  labelNames: ['method', 'route', 'status_code'],
});

// Register metrics
registry.registerMetric(httpRequestsTotal);
registry.registerMetric(httpRequestDurationSeconds);
registry.registerMetric(httpErrorsTotal);

export { registry };

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Ignore metrics endpoint
    if (req.path === '/metrics') {
      return next();
    }

    const endTimer = httpRequestDurationSeconds.startTimer();
    const method = req.method;
    // We try to use a normalized route, fallback to baseUrl or path
    // NestJS doesn't expose the matched route pattern easily in middleware
    const route = req.baseUrl || req.path;

    res.on('finish', () => {
      const statusCode = res.statusCode.toString();

      // We use base route here to prevent high cardinality.
      // If we use req.path it would record /users/1, /users/2 as separate metrics.
      // A better way is to do this in an interceptor after the route is matched,
      // but the instructions ask for a `MetricsMiddleware`.

      const labels = {
        method,
        route: this.normalizeRoute(req.path),
        status_code: statusCode,
      };

      // Record duration
      endTimer(labels);

      // Increment request counter
      httpRequestsTotal.labels(labels).inc();

      // Increment error counter if applicable (status >= 400)
      if (res.statusCode >= 400) {
        httpErrorsTotal.labels(labels).inc();
      }
    });

    next();
  }

  // Very simple normalizer to avoid high cardinality metrics
  // e.g., /api/v1/users/123 -> /api/v1/users/:id
  private normalizeRoute(path: string): string {
    // Replace UUIDs
    let normalized = path.replace(
      /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g,
      ':id',
    );

    // Replace numeric IDs
    normalized = normalized.replace(/\/\d+/g, '/:id');

    return normalized;
  }
}
