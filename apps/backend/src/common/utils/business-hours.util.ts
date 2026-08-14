export interface NormalizedDayHours {
  from: string;
  to: string;
  isClosed: boolean;
}

interface RawHoursEntry {
  from?: unknown;
  to?: unknown;
  open?: unknown;
  close?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  isClosed?: unknown;
  isOpen?: unknown;
  closed?: unknown;
}

const readTime = (v: unknown): string => {
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  return '';
};

/**
 * Normalizes a single day's hours entry into the canonical shape used by all
 * consumers ({ from, to, isClosed }). Accepts the legacy shape
 * ({ open, close, closed }) that older profile/onboarding flows wrote, plus
 * the automation shape ({ startTime, endTime, isOpen }) for robustness.
 *
 * Mirrors apps/VemTap/lib/businessHours.ts so frontend and backend agree.
 */
export function normalizeDayHours(h: unknown): NormalizedDayHours | null {
  if (h == null) return null;
  if (typeof h === 'string') {
    const [from, to] = h.split('-').map((t) => t.trim());
    return { from: from || '', to: to || '', isClosed: false };
  }
  const rec = h as RawHoursEntry;
  const from = readTime(rec.from ?? rec.open ?? rec.startTime);
  const to = readTime(rec.to ?? rec.close ?? rec.endTime);
  const isClosed =
    typeof rec.isClosed === 'boolean'
      ? rec.isClosed
      : typeof rec.isOpen === 'boolean'
        ? !rec.isOpen
        : typeof rec.closed === 'boolean'
          ? rec.closed
          : false;
  return { from, to, isClosed };
}

/** Normalizes a full day→hours map, dropping empty entries. */
export function normalizeOpeningHours(
  hours: Record<string, string | RawHoursEntry> | null | undefined,
): Record<string, NormalizedDayHours> {
  if (!hours) return {};
  const out: Record<string, NormalizedDayHours> = {};
  for (const [day, h] of Object.entries(hours)) {
    const norm = normalizeDayHours(h);
    if (norm) out[day] = norm;
  }
  return out;
}
