import { BadRequestException } from '@nestjs/common';
import { computePosCharges, PosSettings } from './pos-settings.types';
import { PosSplitPreviewDto } from './dto/pos-split.dto';

const toKobo = (naira: number) => Math.round(naira * 100);
const toNaira = (kobo: number) => kobo / 100;

/**
 * Split `totalKobo` by `weights`, giving any rounding remainder to the first
 * shares so the parts always add back up exactly.
 */
function allocate(totalKobo: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0) {
    const even = weights.map(() => Math.floor(totalKobo / weights.length));
    let left = totalKobo - even.reduce((a, b) => a + b, 0);
    for (let i = 0; left > 0; i = (i + 1) % even.length, left--) even[i]++;
    return even;
  }
  const parts = weights.map((w) => Math.floor((totalKobo * w) / sum));
  let left = totalKobo - parts.reduce((a, b) => a + b, 0);
  for (let i = 0; left > 0; i = (i + 1) % parts.length, left--) parts[i]++;
  return parts;
}

/**
 * Each person's share of a bill, including their part of VAT, service charge
 * and packaging. Charges are priced once on the whole bill (as the till does)
 * and shared in proportion to each person's net, so the shares sum to the
 * exact bill total.
 */
export function previewSplit(
  settings: PosSettings | null | undefined,
  dto: PosSplitPreviewDto,
) {
  const lineTotals = new Map(
    dto.lines.map((line) => [line.id, toKobo(line.unitPrice * line.quantity)]),
  );
  const subtotalKobo = [...lineTotals.values()].reduce((a, b) => a + b, 0);
  const discountKobo = Math.min(subtotalKobo, toKobo(dto.discountAmount ?? 0));
  const charges = computePosCharges(
    settings,
    toNaira(subtotalKobo - discountKobo),
    {
      orderType: dto.orderType,
      waiveServiceCharge: dto.waiveServiceCharge,
    },
  );
  const totalKobo = toKobo(charges.total);

  let weights: number[];
  if (dto.mode === 'equal') {
    weights = dto.people.map(() => 1);
  } else if (dto.mode === 'by_item') {
    const takers = new Map<string, number>();
    for (const person of dto.people) {
      for (const id of person.lineIds ?? []) {
        if (!lineTotals.has(id)) {
          throw new BadRequestException(`Unknown line ${id}`);
        }
        takers.set(id, (takers.get(id) ?? 0) + 1);
      }
    }
    const unassigned = dto.lines.filter((line) => !takers.has(line.id));
    if (unassigned.length) {
      throw new BadRequestException(
        `Assign every item: ${unassigned.map((line) => line.name).join(', ')}`,
      );
    }
    weights = dto.people.map((person) =>
      [...new Set(person.lineIds ?? [])].reduce(
        (sum, id) => sum + (lineTotals.get(id) ?? 0) / (takers.get(id) ?? 1),
        0,
      ),
    );
  } else {
    const amounts = dto.people.map((person) => toKobo(person.amount ?? 0));
    const given = amounts.reduce((a, b) => a + b, 0);
    if (Math.abs(given - totalKobo) > 1) {
      throw new BadRequestException(
        `Custom amounts add up to ${toNaira(given)} but the bill is ${toNaira(totalKobo)}`,
      );
    }
    weights = amounts;
  }

  const amounts = allocate(totalKobo, weights);
  const taxParts = allocate(toKobo(charges.tax), weights);
  const serviceParts = allocate(toKobo(charges.serviceCharge), weights);
  const packagingParts = allocate(toKobo(charges.packagingFee), weights);

  return {
    subtotal: toNaira(subtotalKobo),
    discountAmount: toNaira(discountKobo),
    tax: charges.tax,
    serviceCharge: charges.serviceCharge,
    packagingFee: charges.packagingFee,
    total: charges.total,
    people: dto.people.map((person, index) => ({
      name: person.name,
      lineIds: dto.mode === 'by_item' ? (person.lineIds ?? []) : undefined,
      tax: toNaira(taxParts[index]),
      serviceCharge: toNaira(serviceParts[index]),
      packagingFee: toNaira(packagingParts[index]),
      amount: toNaira(amounts[index]),
    })),
  };
}
