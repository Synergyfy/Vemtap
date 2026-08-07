import { numericTransformer } from './numeric.transformer';

describe('numericTransformer', () => {
  it('should convert numeric strings to numbers on read', () => {
    expect(numericTransformer.from('45000.00')).toBe(45000);
    expect(numericTransformer.from('0')).toBe(0);
  });

  it('should pass through non-string values', () => {
    expect(numericTransformer.from(45000)).toBe(45000);
    expect(numericTransformer.from(null)).toBeNull();
    expect(numericTransformer.from(undefined)).toBeUndefined();
  });

  it('should return the original string when not numeric', () => {
    expect(numericTransformer.from('abc')).toBe('abc');
  });

  it('should pass the value through unchanged on write', () => {
    expect(numericTransformer.to(45000)).toBe(45000);
  });
});
