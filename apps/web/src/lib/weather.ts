// Open-Meteo (free, no key): https://open-meteo.com — forecast + air-quality APIs.
import type { Zone } from '@mumbaaai/shared';

export interface HourPoint {
  time: string; // local ISO (Asia/Kolkata)
  temp: number;
  rainProb: number;
  code: number;
}
export interface WeatherNow {
  temp: number;
  feelsLike: number;
  humidity: number;
  wind: number;
  code: number;
  precipitation: number;
  time: string;
  hours: HourPoint[];
  maxRainProb: number; // max over next 12 h
}
export interface AirNow {
  usAqi: number;
  pm25: number;
  time: string;
}

const cache = new Map<string, { at: number; data: unknown }>();
async function cachedJson<T>(url: string, ttlMs = 10 * 60 * 1000): Promise<T> {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < ttlMs) return hit.data as T;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as T;
  cache.set(url, { at: Date.now(), data });
  return data;
}

export async function getWeather(z: Zone): Promise<WeatherNow> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${z.lat}&longitude=${z.lon}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,precipitation` +
    `&hourly=temperature_2m,precipitation_probability,weather_code&forecast_days=2&timezone=Asia%2FKolkata`;
  type R = {
    current: { time: string; temperature_2m: number; apparent_temperature: number; relative_humidity_2m: number; weather_code: number; wind_speed_10m: number; precipitation: number };
    hourly: { time: string[]; temperature_2m: number[]; precipitation_probability: (number | null)[]; weather_code: number[] };
  };
  const r = await cachedJson<R>(url);
  if (!r.current || !r.hourly) throw new Error('Weather unavailable');
  const nowHour = r.current.time.slice(0, 13); // "YYYY-MM-DDTHH"
  const start = Math.max(0, r.hourly.time.findIndex((t) => t.slice(0, 13) === nowHour));
  const hours: HourPoint[] = r.hourly.time.slice(start, start + 24).map((time, i) => ({
    time,
    temp: r.hourly.temperature_2m[start + i],
    rainProb: r.hourly.precipitation_probability[start + i] ?? 0,
    code: r.hourly.weather_code[start + i],
  }));
  return {
    temp: r.current.temperature_2m,
    feelsLike: r.current.apparent_temperature,
    humidity: r.current.relative_humidity_2m,
    wind: r.current.wind_speed_10m,
    code: r.current.weather_code,
    precipitation: r.current.precipitation,
    time: r.current.time,
    hours,
    maxRainProb: Math.max(0, ...hours.slice(0, 12).map((h) => h.rainProb)),
  };
}

export async function getAir(z: Zone): Promise<AirNow> {
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${z.lat}&longitude=${z.lon}&current=us_aqi,pm2_5&timezone=Asia%2FKolkata`;
  const r = await cachedJson<{ current?: { time: string; us_aqi: number | null; pm2_5: number | null } }>(url);
  if (!r.current || typeof r.current.us_aqi !== 'number') throw new Error('AQI unavailable');
  return { usAqi: r.current.us_aqi, pm25: r.current.pm2_5 ?? NaN, time: r.current.time };
}

export type CodeKey = 'clear' | 'partly' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'heavyRain' | 'thunder';
/** WMO weather code → label key */
export function codeKey(code: number): CodeKey {
  if (code === 0) return 'clear';
  if (code <= 2) return 'partly';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code === 65 || code === 67 || code === 82) return 'heavyRain';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 81)) return 'rain';
  if (code >= 95) return 'thunder';
  return 'cloudy';
}

export type AqiKey = 'aqiGood' | 'aqiModerate' | 'aqiSensitive' | 'aqiUnhealthy' | 'aqiVeryUnhealthy' | 'aqiHazardous';
export function aqiBand(v: number): { key: AqiKey; color: string } {
  if (v <= 50) return { key: 'aqiGood', color: '#3E9B5F' };
  if (v <= 100) return { key: 'aqiModerate', color: '#D9A400' };
  if (v <= 150) return { key: 'aqiSensitive', color: '#E07A2F' };
  if (v <= 200) return { key: 'aqiUnhealthy', color: '#D64545' };
  if (v <= 300) return { key: 'aqiVeryUnhealthy', color: '#8D4A9F' };
  return { key: 'aqiHazardous', color: '#7A1F2B' };
}
