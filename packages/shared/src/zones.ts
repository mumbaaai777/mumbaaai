import type { ZoneId } from './types';

export interface Zone {
  id: ZoneId;
  /** Anchor locality used for weather/AQI lookups */
  anchor: string;
  lat: number;
  lon: number;
}

// Coordinates are a representative point inside each zone (anchor locality).
export const ZONES: Zone[] = [
  { id: 'south_mumbai', anchor: 'Fort', lat: 18.932, lon: 72.8347 },
  { id: 'western_suburbs', anchor: 'Andheri', lat: 19.1197, lon: 72.8468 },
  { id: 'central_suburbs', anchor: 'Ghatkopar', lat: 19.086, lon: 72.9081 },
  { id: 'harbour', anchor: 'Chembur', lat: 19.0522, lon: 72.9005 },
  { id: 'thane', anchor: 'Thane', lat: 19.2183, lon: 72.9781 },
  { id: 'navi_mumbai', anchor: 'Vashi', lat: 19.0771, lon: 72.9986 },
  { id: 'raigad_panvel', anchor: 'Panvel', lat: 18.9894, lon: 73.1175 },
  { id: 'vasai_virar', anchor: 'Virar', lat: 19.4559, lon: 72.8126 },
  { id: 'kalyan_dombivli', anchor: 'Kalyan', lat: 19.2403, lon: 73.1305 },
];

export const zoneById = (id: string): Zone => ZONES.find((z) => z.id === id) ?? ZONES[1];
