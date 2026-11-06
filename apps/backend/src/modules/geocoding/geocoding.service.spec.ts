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

describe('GeocodingService', () => {
  let service: GeocodingService;
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    service = new GeocodingService(createCache());
    Object.assign(service, { nominatimRetryDelayMs: 0 });
    fetchMock = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
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

  describe('built-in Nigerian areas', () => {
    it('names a point without calling a provider', async () => {
      await expect(service.reverse(9.0765, 7.476)).resolves.toEqual({
        district: 'Wuse II',
        city: 'Abuja',
        state: 'Federal Capital Territory',
        country: 'Nigeria',
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('names the state capital as the city around it', async () => {
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
    ])('finds %s without calling a provider', async (query, district, city) => {
      await expect(service.search(query)).resolves.toMatchObject({
        district,
        city,
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it.each([
      ['Ibadan', 'Oyo State'],
      ['Enugu', 'Enugu State'],
    ])('prefers the state capital for %s', async (query, state) => {
      await expect(service.search(query)).resolves.toMatchObject({
        district: null,
        city: query,
        state,
      });
    });

    it('does not guess a village when the state is unknown', async () => {
      fetchMock.mockImplementation(() => json([nominatimWuse]));

      const point = await service.search('Madeko');

      expect(point?.district).toBe('Wuse II');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('falls back to a village when no provider answers', async () => {
      fetchMock.mockImplementation(() => Promise.reject(new Error('offline')));

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
