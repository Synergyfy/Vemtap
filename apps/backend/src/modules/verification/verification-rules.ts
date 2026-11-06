import { createHmac, timingSafeEqual } from 'crypto';

/** Lowercase words, accents and punctuation removed. */
export function nameTokens(value: string | null | undefined): string[] {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Whether the account holder is the person on the ID. Their first and last
 * names must both appear among the registry names, in any order; middle names
 * on either side are ignored ("Adaeze Okafor" matches "OKAFOR ADAEZE TEST").
 */
export function personNameMatches(
  account: { firstName?: string | null; lastName?: string | null },
  registry:
    | {
        first_name?: string;
        middle_name?: string;
        last_name?: string;
        full_name?: string;
      }
    | null
    | undefined,
): boolean {
  if (!registry) return false;
  const want = [
    ...nameTokens(account.firstName),
    ...nameTokens(account.lastName),
  ];
  if (want.length < 2) return false;
  const have = new Set([
    ...nameTokens(registry.full_name),
    ...nameTokens(registry.first_name),
    ...nameTokens(registry.middle_name),
    ...nameTokens(registry.last_name),
  ]);
  return want.every((token) => have.has(token));
}

/** Words that don't distinguish one business from another. */
const BUSINESS_NOISE = new Set([
  'ltd',
  'limited',
  'plc',
  'llc',
  'inc',
  'co',
  'company',
  'nig',
  'nigeria',
  'enterprise',
  'enterprises',
  'ventures',
  'venture',
  'services',
  'global',
  'international',
  'and',
  'the',
  'of',
  'gte',
  'rc',
  'bn',
]);

function businessTokens(value: string | null | undefined): string[] {
  return nameTokens(value).filter((token) => !BUSINESS_NOISE.has(token));
}

/**
 * Whether the business on VEMTAP is the one on the CAC record. Distinctive
 * words are compared both ways; most of the shorter name must appear in the
 * longer ("Urban Grill" vs "URBAN GRILL AND BISTRO LIMITED").
 */
export function businessNameMatches(
  appName: string | null | undefined,
  legalName: string | null | undefined,
): boolean {
  const a = businessTokens(appName);
  const b = businessTokens(legalName);
  if (a.length === 0 || b.length === 0) return false;
  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];
  const longerSet = new Set(longer);
  const shared = shorter.filter((token) => longerSet.has(token)).length;
  return shared / shorter.length >= 0.75;
}

/** Whether the owner is a director or beneficial owner on the CAC record. */
export function ownerListedOnCac(
  owner: { firstName?: string | null; lastName?: string | null },
  people: { name: string }[] | null | undefined,
): boolean {
  return (people ?? []).some((person) =>
    personNameMatches(owner, { full_name: person.name }),
  );
}

/** `NIN 12345678901` → `•••••••8901`. */
export function maskIdNumber(value: string | null | undefined): string | null {
  if (!value) return null;
  const clean = value.replace(/\s+/g, '');
  if (clean.length <= 4) return clean;
  return `${'•'.repeat(Math.min(clean.length - 4, 7))}${clean.slice(-4)}`;
}

/**
 * Check a `Bytid-Signature: t=<unix>,v1=<hex>` header: HMAC-SHA256 of
 * `"<t>.<raw body>"` with the endpoint secret, within `toleranceSeconds`.
 */
export function verifyBytidSignature(
  header: string | undefined,
  rawBody: Buffer | string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
  toleranceSeconds = 300,
): boolean {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(
    header.split(',').map((part) => {
      const [key, ...rest] = part.trim().split('=');
      return [key, rest.join('=')];
    }),
  );
  const timestamp = Number(parts.t);
  const signature = parts.v1;
  if (!Number.isFinite(timestamp) || !signature) return false;
  if (Math.abs(nowSeconds - timestamp) > toleranceSeconds) return false;
  const expected = createHmac('sha256', secret)
    .update(
      `${timestamp}.${typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8')}`,
    )
    .digest('hex');
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(signature, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}
