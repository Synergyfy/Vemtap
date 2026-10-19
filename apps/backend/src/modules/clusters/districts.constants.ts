/**
 * The districts seeded when none exist yet, so district targeting works on a
 * fresh database. Names match the app's area picker (`AREA_COORDS` in
 * `vemtap-app/src/constants/locations.ts`), which is how a consumer's chosen
 * area becomes their home district. Admins manage them as clusters afterwards.
 */
export const DEFAULT_DISTRICTS = [
  { name: 'Apo', area: 'Apo', latitude: 9.0765, longitude: 7.5186 },
  { name: 'Wuse 2', area: 'Wuse II', latitude: 9.087, longitude: 7.4805 },
  { name: 'Maitama', area: 'Maitama', latitude: 9.1136, longitude: 7.4856 },
  { name: 'Garki', area: 'Garki', latitude: 9.0607, longitude: 7.4873 },
  { name: 'Jabi', area: 'Jabi', latitude: 9.1145, longitude: 7.4217 },
  {
    name: 'Central Business District',
    area: 'Central Business District',
    latitude: 9.0579,
    longitude: 7.4951,
  },
] as const;

/** A district covers a whole neighbourhood, not a market's few hundred metres. */
export const DEFAULT_DISTRICT_RADIUS_METERS = 2500;
