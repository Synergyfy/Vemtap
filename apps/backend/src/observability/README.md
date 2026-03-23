# Observability Setup

This module implements production-grade, resource-efficient observability for the NestJS backend, optimized for low-resource VPS setups without Docker.

It provides:
1. Structured JSON Logging (Pino)
2. Prometheus-Compatible Metrics (`prom-client`)
3. Lightweight Distributed Tracing (OpenTelemetry Node SDK)

## 1. Prometheus Setup

To scrape metrics from this backend, you can set up Prometheus on your VPS.

Install Prometheus manually (no Docker required) and use this minimal `prometheus.yml` configuration:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'vemtap-backend'
    metrics_path: '/api/v1/metrics'
    static_configs:
      - targets: ['localhost:3002'] # Replace with your actual backend port/host
```

Run Prometheus using:
```bash
./prometheus --config.file=prometheus.yml --web.listen-address=":9090"
```

## 2. Grafana Connection

1. Install Grafana manually on your VPS.
2. Open Grafana in your browser (default `http://localhost:3000`).
3. Go to **Connections > Data Sources > Add data source**.
4. Select **Prometheus**.
5. Set the Prometheus server URL (e.g., `http://localhost:9090`).
6. Click **Save & Test**.

You can now create dashboards using PromQL queries like:
- **Total Requests**: `sum(rate(http_requests_total[5m])) by (method, route, status_code)`
- **Error Rate**: `sum(rate(http_errors_total[5m])) / sum(rate(http_requests_total[5m]))`
- **P95 Latency**: `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route))`

## 3. Distributed Tracing

Tracing is set up via OpenTelemetry Node SDK. Currently, it uses a lightweight `ConsoleSpanExporter` configured in `src/observability/tracing.ts`.

If you decide to set up Jaeger or Grafana Tempo on your VPS in the future, you can simply update `spanProcessors` in `tracing.ts` to use `OTLPTraceExporter`.
