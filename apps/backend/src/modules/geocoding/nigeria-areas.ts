import type { GeocodedPlace, GeocodedPoint } from './geocoding.service';
import type * as AreaData from './nigeria-areas.data';

/** Name, position and size of one place from `nigeria-areas.data.ts`. */
interface Area {
  name: string;
  lat: number;
  lng: number;
  state: number;
  rank: number;
}

interface AreaIndex {
  states: string[];
  cities: Area[];
  byName: Map<string, Area[]>;
  grid: Map<string, Area[]>;
}

const STATE_CAPITAL = 4;
const CITY_AREA = 3;
const CITY_OR_TOWN = 2;
/** About 11 km a side at Nigeria's latitude. */
const CELL_DEGREES = 0.1;
const AREA_RADIUS_KM = 3;
const VILLAGE_RADIUS_KM = 10;
/** Further than this from every listed place is treated as outside Nigeria. */
const COVERAGE_RADIUS_KM = 30;
const CAPITAL_RADIUS_KM = 25;
const CITY_RADIUS_KM = 60;
/** These cities are the whole state, and their areas are the useful name. */
const METRO_CITIES: Record<string, string> = {
  'Federal Capital Territory': 'Abuja',
  Lagos: 'Lagos',
};

const normalize = (text: string) =>
  text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\bii\b/g, '2')
    .replace(/\biii\b/g, '3')
    .replace(/\s+(district|state)$/, '')
    .trim();

const cellKey = (lat: number, lng: number) =>
  `${Math.floor(lat / CELL_DEGREES)}:${Math.floor(lng / CELL_DEGREES)}`;

const distanceKm = (lat: number, lng: number, area: Area) => {
  const x = (area.lng - lng) * Math.cos((lat * Math.PI) / 180);
  return Math.hypot(area.lat - lat, x) * 111.32;
};

const push = <T>(map: Map<string, T[]>, key: string, value: T) => {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
};

let index: AreaIndex | null = null;

/** Parsed on first use: the list is too large to pay for on every cold start. */
const loadIndex = (): AreaIndex => {
  if (index) return index;
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- loaded lazily on purpose (see above).
  const data = require('./nigeria-areas.data') as typeof AreaData;
  const built: AreaIndex = {
    states: data.NIGERIA_STATES,
    cities: [],
    byName: new Map(),
    grid: new Map(),
  };
  for (const line of data.NIGERIA_AREAS.split('\n')) {
    const [name, lat, lng, state, rank] = line.split('|');
    const area: Area = {
      name,
      lat: Number(lat),
      lng: Number(lng),
      state: Number(state),
      rank: Number(rank),
    };
    push(built.byName, normalize(name), area);
    push(built.grid, cellKey(area.lat, area.lng), area);
    if (area.rank === CITY_OR_TOWN || area.rank === STATE_CAPITAL) {
      built.cities.push(area);
    }
  }
  index = built;
  return built;
};

/** Every listed place within `COVERAGE_RADIUS_KM`, nearest first. */
const nearby = (areas: AreaIndex, lat: number, lng: number) => {
  const reach = Math.ceil(COVERAGE_RADIUS_KM / 111.32 / CELL_DEGREES);
  const found: { area: Area; km: number }[] = [];
  for (let row = -reach; row <= reach; row += 1) {
    for (let column = -reach; column <= reach; column += 1) {
      const cell = areas.grid.get(
        cellKey(lat + row * CELL_DEGREES, lng + column * CELL_DEGREES),
      );
      for (const area of cell ?? []) {
        const km = distanceKm(lat, lng, area);
        if (km <= COVERAGE_RADIUS_KM) found.push({ area, km });
      }
    }
  }
  return found.sort((a, b) => a.km - b.km);
};

