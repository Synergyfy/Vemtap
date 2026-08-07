import { ValueTransformer } from 'typeorm';

/**
 * TypeORM ValueTransformer that converts Postgres numeric/decimal values
 * (returned as strings by pg) into plain JS numbers on read, so API
 * responses always serialise monetary amounts as numbers (NGN, minor-unit
 * free) rather than strings. Write path passes the value through unchanged.
 */
export const numericTransformer: ValueTransformer = {
  to: (value: unknown): unknown => value,
  from: (value: unknown): unknown => {
    if (value === null || value === undefined) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? value : parsed;
    }
    return value;
  },
};
