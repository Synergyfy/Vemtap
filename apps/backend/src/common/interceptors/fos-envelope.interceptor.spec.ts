import { of } from 'rxjs';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FosEnvelopeInterceptor } from './fos-envelope.interceptor';
import { FOS_ENVELOPE_KEY } from '../decorators/fos-envelope.decorator';

describe('FosEnvelopeInterceptor', () => {
  let interceptor: FosEnvelopeInterceptor;
  const reflector = new Reflector();

  const makeContext = (): ExecutionContext =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    interceptor = new FosEnvelopeInterceptor(reflector);
    jest.spyOn(reflector, 'getAllAndOverride');
  });

  afterEach(() => jest.clearAllMocks());

  it('should not wrap when metadata is absent', (done) => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const next = { handle: () => of({ foo: 'bar' }) };
    interceptor.intercept(makeContext(), next).subscribe((result) => {
      expect(result).toEqual({ foo: 'bar' });
      done();
    });
  });

  it('should wrap when metadata is enabled', (done) => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const next = { handle: () => of({ foo: 'bar' }) };
    interceptor.intercept(makeContext(), next).subscribe((result) => {
      expect(result).toEqual({ success: true, data: { foo: 'bar' } });
      done();
    });
  });

  it('should skip wrapping already-enveloped responses', (done) => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const next = { handle: () => of({ success: true, data: { a: 1 } }) };
    interceptor.intercept(makeContext(), next).subscribe((result) => {
      expect(result).toEqual({ success: true, data: { a: 1 } });
      done();
    });
  });

  it('should pass through undefined results (204 semantics)', (done) => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const next = { handle: () => of(undefined) };
    interceptor.intercept(makeContext(), next).subscribe((result) => {
      expect(result).toBeUndefined();
      done();
    });
  });

  it('should use the expected metadata key', () => {
    expect(FOS_ENVELOPE_KEY).toBe('fos_envelope');
  });
});
