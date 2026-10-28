import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Cache } from 'cache-manager';

/** A place a customer can browse from: an area name plus its city. */
export interface GeocodedPlace {
  district: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
}

export interface GeocodedPoint extends GeocodedPlace {
  lat: number;
  lng: number;
}

interface GoogleComponent {
  long_name: string;
  types: string[];
}

interface GoogleResult {
  address_components?: GoogleComponent[];
  geometry?: { location?: { lat: number; lng: number } };
}

interface NominatimAddress {
  suburb?: string;
  neighbourhood?: string;
  quarter?: string;
  city_district?: string;
  village?: string;
  town?: string;
  city?: string;
  county?: string;
  state?: string;
  country?: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  address?: NominatimAddress;
}

/** "Lagos State" → "Lagos", "Federal Capital Territory" → "Abuja". */
const stateCity = (state?: string): string | undefined => {
  if (!state) return undefined;
  if (/federal capital territory|^fct$/i.test(state)) return 'Abuja';
  return state.replace(/\s+state$/i, '').trim() || undefined;
};

const GOOGLE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';
const NOMINATIM_HEADERS = {
  'Accept-Language': 'en',
  'User-Agent': 'VemTap/1.0',
};
const REQUEST_TIMEOUT_MS = 8000;
/** A day: areas don't move, and Nominatim allows about one request a second. */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Address ⇄ coordinates for businesses and customers.
 *
 * Uses Google Geocoding when `GOOGLE_MAPS_API_KEY` is set and OpenStreetMap
 * Nominatim otherwise (or when Google fails). Customer look-ups are cached by
 * coordinates rounded to ~100 m.
 */
@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  /** The area and city at a point, or null when no provider knows it. */
  async reverse(lat: number, lng: number): Promise<GeocodedPlace | null> {
    const key = `geocode:reverse:${lat.toFixed(3)},${lng.toFixed(3)}`;
    const cached = await this.cache.get<GeocodedPlace>(key);
    if (cached) return cached;

    const google = await this.tryGoogle(`latlng=${lat},${lng}`);
    const nominatim = google
      ? null
      : await this.nominatim(
          `/reverse?lat=${lat}&lon=${lng}&format=jsonv2&zoom=16&addressdetails=1`,
        );
    const source = google ?? (nominatim ? this.fromNominatim(nominatim) : null);
    const place: GeocodedPlace | null = source
      ? {
          district: source.district,
          city: source.city,
          state: source.state,
          country: source.country,
        }
      : null;

    if (place) await this.cache.set(key, place, CACHE_TTL_MS);
    return place;
  }

  /** The best match for a typed area in Nigeria, or null. */
  async search(query: string): Promise<GeocodedPoint | null> {
    const q = query.trim();
    if (!q) return null;
    const key = `geocode:search:${q.toLowerCase()}`;
    const cached = await this.cache.get<GeocodedPoint>(key);
    if (cached) return cached;

    const google = await this.tryGoogle(
      `address=${encodeURIComponent(q)}&components=country:NG`,
    );
    const point =
      google && 'lat' in google ? google : await this.nominatimSearch(q, true);

    if (point) await this.cache.set(key, point, CACHE_TTL_MS);
    return point;
  }

  /**
   * Coordinates for a full business address, or null. Not cached: each
   * address is geocoded once by the geocoding queue.
   */
  async geocodeAddress(
    address: string,
  ): Promise<{ lat: number; lng: number } | null> {
    const google = await this.tryGoogle(
      `address=${encodeURIComponent(address)}`,
    );
    if (google && 'lat' in google) return { lat: google.lat, lng: google.lng };
    const nominatim = await this.nominatimSearch(address, false);
    return nominatim ? { lat: nominatim.lat, lng: nominatim.lng } : null;
  }

  private async nominatimSearch(
    q: string,
    nigeriaOnly: boolean,
  ): Promise<GeocodedPoint | null> {
    const result = await this.nominatim<NominatimResult[]>(
      `/search?q=${encodeURIComponent(q)}&format=jsonv2&addressdetails=1&limit=1${nigeriaOnly ? '&countrycodes=ng' : ''}`,
    );
    const first = result?.[0];
    if (!first) return null;
    return {
      lat: parseFloat(first.lat),
      lng: parseFloat(first.lon),
      ...this.fromNominatim(first),
    };
  }

  /** Google's first result, or null without a key or on any failure. */
  private async tryGoogle(
    params: string,
  ): Promise<GeocodedPlace | GeocodedPoint | null> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
    if (!apiKey) return null;
    try {
      const res = await fetch(`${GOOGLE_URL}?${params}&key=${apiKey}`, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      const data = (await res.json()) as {
        status: string;
        results?: GoogleResult[];
      };
      const first = data.results?.[0];
      if (data.status !== 'OK' || !first) {
        if (data.status !== 'ZERO_RESULTS') {
          this.logger.warn(`Google geocoding returned ${data.status}`);
        }
        return null;
      }
      const place = this.fromGoogle(first);
      const location = first.geometry?.location;
      return location
        ? { ...place, lat: location.lat, lng: location.lng }
        : place;
    } catch (error) {
      this.logger.warn(`Google geocoding failed: ${(error as Error).message}`);
      return null;
    }
  }

  private async nominatim<T = NominatimResult>(
    path: string,
  ): Promise<T | null> {
    try {
      const res = await fetch(`${NOMINATIM_URL}${path}`, {
        headers: NOMINATIM_HEADERS,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!res.ok) {
        this.logger.warn(`Nominatim returned ${res.status}`);
        return null;
      }
      const data = (await res.json()) as T & { error?: string };
      return data && !(data as { error?: string }).error ? data : null;
    } catch (error) {
      this.logger.warn(`Nominatim failed: ${(error as Error).message}`);
      return null;
    }
  }

  private fromGoogle(result: GoogleResult): GeocodedPlace {
    const components = result.address_components ?? [];
    const find = (...types: string[]) =>
      types
        .map(
          (type) => components.find((c) => c.types.includes(type))?.long_name,
        )
        .find(Boolean) ?? null;
    return {
      district: find('sublocality_level_1', 'sublocality', 'neighborhood'),
      city: find(
        'locality',
        'administrative_area_level_2',
        'administrative_area_level_1',
      ),
      state: find('administrative_area_level_1'),
      country: find('country'),
    };
  }

  private fromNominatim(result: NominatimResult): GeocodedPlace {
    const a = result.address ?? {};
    return {
      district:
        a.suburb ??
        a.neighbourhood ??
        a.quarter ??
        a.city_district ??
        a.village ??
        null,
      // OSM often has no `city` in Nigeria (towns are LGAs, e.g. Bariga in
      // Lagos): the state's city reads better than the LGA.
      city: a.city ?? stateCity(a.state) ?? a.town ?? a.county ?? null,
      state: a.state ?? null,
      country: a.country ?? null,
    };
  }
}
