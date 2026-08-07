import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FOS_ENVELOPE_KEY } from '../decorators/fos-envelope.decorator';

/**
 * Opt-in response envelope interceptor for FOS endpoints.
 *
 * When the controller/route is marked with @FosEnvelope(), the handler result
 * is wrapped as `{ success: true, data: <payload> }`. Handlers that already
 * return an enveloped object (e.g. `{ success: true, data }`) are left
 * untouched, and void/undefined results are passed through so 204 semantics
 * are preserved.
 */
@Injectable()
export class FosEnvelopeInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const enabled =
      this.reflector.getAllAndOverride<boolean>(FOS_ENVELOPE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false;

    return next.handle().pipe(
      map((data: unknown) => {
        if (!enabled || data === undefined || data === null) {
          return data;
        }
        if (typeof data === 'object' && 'success' in data && 'data' in data) {
          return data;
        }
        return { success: true, data };
      }),
    );
  }
}
