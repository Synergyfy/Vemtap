import { createHmac } from 'crypto';
import {
  businessNameMatches,
  maskIdNumber,
  ownerListedOnCac,
  personNameMatches,
  verifyBytidSignature,
} from './verification-rules';

describe('personNameMatches', () => {
  const sandbox = {
    first_name: 'ADAEZE',
    middle_name: 'TEST',
    last_name: 'OKAFOR',
  };

  it('matches first and last name in any order, ignoring middle names and case', () => {
    expect(
      personNameMatches({ firstName: 'Adaeze', lastName: 'Okafor' }, sandbox),
    ).toBe(true);
    expect(
      personNameMatches({ firstName: 'okafor', lastName: 'ADAEZE' }, sandbox),
    ).toBe(true);
    expect(
      personNameMatches(
        { firstName: 'Adaeze', lastName: 'Okafor' },
        { full_name: 'OKAFOR ADAEZE TEST' },
      ),
    ).toBe(true);
  });

  it('ignores accents and punctuation', () => {
    expect(
      personNameMatches(
        { firstName: 'Chloé', lastName: "O'Neil" },
        { full_name: 'CHLOE O NEIL' },
      ),
    ).toBe(true);
  });

  it('rejects a different person or a missing name', () => {
    expect(
      personNameMatches({ firstName: 'Tunde', lastName: 'Bello' }, sandbox),
    ).toBe(false);
    expect(
      personNameMatches({ firstName: 'Adaeze', lastName: null }, sandbox),
    ).toBe(false);
    expect(
      personNameMatches({ firstName: 'Adaeze', lastName: 'Okafor' }, null),
    ).toBe(false);
  });
});

describe('businessNameMatches', () => {
  it('ignores company suffixes and accepts a shorter trading name', () => {
    expect(
      businessNameMatches('Urban Grill', 'URBAN GRILL AND BISTRO LIMITED'),
    ).toBe(true);
    expect(
      businessNameMatches('Mama Put Enterprises', 'MAMA PUT NIG LTD'),
    ).toBe(true);
  });

  it('rejects names that only share a generic word', () => {
    expect(businessNameMatches('Urban Grill', 'SKY LOUNGE LIMITED')).toBe(
      false,
    );
    expect(
      businessNameMatches('Grill House', 'URBAN GRILL AND BISTRO LIMITED'),
    ).toBe(false);
    expect(businessNameMatches('', 'URBAN GRILL')).toBe(false);
  });
});

describe('ownerListedOnCac', () => {
  it('finds the owner among directors or beneficial owners', () => {
    const people = [{ name: 'BELLO TUNDE' }, { name: 'ADAEZE TEST OKAFOR' }];
    expect(
      ownerListedOnCac({ firstName: 'Adaeze', lastName: 'Okafor' }, people),
    ).toBe(true);
    expect(
      ownerListedOnCac({ firstName: 'Ngozi', lastName: 'Eze' }, people),
    ).toBe(false);
    expect(
      ownerListedOnCac({ firstName: 'Ngozi', lastName: 'Eze' }, null),
    ).toBe(false);
  });
});

describe('maskIdNumber', () => {
  it('keeps only the last four characters', () => {
    expect(maskIdNumber('12345678901')).toBe('•••••••8901');
    expect(maskIdNumber('ABC 1234 5678 DE')).toBe('•••••••78DE');
    expect(maskIdNumber(null)).toBeNull();
  });
});

describe('verifyBytidSignature', () => {
  const secret = 'whsec_test';
  const body = '{"id":"evt_1","type":"verification.completed"}';
  const now = 1_760_000_000;
  const sign = (t: number, payload = body, key = secret) =>
    `t=${t},v1=${createHmac('sha256', key).update(`${t}.${payload}`).digest('hex')}`;

  it('accepts a fresh, correct signature over the raw body', () => {
    expect(
      verifyBytidSignature(sign(now), Buffer.from(body), secret, now),
    ).toBe(true);
  });

  it('rejects a tampered body, wrong secret, stale timestamp or missing header', () => {
    expect(
      verifyBytidSignature(
        sign(now),
        body.replace('evt_1', 'evt_2'),
        secret,
        now,
      ),
    ).toBe(false);
    expect(
      verifyBytidSignature(sign(now, body, 'whsec_other'), body, secret, now),
    ).toBe(false);
    expect(verifyBytidSignature(sign(now - 301), body, secret, now)).toBe(
      false,
    );
    expect(verifyBytidSignature(undefined, body, secret, now)).toBe(false);
    expect(verifyBytidSignature('t=abc,v1=zz', body, secret, now)).toBe(false);
    expect(verifyBytidSignature(sign(now), body, '', now)).toBe(false);
  });
});
