import { createCache } from 'cache-manager';
import type { Cache } from 'cache-manager';
import { GeocodingService } from './geocoding.service';

const json = (body: unknown, ok = true, status = 200) =>
  Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response);

const nominatimWuse = {
  lat: '9.0765',
  lon: '7.4813',
  address: {
    suburb: 'Wuse II',
    city: 'Abuja',
    state: 'FCT',
    country: 'Nigeria',
  },
};

const googleWuse = {
  status: 'OK',
  results: [
    {
      address_components: [
        { long_name: 'Wuse II', types: ['sublocality_level_1', 'sublocality'] },
        { long_name: 'Abuja', types: ['locality'] },
        {
          long_name: 'Federal Capital Territory',
          types: ['administrative_area_level_1'],
        },
        { long_name: 'Nigeria', types: ['country'] },
      ],
      geometry: { location: { lat: 9.0765, lng: 7.4813 } },
    },
  ],
};

describe('GeocodingService', () => {
  let service: GeocodingService;
  let fetchMock: jest.SpyInstance;
  const originalKey = process.env.GOOGLE_MAPS_API_KEY;

  beforeEach(() => {
    service = new GeocodingService(createCache());
    fetchMock = jest.spyOn(global, 'fetch');
    delete process.env.GOOGLE_MAPS_API_KEY;
  });

  afterEach(() => {
    fetchMock.mockRestore();
    if (originalKey === undefined) delete process.env.GOOGLE_MAPS_API_KEY;
    else process.env.GOOGLE_MAPS_API_KEY = originalKey;
  });

  describe('reverse', () => {
    it('uses Nominatim without a Google key and maps area and city', async () => {
      fetchMock.mockImplementation(() => json(nominatimWuse));

      const place = await service.reverse(9.0765, 7.4813);

      expect(place).toEqual({
        district: 'Wuse II',
        city: 'Abuja',
        state: 'FCT',
        country: 'Nigeria',
      });
      expect(String(fetchMock.mock.calls[0][0])).toContain(
        'nominatim.openstreetmap.org/reverse?lat=9.0765&lon=7.4813',
      );
    });

    it('uses Google when GOOGLE_MAPS_API_KEY is set', async () => {
      process.env.GOOGLE_MAPS_API_KEY = 'test-key';
      fetchMock.mockImplementation(() => json(googleWuse));

      const place = await service.reverse(9.0765, 7.4813);

      expect(place).toEqual({
        district: 'Wuse II',
        city: 'Abuja',
        state: 'Federal Capital Territory',
        country: 'Nigeria',
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(String(fetchMock.mock.calls[0][0])).toContain(
        'maps.googleapis.com/maps/api/geocode/json?latlng=9.0765,7.4813&key=test-key',
      );
    });

    it('falls back to Nominatim when Google fails', async () => {
      process.env.GOOGLE_MAPS_API_KEY = 'test-key';
      fetchMock
        .mockImplementationOnce(() => json({ status: 'REQUEST_DENIED' }))
        .mockImplementationOnce(() => json(nominatimWuse));

      const place = await service.reverse(9.0765, 7.4813);

      expect(place?.district).toBe('Wuse II');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('caches by rounded coordinates', async () => {
      fetchMock.mockImplementation(() => json(nominatimWuse));

      // Both round to 9.076, 7.481 (about 100 m).
      await service.reverse(9.07612, 7.48121);
      await service.reverse(9.07618, 7.48129);

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('returns null when no provider answers', async () => {
      fetchMock.mockImplementation(() => json({ error: 'Unable to geocode' }));
      expect(await service.reverse(0, 0)).toBeNull();

      fetchMock.mockImplementation(() => Promise.reject(new Error('offline')));
      expect(await service.reverse(1, 1)).toBeNull();
    });
  });

  describe('search', () => {
    it('finds a typed area in Nigeria with coordinates', async () => {
      fetchMock.mockImplementation(() => json([nominatimWuse]));

      const point = await service.search('Wuse II');

      expect(point).toEqual(
        expect.objectContaining({
          lat: 9.0765,
          lng: 7.4813,
          district: 'Wuse II',
          city: 'Abuja',
        }),
      );
      expect(String(fetchMock.mock.calls[0][0])).toContain('countrycodes=ng');
    });

    it('returns null for blank input or no match', async () => {
      expect(await service.search('   ')).toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();

      fetchMock.mockImplementation(() => json([]));
      expect(await service.search('Nowhere Town')).toBeNull();
    });
  });

  describe('geocodeAddress', () => {
    it('returns coordinates for a business address without the Nigeria-only filter', async () => {
      fetchMock.mockImplementation(() => json([nominatimWuse]));

      expect(
        await service.geocodeAddress('12 Aminu Kano Crescent, Abuja'),
      ).toEqual({
        lat: 9.0765,
        lng: 7.4813,
      });
      expect(String(fetchMock.mock.calls[0][0])).not.toContain('countrycodes');
    });
  });
});
