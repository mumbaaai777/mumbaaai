// Mumbai suburban rail route finder (Western, Central, Harbour, Trans-Harbour).
// Station order is fixed data; the route is computed, never guessed by the AI.

interface LineDef { id: string; name: string; stations: string[] }

const CR_CORE = ['CSMT', 'Masjid', 'Sandhurst Road', 'Byculla', 'Chinchpokli', 'Currey Road', 'Parel', 'Dadar', 'Matunga', 'Sion', 'Kurla', 'Vidyavihar', 'Ghatkopar', 'Vikhroli', 'Kanjurmarg', 'Bhandup', 'Nahur', 'Mulund', 'Thane', 'Kalwa', 'Mumbra', 'Diva', 'Kopar', 'Dombivli', 'Thakurli', 'Kalyan'];
const HR_SOUTH = ['CSMT', 'Masjid', 'Sandhurst Road', 'Dockyard Road', 'Reay Road', 'Cotton Green', 'Sewri', 'Wadala Road'];
const HR_EAST = ['GTB Nagar', 'Chunabhatti', 'Kurla', 'Tilak Nagar', 'Chembur', 'Govandi', 'Mankhurd', 'Vashi', 'Sanpada', 'Juinagar', 'Nerul', 'Seawoods-Darave', 'Belapur CBD', 'Kharghar', 'Manasarovar', 'Khandeshwar', 'Panvel'];
const HR_WEST = ["King's Circle", 'Mahim', 'Bandra', 'Khar Road', 'Santacruz', 'Vile Parle', 'Andheri', 'Jogeshwari', 'Ram Mandir', 'Goregaon'];
// Through-running services, so a direct train is never split into two legs.
const LINES: LineDef[] = [
  { id: 'WR', name: 'Western line', stations: ['Churchgate', 'Marine Lines', 'Charni Road', 'Grant Road', 'Mumbai Central', 'Mahalaxmi', 'Lower Parel', 'Prabhadevi', 'Dadar', 'Matunga Road', 'Mahim', 'Bandra', 'Khar Road', 'Santacruz', 'Vile Parle', 'Andheri', 'Jogeshwari', 'Ram Mandir', 'Goregaon', 'Malad', 'Kandivali', 'Borivali', 'Dahisar', 'Mira Road', 'Bhayandar', 'Naigaon', 'Vasai Road', 'Nallasopara', 'Virar'] },
  { id: 'CRK', name: 'Central line', stations: [...CR_CORE, 'Vithalwadi', 'Ulhasnagar', 'Ambernath', 'Badlapur', 'Vangani', 'Shelu', 'Neral', 'Bhivpuri Road', 'Karjat'] },
  { id: 'CRX', name: 'Central line', stations: [...CR_CORE, 'Shahad', 'Ambivli', 'Titwala', 'Khadavli', 'Vasind', 'Asangaon', 'Atgaon', 'Thansit', 'Khardi', 'Umbermali', 'Kasara'] },
  { id: 'HR', name: 'Harbour line', stations: [...HR_SOUTH, ...HR_EAST] },
  { id: 'HRG', name: 'Harbour line', stations: [...HR_SOUTH, ...HR_WEST] },
  { id: 'HRP', name: 'Harbour line', stations: [...[...HR_WEST].reverse(), 'Wadala Road', ...HR_EAST] },
  { id: 'TH', name: 'Trans-Harbour line', stations: ['Thane', 'Airoli', 'Rabale', 'Ghansoli', 'Kopar Khairane', 'Turbhe', 'Sanpada', 'Vashi'] },
  { id: 'THP', name: 'Trans-Harbour line', stations: ['Thane', 'Airoli', 'Rabale', 'Ghansoli', 'Kopar Khairane', 'Turbhe', 'Juinagar', 'Nerul', 'Seawoods-Darave', 'Belapur CBD', 'Kharghar', 'Manasarovar', 'Khandeshwar', 'Panvel'] },
];

// Usual platforms where well established; anything else: check the station indicator boards.
const PLATFORMS: Record<string, string> = {
  'Harbour line|CSMT': '1 or 2',
  'Harbour line|Kurla': '7 or 8',
  'Trans-Harbour line|Thane': '9 or 10',
};

