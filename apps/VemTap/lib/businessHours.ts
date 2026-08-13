export interface DayHours {
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

/**
 * Normalizes a single day's hours entry into the canonical shape used by all
 * consumers ({ from, to, isClosed }). Accepts the legacy shape
 * ({ open, close, closed }) that older onboarding flows wrote, plus the
 * automation shape ({ startTime, endTime, isOpen }) for robustness.
 */
export function normalizeDayHours(h: string | RawHoursEntry | null | undefined): DayHours | null {
    if (h == null) return null;
    if (typeof h === 'string') {
        const [from, to] = h.split('-').map((t) => t.trim());
        return { from: from || '', to: to || '', isClosed: false };
    }
    const from = String(h.from ?? h.open ?? h.startTime ?? '');
    const to = String(h.to ?? h.close ?? h.endTime ?? '');
    const isClosed =
        typeof h.isClosed === 'boolean'
            ? h.isClosed
            : typeof h.isOpen === 'boolean'
              ? !h.isOpen
              : typeof h.closed === 'boolean'
                ? h.closed
                : false;
    return { from, to, isClosed };
}

/** Normalizes a full day→hours map, dropping empty entries. */
export function normalizeOpeningHours(
    hours: Record<string, string | RawHoursEntry> | null | undefined
): Record<string, DayHours> {
    if (!hours) return {};
    const out: Record<string, DayHours> = {};
    for (const [day, h] of Object.entries(hours)) {
        const norm = normalizeDayHours(h);
        if (norm) out[day] = norm;
    }
    return out;
}
