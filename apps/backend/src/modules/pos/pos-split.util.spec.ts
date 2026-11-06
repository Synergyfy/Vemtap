import { BadRequestException } from '@nestjs/common';
import { previewSplit } from './pos-split.util';

const lines = [
  { id: 'a', name: 'Pepper Soup', quantity: 1, unitPrice: 4500 },
  { id: 'b', name: 'Jollof', quantity: 2, unitPrice: 2700 },
  { id: 'c', name: 'Chapman', quantity: 1, unitPrice: 1501 },
];
const people = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ name: `P${i + 1}` }));

describe('previewSplit', () => {
  it('splits equally and the shares add back to the exact total', () => {
    const result = previewSplit(
      { taxEnabled: true, taxRate: 7.5 },
      { lines, mode: 'equal', people: people(3) },
    );
    const sum = result.people.reduce((s, p) => s + p.amount, 0);
    expect(Math.round(sum * 100)).toBe(Math.round(result.total * 100));
    expect(
      result.people[0].amount - result.people[2].amount,
    ).toBeLessThanOrEqual(0.01);
  });

  it('splits by item, sharing a line taken by two people', () => {
    const result = previewSplit(undefined, {
      lines,
      mode: 'by_item',
      people: [
        { name: 'Tolu', lineIds: ['a', 'c'] },
        { name: 'Ada', lineIds: ['b', 'c'] },
      ],
    });
    // Tolu: 4500 + 750.5, Ada: 5400 + 750.5
    expect(result.people.map((p) => p.amount)).toEqual([5250.5, 6150.5]);
    expect(result.total).toBe(11401);
  });

  it('refuses a by-item split that leaves an item unassigned', () => {
    expect(() =>
      previewSplit(undefined, {
        lines,
        mode: 'by_item',
        people: [
          { name: 'Tolu', lineIds: ['a'] },
          { name: 'Ada', lineIds: ['b'] },
        ],
      }),
    ).toThrow(BadRequestException);
  });

  it('accepts custom amounts only when they cover the bill', () => {
    expect(() =>
      previewSplit(undefined, {
        lines,
        mode: 'custom',
        people: [
          { name: 'A', amount: 5000 },
          { name: 'B', amount: 5000 },
        ],
      }),
    ).toThrow(BadRequestException);

    const ok = previewSplit(undefined, {
      lines,
      mode: 'custom',
      people: [
        { name: 'A', amount: 6000 },
        { name: 'B', amount: 5401 },
      ],
    });
    expect(ok.people.map((p) => p.amount)).toEqual([6000, 5401]);
  });

  it('shares the service charge in proportion to each net', () => {
    const result = previewSplit(
      { serviceChargeEnabled: true, serviceChargeRate: 10 },
      {
        lines: [
          { id: 'x', name: 'X', quantity: 1, unitPrice: 3000 },
          { id: 'y', name: 'Y', quantity: 1, unitPrice: 1000 },
        ],
        mode: 'by_item',
        people: [
          { name: 'A', lineIds: ['x'] },
          { name: 'B', lineIds: ['y'] },
        ],
      },
    );
    expect(result.people.map((p) => p.serviceCharge)).toEqual([300, 100]);
    expect(result.people.map((p) => p.amount)).toEqual([3300, 1100]);
  });
});
