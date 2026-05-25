import { NodeSDK } from '@opentelemetry/sdk-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import {
  ConsoleSpanExporter,
  BatchSpanProcessor,
  NoopSpanExporter,
} from '@opentelemetry/sdk-trace-node';

const isProduction = process.env.NODE_ENV === 'production';
const serviceName = process.env.SERVICE_NAME || 'vemtap-backend';
const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

// Create a resource programmatically
const resource = resourceFromAttributes({
  [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
});

/**
 * Choose an exporter based on environment:
 * - Development: ConsoleSpanExporter (human-readable traces in terminal)
 * - Production with OTLP: would be wired up via OTLPTraceExporter (add separately if needed)
 * - Production without OTLP: NoopSpanExporter — zero CPU/IO cost
 *
 * BatchSpanProcessor is always used instead of SimpleSpanProcessor.
 * SimpleSpanProcessor exports synchronously on every span end (blocks event loop).
 * BatchSpanProcessor queues spans and flushes asynchronously in configurable batches.
 */
function buildSpanProcessor() {
  if (!isProduction) {
    return new BatchSpanProcessor(new ConsoleSpanExporter(), {
      // Flush every 5 seconds or when 100 spans accumulate — keeps dev console readable
      scheduledDelayMillis: 5000,
      maxExportBatchSize: 100,
    });
  }

  if (otlpEndpoint) {
    // OTLP exporter would be configured here when needed.
    // For now fall through to no-op so the binary doesn't require @opentelemetry/exporter-trace-otlp-http
    console.log(`[Tracing] OTLP endpoint detected: ${otlpEndpoint} — wire up OTLPTraceExporter to activate.`);
  }

  // Production without a real backend: complete no-op — zero overhead
  return new BatchSpanProcessor(new NoopSpanExporter());
}

const sdk = new NodeSDK({
  resource,
  spanProcessors: [buildSpanProcessor()],
  instrumentations: [
    new HttpInstrumentation({
      // Ignore the /metrics endpoint to prevent tracing noise from Prometheus scrapes
      ignoreIncomingRequestHook: (req) => {
        return req.url === '/metrics' || req.url === '/api/v1/metrics';
      },
    }),
  ],
});

export function initializeTracing() {
  sdk.start();
  const mode = isProduction ? (otlpEndpoint ? 'otlp-ready' : 'no-op') : 'console (batch)';
  console.log(`[Tracing] OpenTelemetry initialized — service: ${serviceName}, exporter: ${mode}`);
}

process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => console.log('[Tracing] Terminated'))
    .catch((error) => console.log('[Tracing] Error during shutdown', error))
    .finally(() => process.exit(0));
});
