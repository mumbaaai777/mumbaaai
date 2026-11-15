import type { RadioShow } from './types';

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
};

/** Current time in Mumbai (IST, UTC+05:30, no DST) as minutes since midnight + weekday. */
export function istNow(date = new Date()): { minutes: number; weekday: number; hour: number } {
  const ist = new Date(date.getTime() + (330 + date.getTimezoneOffset()) * 60000);
  return { minutes: ist.getHours() * 60 + ist.getMinutes(), weekday: ist.getDay(), hour: ist.getHours() };
}

export function isShowOnAir(show: RadioShow, now = istNow()): boolean {
  if (show.days?.length && !show.days.includes(now.weekday)) return false;
  const s = toMin(show.start_time);
  const e = toMin(show.end_time);
  return s <= e ? now.minutes >= s && now.minutes < e : now.minutes >= s || now.minutes < e; // wraps midnight
}

/** Shows sorted by broadcast-day order (starting 05:00) */
export function sortSchedule(shows: RadioShow[]): RadioShow[] {
  const dayStart = 5 * 60;
  const key = (s: RadioShow) => (toMin(s.start_time) - dayStart + 1440) % 1440;
  return [...shows].sort((a, b) => key(a) - key(b));
}

export function currentAndNext(shows: RadioShow[], now = istNow()): { current?: RadioShow; next?: RadioShow } {
  const sorted = sortSchedule(shows);
  const idx = sorted.findIndex((s) => isShowOnAir(s, now));
  if (idx === -1) return { next: sorted[0] };
  return { current: sorted[idx], next: sorted[(idx + 1) % sorted.length] };
}

export function greetingKey(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}
