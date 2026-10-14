import { BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type { CatalogueItemVariant } from '../entities/catalogue-item.entity';

const toNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number')
    return Number.isFinite(value) ? value : undefined;
  if (typeof value !== 'string') return undefined;
  // "₦4,500" → 4500, but text with no digits ("free") is not a price of 0.
  const digits = value.replace(/[^0-9.]/g, '');
  if (!/\d/.test(digits)) return undefined;
  const parsed = Number(digits);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toText = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

/**
 * Bring request variants onto the stored shape. Accepts the current
 * `{ id?, name, price, compareAtPrice?, sku?, stockQuantity? }` and the legacy
 * `{ type, value }`, which was used two ways: the mobile wizard sent the label
 * in `type` and a price in `value`; seeds sent an attribute in `type` and the
 * option label in `value` (`{ type: 'size', value: 'Large' }`). A numeric
 * `value` is therefore a price, anything else is the variant's name at
 * `fallbackPrice`.
 *
 * Returns `undefined` when the request did not touch variants, so an update
 * without them leaves the stored list alone.
 */
export function normalizeVariants(
  raw: Record<string, unknown>[] | null | undefined,
  fallbackPrice?: number | null,
): CatalogueItemVariant[] | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === null) return null;

  return raw.map((entry, index) => {
    const legacy = entry.name === undefined && entry.type !== undefined;
    const legacyValueIsPrice =
      legacy &&
      typeof entry.value !== 'boolean' &&
      (typeof entry.value === 'number' ||
        (typeof entry.value === 'string' && /^[\s₦$,.\d]+$/.test(entry.value)));
    const name = toText(
      !legacy ? entry.name : legacyValueIsPrice ? entry.type : entry.value,
    );
    const price = !legacy
      ? toNumber(entry.price)
      : legacyValueIsPrice
        ? toNumber(entry.value)
        : toNumber(fallbackPrice);
    if (!name) {
      throw new BadRequestException(`variants[${index}].name is required`);
    }
    if (price === undefined || price < 0) {
      throw new BadRequestException(
        `variants[${index}].price must be a non-negative number`,
      );
    }
    const compareAtPrice = toNumber(entry.compareAtPrice);
    if (compareAtPrice !== undefined && compareAtPrice < price) {
      throw new BadRequestException(
        `variants[${index}].compareAtPrice must be greater than or equal to its price`,
      );
    }
    const stock = toNumber(entry.stockQuantity ?? entry.inventory);
    return {
      id: toText(entry.id) ?? uuidv4(),
      name,
      price,
      compareAtPrice: compareAtPrice ?? null,
      sku: toText(entry.sku) ?? null,
      stockQuantity: stock === undefined ? null : Math.floor(stock),
    };
  });
}

/** A "was" price lower than the selling price would advertise a markup. */
export function assertCompareAtPrice(
  price: number | null | undefined,
  compareAtPrice: number | null | undefined,
): void {
  if (
    compareAtPrice !== null &&
    compareAtPrice !== undefined &&
    price !== null &&
    price !== undefined &&
    Number(compareAtPrice) < Number(price)
  ) {
    throw new BadRequestException(
      'compareAtPrice must be greater than or equal to price',
    );
  }
}
