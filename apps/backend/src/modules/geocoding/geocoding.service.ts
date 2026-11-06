import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { findNigerianArea, nameNigerianPoint } from './nigeria-areas';

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

interface PhotonFeature {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    name?: string;
    osm_key?: string;
    district?: string;
    locality?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
  };
}

/** "Lagos State" → "Lagos", "Federal Capital Territory" → "Abuja". */
const stateCity = (state?: string): string | undefined => {
  if (!state) return undefined;
  if (/federal capital territory|^fct$/i.test(state)) return 'Abuja';
  return state.replace(/\s+state$/i, '').trim() || undefined;
};

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';
const NOMINATIM_HEADERS = {
  'Accept-Language': 'en',
  'User-Agent': 'VemTap/1.0 (https://vemtap.com)',
};
const PHOTON_URL = 'https://photon.komoot.io';
/** Keeps typed areas inside Nigeria: west, south, east, north. */
const NIGERIA_BBOX = '2.67,4.24,14.68,13.9';
const REQUEST_TIMEOUT_MS = 8000;
/** A day: areas don't move, and Nominatim allows about one request a second. */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Address ⇄ coordinates for businesses and customers.
 *
 * Customer look-ups try the built-in list of Nigerian areas first, so naming a
 * position or finding an area doesn't depend on an outside service. Anything it
 * doesn't know goes to OpenStreetMap Nominatim, then Photon: Nominatim refuses
 * shared server addresses without warning, so it can't be the last provider.
 * Business addresses are street-level, so they skip the list. Customer look-ups
 * are cached by coordinates rounded to ~100 m.
 */
@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  /** Just over Nominatim's limit of one request a second. */
  private readonly nominatimRetryDelayMs: number = 1100;

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  /** The area and city at a point, or null when no provider knows it. */
  async reverse(lat: number, lng: number): Promise<GeocodedPlace | null> {
    const key = `geocode:reverse:${lat.toFixed(3)},${lng.toFixed(3)}`;
    const cached = await this.cache.get<GeocodedPlace>(key);
    if (cached) return cached;

    const listed = nameNigerianPoint(lat, lng);
    const nominatim = listed
      ? null
      : await this.nominatim(
          `/reverse?lat=${lat}&lon=${lng}&format=jsonv2&zoom=16&addressdetails=1`,
        );
    const photon =
      listed || nominatim
        ? null
        : await this.photon(`/reverse?lat=${lat}&lon=${lng}&limit=1`);
    const source =
      listed ??
      (nominatim ? this.fromNominatim(nominatim) : null) ??
      (photon ? this.fromPhoton(photon) : null);
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

    const point =
      findNigerianArea(q) ??
      (await this.nominatimSearch(q, true)) ??
      (await this.photonSearch(q, true)) ??
      findNigerianArea(q, true);

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
    const found =
      (await this.nominatimSearch(address, false)) ??
      (await this.photonSearch(address, false));
    return found ? { lat: found.lat, lng: found.lng } : null;
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

  private async photonSearch(
    q: string,
    nigeriaOnly: boolean,
  ): Promise<GeocodedPoint | null> {
    const area = nigeriaOnly ? `&bbox=${NIGERIA_BBOX}&osm_tag=place` : '';
    const feature = await this.photon(
      `/api/?q=${encodeURIComponent(q)}&limit=1${area}`,
    );
    const [lng, lat] = feature?.geometry?.coordinates ?? [];
    if (!feature || lat === undefined || lng === undefined) return null;
    // Photon answers a miss with its nearest guess ("Wuse Zone 5" came back in
    // Port Harcourt): a wrong place is worse than saying it wasn't found.
    const firstWord = q
      .trim()
      .split(/[\s,]+/)[0]
      .toLowerCase();
    const name = feature.properties?.name?.toLowerCase() ?? '';
    if (nigeriaOnly && !name.includes(firstWord)) return null;
    return { lat, lng, ...this.fromPhoton(feature) };
  }

  /**
   * Nominatim's answer, or null. It is often the only provider, so a rate
   * limit, server error or dropped connection gets one more try. A timeout
   * doesn't: it has already spent the customer's wait.
   */
  private async nominatim<T = NominatimResult>(
    path: string,
  ): Promise<T | null> {
    const first = await this.nominatimRequest<T>(path);
    if (!first.retry) return first.data;
    await new Promise((resolve) =>
      setTimeout(resolve, this.nominatimRetryDelayMs),
    );
    return (await this.nominatimRequest<T>(path)).data;
  }

  private async nominatimRequest<T>(
    path: string,
  ): Promise<{ data: T | null; retry: boolean }> {
    try {
      const res = await fetch(`${NOMINATIM_URL}${path}`, {
        headers: NOMINATIM_HEADERS,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!res.ok) {
        this.logger.warn(`Nominatim returned ${res.status}`);
        return { data: null, retry: res.status === 429 || res.status >= 500 };
      }
      const data = (await res.json()) as T & { error?: string };
      return {
        data: data && !(data as { error?: string }).error ? data : null,
        retry: false,
      };
    } catch (error) {
      this.logger.warn(`Nominatim failed: ${(error as Error).message}`);
      return { data: null, retry: (error as Error).name !== 'TimeoutError' };
    }
  }

  /** Photon's first match, or null when it has none or can't be reached. */
  private async photon(path: string): Promise<PhotonFeature | null> {
    try {
      const res = await fetch(`${PHOTON_URL}${path}`, {
        headers: NOMINATIM_HEADERS,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!res.ok) {
        this.logger.warn(`Photon returned ${res.status}`);
        return null;
      }
      const data = (await res.json()) as { features?: PhotonFeature[] };
      return data.features?.[0] ?? null;
    } catch (error) {
      this.logger.warn(`Photon failed: ${(error as Error).message}`);
      return null;
    }
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

  private fromPhoton(feature: PhotonFeature): GeocodedPlace {
    const p = feature.properties ?? {};
    // Abuja and Lagos: OSM's "city" is really an area of the state's city.
    const metro = /federal capital territory|^fct$|^lagos/i.test(p.state ?? '')
      ? stateCity(p.state)
      : undefined;
    const place = p.osm_key === 'place' ? p.name : undefined;
    return {
      district:
        p.district ??
        p.locality ??
        place ??
        (metro ? p.city : undefined) ??
        null,
      city: metro ?? p.city ?? stateCity(p.state) ?? p.county ?? null,
      state: p.state ?? null,
      country: p.country ?? null,
    };
  }
}
