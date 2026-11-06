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
    Object.assign(service, { nominatimRetryDelayMs: 0 });
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

    it('names the city from the state when OSM has no city', async () => {
      fetchMock
        .mockImplementationOnce(() =>
          json({
            lat: '6.52',
            lon: '3.38',
            address: {
              suburb: 'Igbobi',
              town: 'Bariga',
              state: 'Lagos State',
              country: 'Nigeria',
            },
          }),
        )
        .mockImplementationOnce(() =>
          json({
            lat: '9.03',
            lon: '7.49',
            address: {
              suburb: 'Garki',
              town: 'Garki',
              state: 'Federal Capital Territory',
              country: 'Nigeria',
            },
          }),
        );

      expect(await service.reverse(6.52, 3.38)).toEqual(
        expect.objectContaining({ district: 'Igbobi', city: 'Lagos' }),
      );
      expect(await service.reverse(9.03, 7.49)).toEqual(
        expect.objectContaining({ district: 'Garki', city: 'Abuja' }),
      );
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

  describe('Nominatim retry', () => {
    it.each([429, 503])('tries once more after a %i', async (status) => {
      fetchMock
        .mockImplementationOnce(() => json({}, false, status))
        .mockImplementationOnce(() => json(nominatimWuse));

      const place = await service.reverse(9.0765, 7.4813);

      expect(place?.district).toBe('Wuse II');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('tries once more after a dropped connection', async () => {
      fetchMock
        .mockImplementationOnce(() => Promise.reject(new Error('socket hang up')))
        .mockImplementationOnce(() => json(nominatimWuse));

      const place = await service.reverse(9.0765, 7.4813);

      expect(place?.district).toBe('Wuse II');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('gives up after the second failure', async () => {
      fetchMock.mockImplementation(() => json({}, false, 503));

      await expect(service.reverse(9.0765, 7.4813)).resolves.toBeNull();
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('does not retry a timeout', async () => {
      const timeout = new Error('The operation timed out');
      timeout.name = 'TimeoutError';
      fetchMock.mockImplementation(() => Promise.reject(timeout));

      await expect(service.reverse(9.0765, 7.4813)).resolves.toBeNull();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('does not retry a point Nominatim cannot name', async () => {
      fetchMock.mockImplementation(() => json({ error: 'Unable to geocode' }));

      await expect(service.reverse(3.9, 6.9)).resolves.toBeNull();
      expect(fetchMock).toHaveBeenCalledTimes(1);
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