const ALIASES: Record<string, string> = {
  'cst': 'CSMT', 'vt': 'CSMT', 'victoria terminus': 'CSMT', 'chhatrapati shivaji maharaj terminus': 'CSMT', 'chhatrapati shivaji terminus': 'CSMT',
  'chinchpokali': 'Chinchpokli', 'chinchpokle': 'Chinchpokli', 'currey rd': 'Currey Road', 'curry road': 'Currey Road',
  'bombay central': 'Mumbai Central', 'elphinstone road': 'Prabhadevi', 'elphinstone': 'Prabhadevi', 'santa cruz': 'Santacruz',
  'vileparle': 'Vile Parle', 'parle': 'Vile Parle', 'vasai': 'Vasai Road', 'nala sopara': 'Nallasopara', 'bhayander': 'Bhayandar',
  'kanjur marg': 'Kanjurmarg', 'kings circle': "King's Circle", 'wadala': 'Wadala Road', 'belapur': 'Belapur CBD', 'cbd belapur': 'Belapur CBD',
  'seawoods': 'Seawoods-Darave', 'kopar khairne': 'Kopar Khairane', 'koparkhairane': 'Kopar Khairane', 'sandhurst rd': 'Sandhurst Road',
  'dockyard rd': 'Dockyard Road', 'reay rd': 'Reay Road', 'guru tegh bahadur nagar': 'GTB Nagar', 'mansarovar': 'Manasarovar',
  // Devanagari (Hindi/Marathi)
  'दादर': 'Dadar', 'कुर्ला': 'Kurla', 'वाशी': 'Vashi', 'ठाणे': 'Thane', 'पनवेल': 'Panvel', 'अंधेरी': 'Andheri', 'बोरीवली': 'Borivali', 'बोरिवली': 'Borivali',
  'चिंचपोकळी': 'Chinchpokli', 'चिंचपोकली': 'Chinchpokli', 'चर्चगेट': 'Churchgate', 'कल्याण': 'Kalyan', 'डोंबिवली': 'Dombivli', 'घाटकोपर': 'Ghatkopar',
  'बांद्रा': 'Bandra', 'वांद्रे': 'Bandra', 'विरार': 'Virar', 'नेरुळ': 'Nerul', 'नेरूल': 'Nerul', 'सायन': 'Sion', 'शीव': 'Sion', 'चेंबूर': 'Chembur',
  'मुलुंड': 'Mulund', 'भायखळा': 'Byculla', 'भायखला': 'Byculla', 'गोरेगांव': 'Goregaon', 'गोरेगाव': 'Goregaon', 'मालाड': 'Malad', 'वडाळा': 'Wadala Road',
};

const ALL = Array.from(new Set(LINES.flatMap((l) => l.stations)));
const NAMES: [string, string][] = [
  ...ALL.map((s) => [s.toLowerCase(), s] as [string, string]),
  ...Object.entries(ALIASES),
].sort((a, b) => b[0].length - a[0].length);

/** Finds "from X ... to Y" in free text. Returns null unless two different stations are found. */
export function findStations(text: string): { from: string; to: string } | null {
  let t = ' ' + text.toLowerCase().replace(/[?.,!]/g, ' ') + ' ';
  const hits: { name: string; pos: number }[] = [];
  for (const [alias, name] of NAMES) {
    const re = new RegExp(`(^|[\\s(])${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=[\\s)]|से|हून|ला|पासून|$)`, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(t))) {
      hits.push({ name, pos: m.index });
      t = t.slice(0, m.index + 1) + ' '.repeat(alias.length) + t.slice(m.index + 1 + alias.length);
    }
  }
  const uniq = hits.sort((a, b) => a.pos - b.pos).filter((h, i, a) => a.findIndex((x) => x.name === h.name) === i);
  if (uniq.length < 2) return null;
  const [a, b] = uniq;
  const lower = text.toLowerCase();
  const fromIdx = lower.search(/\bfrom\b/);
  // "reach Vashi from Chinchpokli": the station after "from" is the origin
  if (fromIdx >= 0 && b.pos > fromIdx && a.pos < fromIdx) return { from: b.name, to: a.name };
  return { from: a.name, to: b.name };
}

