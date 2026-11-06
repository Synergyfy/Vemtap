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

const photonGwarinpa = {
  features: [
    {
      geometry: { coordinates: [7.3986, 9.0765] },
      properties: {
        name: 'Adamu Fika Street',
        osm_key: 'highway',
        city: 'Gwarinpa',
        state: 'Federal Capital Territory',
        country: 'Nigeria',
      },
    },
  ],
};

const photonJabi = {
  features: [
    {
      geometry: { coordinates: [7.421, 9.0646] },
      properties: {
        name: 'Jabi',
        osm_key: 'place',
        state: 'Federal Capital Territory',
        country: 'Nigeria',
      },
    },
  ],
};

const urlOf = (call: unknown[]) => String(call[0]);

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
  const originalLocationIqKey = process.env.LOCATIONIQ_API_KEY;

  beforeEach(() => {
    delete process.env.GOOGLE_MAPS_API_KEY;
    delete process.env.LOCATIONIQ_API_KEY;
    service = new GeocodingService(createCache());
    Object.assign(service, { nominatimRetryDelayMs: 0 });
    fetchMock = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    if (originalKey === undefined) delete process.env.GOOGLE_MAPS_API_KEY;
    else process.env.GOOGLE_MAPS_API_KEY = originalKey;
    if (originalLocationIqKey === undefined) {
      delete process.env.LOCATIONIQ_API_KEY;
    } else {
      process.env.LOCATIONIQ_API_KEY = originalLocationIqKey;
    }
    fetchMock.mockRestore();
  });

  describe('reverse', () => {
    it('asks Nominatim about a point outside the list and maps area and city', async () => {
      fetchMock.mockImplementation(() => json(nominatimWuse));

      const place = await service.reverse(51.5, -0.12);

      expect(place).toEqual({
        district: 'Wuse II',
        city: 'Abuja',
        state: 'FCT',
        country: 'Nigeria',
      });
      expect(String(fetchMock.mock.calls[0][0])).toContain(
        'nominatim.openstreetmap.org/reverse?lat=51.5&lon=-0.12',
      );
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

      expect(await service.reverse(51.52, 0.38)).toEqual(
        expect.objectContaining({ district: 'Igbobi', city: 'Lagos' }),
      );
      expect(await service.reverse(51.03, 0.49)).toEqual(
        expect.objectContaining({ district: 'Garki', city: 'Abuja' }),
      );
    });

    it('caches by rounded coordinates', async () => {
      fetchMock.mockImplementation(() => json(nominatimWuse));

      // Both round to 51.076, 0.481 (about 100 m).
      await service.reverse(51.07612, 0.48121);
      await service.reverse(51.07618, 0.48129);

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('returns null when no provider answers', async () => {
      fetchMock.mockImplementation(() => json({ error: 'Unable to geocode' }));
      expect(await service.reverse(0, 0)).toBeNull();

      fetchMock.mockImplementation(() => Promise.reject(new Error('offline')));
      expect(await service.reverse(1, 1)).toBeNull();
    });
  });

  describe('LocationIQ first', () => {
    beforeEach(() => {
      process.env.LOCATIONIQ_API_KEY = 'iq-key';
      process.env.GOOGLE_MAPS_API_KEY = 'test-key';
    });

    it('names a point with LocationIQ and asks nothing else', async () => {
      fetchMock.mockImplementation(() => json(nominatimWuse));

      await expect(service.reverse(9.0765, 7.4813)).resolves.toMatchObject({
        district: 'Wuse II',
        city: 'Abuja',
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(urlOf(fetchMock.mock.calls[0])).toContain(
        'us1.locationiq.com/v1/reverse?lat=9.0765&lon=7.4813',
      );
    });

    it('keeps typed areas inside Nigeria', async () => {
      fetchMock.mockImplementation(() => json([nominatimWuse]));

      await expect(service.search('Wuse II')).resolves.toMatchObject({
        lat: 9.0765,
        district: 'Wuse II',
      });
      expect(urlOf(fetchMock.mock.calls[0])).toContain('countrycodes=ng');
    });

    it('moves on to Google when LocationIQ has no match', async () => {
      fetchMock
        .mockImplementationOnce(() => json({ error: 'none' }, false, 404))
        .mockImplementationOnce(() => json(googleWuse));

      const place = await service.reverse(9.0765, 7.4813);

      expect(place?.state).toBe('Federal Capital Territory');
      expect(urlOf(fetchMock.mock.calls[1])).toContain('maps.googleapis.com');
    });

    it('fills in an area name from the built-in list', async () => {
      fetchMock.mockImplementation(() =>
        json({
          lat: '9.0765',
          lon: '7.476',
          address: { state: 'Federal Capital Territory', country: 'Nigeria' },
        }),
      );

      await expect(service.reverse(9.0765, 7.476)).resolves.toMatchObject({
        district: 'Wuse II',
        city: 'Abuja',
      });
    });
  });

  describe('city from the built-in list', () => {
    it('replaces a city that is only the state name', async () => {
      process.env.LOCATIONIQ_API_KEY = 'iq-key';
      fetchMock.mockImplementation(() =>
        json({
          lat: '7.3775',
          lon: '3.947',
          address: {
            county: 'Ona Ara',
            state: 'Oyo State',
            country: 'Nigeria',
          },
        }),
      );

      await expect(service.reverse(7.3775, 3.947)).resolves.toMatchObject({
        city: 'Ibadan',
        state: 'Oyo State',
      });
    });
  });

  describe('Google first', () => {
    beforeEach(() => {
      process.env.GOOGLE_MAPS_API_KEY = 'test-key';
    });

    it('names a point with Google and asks nothing else', async () => {
      fetchMock.mockImplementation(() => json(googleWuse));

      await expect(service.reverse(9.0765, 7.4813)).resolves.toEqual({
        district: 'Wuse II',
        city: 'Abuja',
        state: 'Federal Capital Territory',
        country: 'Nigeria',
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(urlOf(fetchMock.mock.calls[0])).toContain(
        'maps.googleapis.com/maps/api/geocode/json?latlng=9.0765,7.4813&key=test-key',
      );
    });

    it('keeps typed areas inside Nigeria', async () => {
      fetchMock.mockImplementation(() => json(googleWuse));

      await expect(service.search('Wuse II')).resolves.toMatchObject({
        lat: 9.0765,
        district: 'Wuse II',
      });
      expect(urlOf(fetchMock.mock.calls[0])).toContain('components=country:NG');
    });

    it('falls back to OpenStreetMap when Google refuses', async () => {
      fetchMock
        .mockImplementationOnce(() => json({ status: 'REQUEST_DENIED' }))
        .mockImplementationOnce(() => json(nominatimWuse));

      const place = await service.reverse(9.0765, 7.4813);

      expect(place?.district).toBe('Wuse II');
      expect(urlOf(fetchMock.mock.calls[1])).toContain('nominatim');
    });

    it('uses Google for business addresses', async () => {
      fetchMock.mockImplementation(() => json(googleWuse));

      await expect(
        service.geocodeAddress('12 Aminu Kano Crescent, Abuja'),
      ).resolves.toEqual({ lat: 9.0765, lng: 7.4813 });
    });
  });

  describe('built-in Nigerian areas', () => {
    const offline = () =>
      fetchMock.mockImplementation(() => Promise.reject(new Error('offline')));

    it('names a point when every provider fails', async () => {
      offline();

      await expect(service.reverse(9.0765, 7.476)).resolves.toEqual({
        district: 'Wuse II',
        city: 'Abuja',
        state: 'Federal Capital Territory',
        country: 'Nigeria',
      });
    });

    it('names the state capital as the city around it', async () => {
      offline();

      await expect(service.reverse(4.8156, 7.0498)).resolves.toMatchObject({
        city: 'Port Harcourt',
        state: 'Rivers State',
      });
    });

    it.each([
      ['Wuse 2', 'Wuse II', 'Abuja'],
      ['Garki, Abuja', 'Garki', 'Abuja'],
      ['Ogba Lagos', 'Ogba', 'Lagos'],
      ['GRA Port Harcourt', 'GRA', 'Port Harcourt'],
    ])('finds %s when every provider fails', async (query, district, city) => {
      offline();

      await expect(service.search(query)).resolves.toMatchObject({
        district,
        city,
      });
    });

    it.each([
      ['Ibadan', 'Oyo State'],
      ['Enugu', 'Enugu State'],
    ])('prefers the state capital for %s', async (query, state) => {
      offline();

      await expect(service.search(query)).resolves.toMatchObject({
        district: null,
        city: query,
        state,
      });
    });

    it('falls back to a village last of all', async () => {
      offline();

      await expect(service.search('Madeko')).resolves.toMatchObject({
        district: 'Madeko',
      });
    });
  });

  describe('Nominatim retry', () => {
    it.each([429, 503])('tries once more after a %i', async (status) => {
      fetchMock
        .mockImplementationOnce(() => json({}, false, status))
        .mockImplementationOnce(() => json(nominatimWuse));

      const place = await service.reverse(51.5, -0.12);

      expect(place?.district).toBe('Wuse II');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('tries once more after a dropped connection', async () => {
      fetchMock
        .mockImplementationOnce(() =>
          Promise.reject(new Error('socket hang up')),
        )
        .mockImplementationOnce(() => json(nominatimWuse));

      const place = await service.reverse(51.5, -0.12);

      expect(place?.district).toBe('Wuse II');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('gives up after the second failure', async () => {
      fetchMock.mockImplementation(() => json({}, false, 503));

      await expect(service.reverse(51.5, -0.12)).resolves.toBeNull();
      expect(
        fetchMock.mock.calls.filter((call) =>
          urlOf(call).includes('nominatim'),
        ),
      ).toHaveLength(2);
    });

    it('does not retry a timeout', async () => {
      const timeout = new Error('The operation timed out');
      timeout.name = 'TimeoutError';
      fetchMock.mockImplementation(() => Promise.reject(timeout));

      await expect(service.reverse(51.5, -0.12)).resolves.toBeNull();
      expect(
        fetchMock.mock.calls.filter((call) =>
          urlOf(call).includes('nominatim'),
        ),
      ).toHaveLength(1);
    });

    it('does not retry a point Nominatim cannot name', async () => {
      fetchMock.mockImplementation(() => json({ error: 'Unable to geocode' }));

      await expect(service.reverse(3.9, 6.9)).resolves.toBeNull();
      expect(
        fetchMock.mock.calls.filter((call) =>
          urlOf(call).includes('nominatim'),
        ),
      ).toHaveLength(1);
    });
  });

  describe('Photon fallback', () => {
    const nominatimRefuses = (photon: unknown) =>
      fetchMock.mockImplementation((url: string) =>
        url.includes('nominatim') ? json({}, false, 403) : json(photon),
      );

    it('names a point when Nominatim refuses the server', async () => {
      nominatimRefuses(photonGwarinpa);

      await expect(service.reverse(51.0765, 0.3986)).resolves.toEqual({
        district: 'Gwarinpa',
        city: 'Abuja',
        state: 'Federal Capital Territory',
        country: 'Nigeria',
      });
    });

    it('finds a typed area inside Nigeria', async () => {
      nominatimRefuses(photonJabi);

      await expect(service.search('Jabi Xyz')).resolves.toMatchObject({
        lat: 9.0646,
        lng: 7.421,
        district: 'Jabi',
        city: 'Abuja',
      });
      expect(urlOf(fetchMock.mock.calls[1])).toContain('bbox=');
    });

    it('rejects a guess that is not the typed area', async () => {
      nominatimRefuses(photonJabi);

      await expect(service.search('Zuba Extension')).resolves.toBeNull();
    });
  });

  describe('search', () => {
    it('asks Nominatim about an area outside the list', async () => {
      fetchMock.mockImplementation(() => json([nominatimWuse]));

      const point = await service.search('Zuba Extension');

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
