import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ReverseGeocodeQueryDto, SearchGeocodeQueryDto } from './geocoding.dto';

const errorsFor = async <T extends object>(cls: new () => T, body: object) =>
  (await validate(plainToInstance(cls, body))).map((error) => error.property);

describe('geocoding query DTOs', () => {
  it('accepts coordinates sent as query strings', async () => {
    expect(
      await errorsFor(ReverseGeocodeQueryDto, { lat: '9.0765', lng: '7.4813' }),
    ).toEqual([]);
  });

  it.each([
    [{ lat: '91', lng: '7' }, ['lat']],
    [{ lat: '9', lng: '-181' }, ['lng']],
    [{ lat: 'abc', lng: '7' }, ['lat']],
    [{}, ['lat', 'lng']],
  ])('rejects %j', async (body, invalid) => {
    expect(await errorsFor(ReverseGeocodeQueryDto, body)).toEqual(invalid);
  });

  it('needs a typed area of 2–100 characters', async () => {
    expect(await errorsFor(SearchGeocodeQueryDto, { q: 'Wuse II' })).toEqual(
      [],
    );
    expect(await errorsFor(SearchGeocodeQueryDto, { q: 'W' })).toEqual(['q']);
    expect(
      await errorsFor(SearchGeocodeQueryDto, { q: 'x'.repeat(101) }),
    ).toEqual(['q']);
  });
});