export interface RailLeg { line: string; board: string; alight: string; towards: string; stops: string[]; platform?: string }
export interface RailRoute { from: string; to: string; legs: RailLeg[]; totalStops: number }

/** Fewest stops, with each change of train costing 4 stops. */
export function findRoute(from: string, to: string): RailRoute | null {
  type State = { st: string; line: string; dir: number; idx: number };
  const key = (s: State) => `${s.st}|${s.line}|${s.dir}`;
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const states = new Map<string, State>();
  const queue: [number, State][] = [];
  for (const l of LINES) {
    const i = l.stations.indexOf(from);
    if (i < 0) continue;
    for (const dir of [1, -1]) {
      const s = { st: from, line: l.id, dir, idx: i };
      dist.set(key(s), 0); prev.set(key(s), null); states.set(key(s), s); queue.push([0, s]);
    }
  }
  let end: State | null = null;
  while (queue.length) {
    queue.sort((a, b) => a[0] - b[0]);
    const [d, s] = queue.shift()!;
    if (d > (dist.get(key(s)) ?? Infinity)) continue;
    if (s.st === to) { end = s; break; }
    const line = LINES.find((l) => l.id === s.line)!;
    const next: [State, number][] = [];
    const ni = s.idx + s.dir;
    if (ni >= 0 && ni < line.stations.length) next.push([{ st: line.stations[ni], line: s.line, dir: s.dir, idx: ni }, 1]);
    for (const l of LINES) {
      const i = l.stations.indexOf(s.st);
      if (i < 0) continue;
      for (const dir of [1, -1]) if (l.id !== s.line || dir !== s.dir) next.push([{ st: s.st, line: l.id, dir, idx: i }, l.id === s.line ? 99 : 4]);
    }
    for (const [n, c] of next) {
      const nd = d + c;
      if (nd < (dist.get(key(n)) ?? Infinity)) {
        dist.set(key(n), nd); prev.set(key(n), key(s)); states.set(key(n), n); queue.push([nd, n]);
      }
    }
  }
  if (!end) return null;
  const path: State[] = [];
  for (let k: string | null = key(end); k; k = prev.get(k) ?? null) path.unshift(states.get(k)!);
  const legs: RailLeg[] = [];
  let cur: State[] = [];
  const flush = () => {
    if (cur.length < 2) return;
    const l = LINES.find((x) => x.id === cur[0].line)!;
    const down = cur[0].dir > 0;
    const alight = cur[cur.length - 1].st;
    let towards = down ? l.stations[l.stations.length - 1] : l.stations[0];
    if (l.name === 'Central line' && down) towards = CR_CORE.includes(alight) ? 'Kalyan / Thane (any slow local)' : l.id === 'CRK' ? 'Karjat, Badlapur or Ambernath' : 'Kasara or Titwala';
    if (l.id === 'HRP') towards = down ? 'Panvel' : 'Andheri / Goregaon';
    legs.push({ line: l.name, board: cur[0].st, alight, towards, stops: cur.slice(1, -1).map((s) => s.st), platform: PLATFORMS[`${l.name}|${cur[0].st}`] });
  };
  for (const s of path) {
    if (cur.length && (s.line !== cur[0].line || s.dir !== cur[0].dir)) { flush(); cur = []; }
    cur.push(s);
  }
  flush();
  const merged = legs;
  return { from, to, legs: merged, totalStops: merged.reduce((n, l) => n + l.stops.length + 1, 0) };
}

/** Plain-text route facts for the AI prompt. */
export function routeFacts(r: RailRoute): string {
  return r.legs
    .map((l, i) => `Leg ${i + 1}: ${l.line} from ${l.board} to ${l.alight}, train towards ${l.towards}, ${l.stops.length + 1} stop${l.stops.length ? 's' : ''}${l.platform ? `, usually platform ${l.platform} at ${l.board}` : ''}. Stations in between: ${l.stops.join(', ') || 'none'}.`)
    .join('\n') + (r.legs.length > 1 ? `\nChange train at: ${r.legs.slice(0, -1).map((l) => l.alight).join(', ')}.` : '');
}
