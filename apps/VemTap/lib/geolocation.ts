export interface GeolocationCoordinates {
  lat: number;
  lng: number;
}

export function getBrowserLocation(): Promise<GeolocationCoordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        const messages: Record<number, string> = {
          [error.PERMISSION_DENIED]: 'Location permission denied',
          [error.POSITION_UNAVAILABLE]: 'Location information is unavailable',
          [error.TIMEOUT]: 'Location request timed out',
        };
        reject(new Error(messages[error.code] || 'Unknown geolocation error'));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  });
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

export async function geocodeAddress(address: string): Promise<GeolocationCoordinates> {
  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (googleApiKey) {
    try {
      const result = await geocodeWithGoogle(address, googleApiKey);
      return result;
    } catch (err) {
      console.warn('Google Maps geocoding failed, falling back to Nominatim:', err);
    }
  }

  return geocodeWithNominatim(address);
}

async function geocodeWithGoogle(address: string, apiKey: string): Promise<GeolocationCoordinates> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== 'OK' || !data.results?.length) {
    throw new Error(`Google geocoding failed: ${data.status}`);
  }

  const { lat, lng } = data.results[0].geometry.location;
  return { lat, lng };
}

async function geocodeWithNominatim(address: string): Promise<GeolocationCoordinates> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
    { headers: { 'Accept-Language': 'en', 'User-Agent': 'VemTap/1.0' } },
  );

  if (!res.ok) {
    throw new Error(`Geocoding service returned ${res.status}`);
  }

  const data: NominatimResult[] = await res.json();

  if (!data?.length) {
    throw new Error('Could not find coordinates for this address');
  }

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
  };
}

export async function reverseGeocode(coords: GeolocationCoordinates): Promise<string> {
  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (googleApiKey) {
    try {
      return await reverseGeocodeWithGoogle(coords, googleApiKey);
    } catch (err) {
      console.warn('Google Maps reverse geocoding failed, falling back to Nominatim:', err);
    }
  }

  return reverseGeocodeWithNominatim(coords);
}

async function reverseGeocodeWithGoogle(coords: GeolocationCoordinates, apiKey: string): Promise<string> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.lat},${coords.lng}&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== 'OK' || !data.results?.length) {
    throw new Error(`Google reverse geocoding failed: ${data.status}`);
  }

  return data.results[0].formatted_address;
}

async function reverseGeocodeWithNominatim(coords: GeolocationCoordinates): Promise<string> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json&zoom=14`,
    { headers: { 'Accept-Language': 'en', 'User-Agent': 'VemTap/1.0' } },
  );

  if (!res.ok) {
    throw new Error(`Reverse geocoding service returned ${res.status}`);
  }

  const data = await res.json();

  if (!data?.display_name) {
    throw new Error('No address found for these coordinates');
  }

  return data.display_name;
}
