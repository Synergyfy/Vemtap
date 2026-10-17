import { BadRequestException } from '@nestjs/common';
import {
  assertCompareAtPrice,
  effectiveUnitPrice,
  normalizeVariants,
} from './catalogue-item.utils';

describe('normalizeVariants', () => {
  it('leaves stored variants alone when the request omits them', () => {
    expect(normalizeVariants(undefined)).toBeUndefined();
    expect(normalizeVariants(null)).toBeNull();
  });

  it('keeps the current shape and fills defaults', () => {
    const [variant] = normalizeVariants([
      { name: ' Large ', price: 4500, stockQuantity: 12.7, sku: 'BRG-L' },
    ])!;
    expect(variant).toMatchObject({
      name: 'Large',
      price: 4500,
      stockQuantity: 12,
      sku: 'BRG-L',
      compareAtPrice: null,
    });
    expect(variant.id).toEqual(expect.any(String));
  });

  it('keeps a client-supplied id so edits update the same variant', () => {
    expect(
      normalizeVariants([{ id: 'v-1', name: 'Small', price: 3000 }])![0].id,
    ).toBe('v-1');
  });

  it('reads the mobile legacy shape: label in type, price in value', () => {
    expect(
      normalizeVariants([{ type: 'Large', value: '₦4,500' }])![0],
    ).toMatchObject({ name: 'Large', price: 4500 });
  });

  it('reads the seed legacy shape: attribute in type, label in value', () => {
    expect(
      normalizeVariants([{ type: 'size', value: 'Double' }], 6500)![0],
    ).toMatchObject({ name: 'Double', price: 6500 });
  });

  it('accepts the wizard `inventory` field as stock', () => {
    expect(
      normalizeVariants([{ name: 'Large', price: 4500, inventory: 8 }])![0]
        .stockQuantity,
    ).toBe(8);
  });

  it('rejects a variant without a name or a usable price', () => {
    expect(() => normalizeVariants([{ price: 100 }])).toThrow(
      BadRequestException,
    );
    expect(() => normalizeVariants([{ name: 'Large', price: 'free' }])).toThrow(
      /price must be a non-negative number/,
    );
  });

  it('rejects a compare-at price below the variant price', () => {
    expect(() =>
      normalizeVariants([{ name: 'Large', price: 4500, compareAtPrice: 4000 }]),
    ).toThrow(/compareAtPrice/);
  });
});

describe('assertCompareAtPrice', () => {
  it('allows a missing or higher compare-at price', () => {
    expect(() => assertCompareAtPrice(1000, undefined)).not.toThrow();
    expect(() => assertCompareAtPrice(1000, null)).not.toThrow();
    expect(() => assertCompareAtPrice(1000, 1200)).not.toThrow();
    expect(() => assertCompareAtPrice(1000, 1000)).not.toThrow();
  });

  it('rejects a compare-at price below the price', () => {
    expect(() => assertCompareAtPrice(1000, 900)).toThrow(BadRequestException);
  });
});

describe('CatalogueItem legacy variants on load', () => {
  // Imported here so the entity's @AfterLoad hook is exercised directly.

  const { CatalogueItem } = require('../entities/catalogue-item.entity');

  it('presents stored legacy variants in the current shape with stable ids', () => {
    const item = Object.assign(new CatalogueItem(), {
      price: 6500,
      variants: [
        { type: 'size', value: '12 inch' },
        { type: 'Large', value: '7,500' },
      ],
    });
    item.normalizeStoredVariants();
    expect(item.variants).toEqual([
      expect.objectContaining({ id: 'v1', name: '12 inch', price: 6500 }),
      expect.objectContaining({ id: 'v2', name: 'Large', price: 7500 }),
    ]);
  });

  it('leaves current-shape variants untouched', () => {
    const variants = [{ id: 'a', name: 'Small', price: 100 }];
    const item = Object.assign(new CatalogueItem(), { price: 100, variants });
    item.normalizeStoredVariants();
    expect(item.variants).toBe(variants);
  });
});

describe('effectiveUnitPrice', () => {
  it('takes a percentage or fixed discount off, never below zero', () => {
    expect(
      effectiveUnitPrice({
        price: 5000,
        discountType: 'percentage',
        discountValue: 10,
      }),
    ).toBe(4500);
    expect(
      effectiveUnitPrice({
        price: '5000.00',
        discountType: 'fixed',
        discountValue: '750',
      }),
    ).toBe(4250);
    expect(
      effectiveUnitPrice({
        price: 5000,
        discountType: 'percentage',
        discountValue: 150,
      }),
    ).toBe(0);
    expect(
      effectiveUnitPrice({
        price: 5000,
        discountType: 'fixed',
        discountValue: 9000,
      }),
    ).toBe(0);
  });

  it('charges the list price with no usable discount', () => {
    expect(
      effectiveUnitPrice({
        price: 5000,
        discountType: 'none',
        discountValue: 10,
      }),
    ).toBe(5000);
    expect(
      effectiveUnitPrice({
        price: 3333,
        discountType: 'percentage',
        discountValue: null,
      }),
    ).toBe(3333);
  });
});