const cityAt = (areas: AreaIndex, lat: number, lng: number, state: string) => {
  if (METRO_CITIES[state]) return METRO_CITIES[state];
  let best: Area | null = null;
  let bestKm = CITY_RADIUS_KM;
  for (const city of areas.cities) {
    if (areas.states[city.state] !== state) continue;
    const km = distanceKm(lat, lng, city);
    // A nearby capital beats its suburbs, which OSM often calls towns.
    if (city.rank === STATE_CAPITAL && km <= CAPITAL_RADIUS_KM)
      return city.name;
    if (km < bestKm) {
      best = city;
      bestKm = km;
    }
  }
  return best?.name ?? state;
};

const describe = (
  areas: AreaIndex,
  lat: number,
  lng: number,
  district: string | null,
  stateIndex: number,
): GeocodedPlace => {
  const state = areas.states[stateIndex];
  const city = cityAt(areas, lat, lng, state);
  return {
    district: district === city ? null : district,
    city,
    state: state === 'Federal Capital Territory' ? state : `${state} State`,
    country: 'Nigeria',
  };
};

/** The area and city at a point, or null when it isn't near a listed place. */
export function nameNigerianPoint(
  lat: number,
  lng: number,
): GeocodedPlace | null {
  const areas = loadIndex();
  const places = nearby(areas, lat, lng);
  const closest = places[0];
  if (!closest) return null;
  const cityArea = places.find(
    ({ area, km }) => area.rank === CITY_AREA && km <= AREA_RADIUS_KM,
  );
  const named =
    cityArea ?? (closest.km <= VILLAGE_RADIUS_KM ? closest : undefined);
  return describe(
    areas,
    lat,
    lng,
    named?.area.name ?? null,
    (named ?? closest).area.state,
  );
}

/** The states a hint like "abuja", "lagos" or "oyo state" can mean. */
const statesFor = (areas: AreaIndex, hint: string): Set<number> | null => {
  const states = new Set<number>();
  areas.states.forEach((state, position) => {
    if (normalize(state) === hint) states.add(position);
  });
  for (const [state, city] of Object.entries(METRO_CITIES)) {
    if (normalize(city) === hint) states.add(areas.states.indexOf(state));
  }
  for (const area of areas.byName.get(hint) ?? []) {
    if (area.rank === CITY_OR_TOWN || area.rank === STATE_CAPITAL) {
      states.add(area.state);
    }
  }
  return states.size ? states : null;
};

/** "Wuse, Abuja" and "Bodija Ibadan" both become an area and a hint. */
const splitQuery = (areas: AreaIndex, query: string) => {
  const [first, ...rest] = query.split(',');
  const area = normalize(first);
  if (rest.length) return { area, hint: normalize(rest.join(' ')) };
  if (areas.byName.has(area)) return { area, hint: '' };
  const words = area.split(' ');
  for (let cut = words.length - 1; cut > 0; cut -= 1) {
    const hint = words.slice(cut).join(' ');
    const head = words.slice(0, cut).join(' ');
    if (areas.byName.has(head) && statesFor(areas, hint)) {
      return { area: head, hint };
    }
  }
  return { area, hint: '' };
};

/**
 * The best listed match for a typed area, or null. Outside Abuja and Lagos a
 * village only counts when `includeVillages` is set or the state was given:
 * village names repeat across states, so a lone name could be the wrong one.
 */
export function findNigerianArea(
  query: string,
  includeVillages = false,
): GeocodedPoint | null {
  const areas = loadIndex();
  const { area, hint } = splitQuery(areas, query);
  const states = hint ? statesFor(areas, hint) : null;
  if (hint && !states) return null;
  const isMetro = (match: Area) =>
    Boolean(METRO_CITIES[areas.states[match.state]]);
  const best = (areas.byName.get(area) ?? [])
    .filter((match) => !states || states.has(match.state))
    .filter(
      (match) =>
        includeVillages ||
        Boolean(hint) ||
        match.rank >= CITY_OR_TOWN ||
        isMetro(match),
    )
    .sort(
      (a, b) => b.rank - a.rank || Number(isMetro(b)) - Number(isMetro(a)),
    )[0];
  if (!best) return null;
  return {
    lat: best.lat,
    lng: best.lng,
    ...describe(areas, best.lat, best.lng, best.name, best.state),
  };
}
