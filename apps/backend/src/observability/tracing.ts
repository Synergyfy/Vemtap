import { NodeSDK } from '@opentelemetry/sdk-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import {
  ConsoleSpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-node';

const isProduction = process.env.NODE_ENV === 'production';
const serviceName = process.env.SERVICE_NAME || 'vemtap-backend';

// Create a resource programmatically
const resource = resourceFromAttributes({
  [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
});

const sdk = new NodeSDK({
  resource,
  // Default tracing export configuration.
  // It exports traces to console. Can be replaced by OTLP exporter for Jaeger/Tempo/Datadog.
  spanProcessors: [new SimpleSpanProcessor(new ConsoleSpanExporter())],
  instrumentations: [
    new HttpInstrumentation({
      // We ignore the /metrics endpoint to prevent tracing noise from Prometheus scrapes
      ignoreIncomingRequestHook: (req) => {
        return req.url === '/metrics' || req.url === '/api/v1/metrics';
      },
    }),
  ],
});

export function initializeTracing() {
  sdk.start();
  console.log(`OpenTelemetry tracing initialized for service: ${serviceName}`);
}

process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});
