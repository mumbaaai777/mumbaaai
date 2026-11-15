// Station-to-station planner over the static network, with a SAMPLE frequency-based timetable.
// It is not an official timetable: headways and run times are typical values for illustration.
import { LINES, WALK_LINKS, type LineId } from '../data/transit';
import { istNow } from '@mumbaaai/shared';

const TRANSFER_MIN = 6;

export interface Segment {
  line: LineId | 'walk';
  from: string;
  to: string;
  stops: number;
  minutes: number;
  towards: string; // terminal in the direction of travel
}
export interface Plan {
  segments: Segment[];
  totalMinutes: number;
}

type Node = string; // `${station}|${line}|${branchIdx}`
interface Edge {
  to: Node;
  cost: number;
  stop: boolean;
}

const graph = new Map<Node, Edge[]>();
const add = (a: Node, b: Node, cost: number, stop: boolean) => {
  if (!graph.has(a)) graph.set(a, []);
  graph.get(a)!.push({ to: b, cost, stop });
};
const byStation = new Map<string, Node[]>();

for (const line of LINES) {
  line.branches.forEach((br, bi) => {
    br.stations.forEach((s, i) => {
      const n = `${s}|${line.id}|${bi}`;
      byStation.set(s, [...(byStation.get(s) ?? []), n]);
      if (i > 0) {
        const prev = `${br.stations[i - 1]}|${line.id}|${bi}`;
        add(prev, n, line.minutesPerStop, true);
        add(n, prev, line.minutesPerStop, true);
      }
    });
  });
}
// interchanges at same-named stations (including between branches of one line)
for (const nodes of byStation.values()) {
  for (const a of nodes) for (const b of nodes) if (a !== b) add(a, b, a.split('|')[1] === b.split('|')[1] ? 2 : TRANSFER_MIN, false);
}
for (const [x, y, m] of WALK_LINKS) {
  for (const a of byStation.get(x) ?? []) for (const b of byStation.get(y) ?? []) {
    add(a, b, m + TRANSFER_MIN, false);
    add(b, a, m + TRANSFER_MIN, false);
  }
}

export function planRoute(from: string, to: string): Plan | null {
  if (!from || !to || from === to) return null;
  const starts = byStation.get(from) ?? [];
  const goals = new Set(byStation.get(to) ?? []);
  const dist = new Map<Node, number>();
  const prev = new Map<Node, Node>();
  const queue: [number, Node][] = [];
  for (const s of starts) {
    dist.set(s, 0);
    queue.push([0, s]);
  }
  let goal: Node | undefined;
  while (queue.length) {
    queue.sort((a, b) => a[0] - b[0]);
    const [d, n] = queue.shift()!;
    if (d > (dist.get(n) ?? Infinity)) continue;
    if (goals.has(n)) {
      goal = n;
      break;
    }
    for (const e of graph.get(n) ?? []) {
      const nd = d + e.cost;
      if (nd < (dist.get(e.to) ?? Infinity)) {
        dist.set(e.to, nd);
        prev.set(e.to, n);
        queue.push([nd, e.to]);
      }
    }
  }
  if (!goal) return null;
  const path: Node[] = [];
  for (let n: Node | undefined = goal; n; n = prev.get(n)) path.unshift(n);

  const segments: Segment[] = [];
  let i = 0;
  while (i < path.length - 1) {
    const [s0, l0, b0] = path[i].split('|');
    let j = i;
    while (j + 1 < path.length) {
      const [, l1, b1] = path[j + 1].split('|');
      if (l1 !== l0 || b1 !== b0) break;
      j++;
    }
    if (j === i) {
      // transfer/walk hop
      const [s1] = path[i + 1].split('|');
      if (s1 !== s0) segments.push({ line: 'walk', from: s0, to: s1, stops: 0, minutes: WALK_LINKS.find((w) => w.includes(s0) && w.includes(s1))?.[2] ?? 5, towards: s1 });
      i++;
      continue;
    }
    const [s1] = path[j].split('|');
    const line = LINES.find((l) => l.id === l0)!;
    const br = line.branches[Number(b0)];
    const forward = br.stations.indexOf(s1) > br.stations.indexOf(s0);
    segments.push({
      line: l0 as LineId,
      from: s0,
      to: s1,
      stops: j - i,
      minutes: Math.round((j - i) * line.minutesPerStop),
      towards: forward ? br.stations[br.stations.length - 1] : br.stations[0],
    });
    i = j;
  }
  const rides = segments.filter((s) => s.line !== 'walk');
  const transfers = Math.max(0, rides.length - 1);
  return { segments, totalMinutes: segments.reduce((a, s) => a + s.minutes, 0) + transfers * TRANSFER_MIN };
}

/** SAMPLE departures: typical headways, not an official timetable. Returns HH:MM strings (IST). */
export function sampleDepartures(line: LineId, station: string, count = 3): string[] {
  const isMetro = line.startsWith('m');
  const { minutes } = istNow();
  const peak = (minutes >= 7 * 60 && minutes < 11 * 60) || (minutes >= 17 * 60 && minutes < 21 * 60);
  const headway = isMetro ? (peak ? 5 : 8) : peak ? 4 : 8;
  const startOfService = isMetro ? 5 * 60 + 30 : 4 * 60;
  const endOfService = isMetro ? 23 * 60 + 30 : 25 * 60; // locals run to ~1 am
  const offset = [...station].reduce((a, c) => a + c.charCodeAt(0), 0) % headway;
  const out: string[] = [];
  let t = minutes < startOfService && minutes >= 60 ? startOfService : minutes + 1;
  while (out.length < count && t < endOfService + 24 * 60) {
    const m = ((t % 1440) + 1440) % 1440;
    const inService = isMetro ? m >= startOfService && m <= endOfService : m >= startOfService || m < 60;
    if (inService && (t - offset) % headway === 0) out.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
    t++;
  }
  return out;
}
