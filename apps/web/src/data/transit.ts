// Static network dataset for Mumbai suburban rail and metro.
// Compiled from public line maps (Central/Western Railway, MMRDA, MMRCL) — station order only,
// no timings. Verify names/order against official sources before launch; new stations open often.
// Identical names across lines are treated as interchanges by the planner.

export type LineKind = 'local' | 'metro';
export type LineId = 'western' | 'central' | 'harbour' | 'trans_harbour' | 'm1' | 'm2a' | 'm3' | 'm7' | 'm2b';

export interface Branch {
  name: string; // "CSMT – Kasara"
  stations: string[];
}
export interface Line {
  id: LineId;
  kind: LineKind;
  color: string;
  branches: Branch[];
  minutesPerStop: number; // used by the sample timetable/planner
}

export const LINES: Line[] = [
  {
    id: 'western',
    kind: 'local',
    color: '#1F6FB2',
    minutesPerStop: 2.6,
    branches: [
      {
        name: 'Churchgate – Dahanu Road',
        stations: [
          'Churchgate', 'Marine Lines', 'Charni Road', 'Grant Road', 'Mumbai Central', 'Mahalaxmi', 'Lower Parel', 'Prabhadevi',
          'Dadar', 'Matunga Road', 'Mahim Jn', 'Bandra', 'Khar Road', 'Santacruz', 'Vile Parle', 'Andheri', 'Jogeshwari',
          'Ram Mandir', 'Goregaon', 'Malad', 'Kandivali', 'Borivali', 'Dahisar', 'Mira Road', 'Bhayandar', 'Naigaon',
          'Vasai Road', 'Nallasopara', 'Virar', 'Vaitarna', 'Saphale', 'Kelve Road', 'Palghar', 'Umroli', 'Boisar', 'Vangaon', 'Dahanu Road',
        ],
      },
    ],
  },
  {
    id: 'central',
    kind: 'local',
    color: '#C0392B',
    minutesPerStop: 2.7,
    branches: [
      {
        name: 'CSMT – Kasara',
        stations: [
          'CSMT', 'Masjid', 'Sandhurst Road', 'Byculla', 'Chinchpokli', 'Currey Road', 'Parel', 'Dadar', 'Matunga', 'Sion', 'Kurla',
          'Vidyavihar', 'Ghatkopar', 'Vikhroli', 'Kanjurmarg', 'Bhandup', 'Nahur', 'Mulund', 'Thane', 'Kalwa', 'Mumbra', 'Diva Jn',
          'Kopar', 'Dombivli', 'Thakurli', 'Kalyan Jn', 'Shahad', 'Ambivli', 'Titwala', 'Khadavli', 'Vasind', 'Asangaon', 'Atgaon',
          'Thansit', 'Khardi', 'Umbermali', 'Kasara',
        ],
      },
      {
        name: 'Kalyan – Khopoli',
        stations: [
          'Kalyan Jn', 'Vithalwadi', 'Ulhasnagar', 'Ambernath', 'Badlapur', 'Vangani', 'Shelu', 'Neral', 'Bhivpuri Road', 'Karjat',
          'Palasdhari', 'Kelavli', 'Dolavli', 'Lowjee', 'Khopoli',
        ],
      },
    ],
  },
  {
    id: 'harbour',
    kind: 'local',
    color: '#7D3C98',
    minutesPerStop: 2.6,
    branches: [
      {
        name: 'CSMT – Panvel',
        stations: [
          'CSMT', 'Masjid', 'Sandhurst Road', 'Dockyard Road', 'Reay Road', 'Cotton Green', 'Sewri', 'Vadala Road', 'GTB Nagar',
          'Chunabhatti', 'Kurla', 'Tilak Nagar', 'Chembur', 'Govandi', 'Mankhurd', 'Vashi', 'Sanpada', 'Juinagar', 'Nerul',
          'Seawoods–Darave', 'Belapur CBD', 'Kharghar', 'Mansarovar', 'Khandeshwar', 'Panvel',
        ],
      },
      {
        name: 'Vadala Road – Goregaon',
        stations: ['Vadala Road', "King's Circle", 'Mahim Jn', 'Bandra', 'Khar Road', 'Santacruz', 'Vile Parle', 'Andheri', 'Jogeshwari', 'Ram Mandir', 'Goregaon'],
      },
    ],
  },
  {
    id: 'trans_harbour',
    kind: 'local',
    color: '#16A085',
    minutesPerStop: 2.8,
    branches: [
      {
        name: 'Thane – Panvel',
        stations: ['Thane', 'Digha Gaon', 'Airoli', 'Rabale', 'Ghansoli', 'Kopar Khairane', 'Turbhe', 'Juinagar', 'Nerul', 'Seawoods–Darave', 'Belapur CBD', 'Kharghar', 'Mansarovar', 'Khandeshwar', 'Panvel'],
      },
      { name: 'Turbhe – Vashi', stations: ['Turbhe', 'Sanpada', 'Vashi'] },
    ],
  },
  {
    id: 'm1',
    kind: 'metro',
    color: '#2E86C1',
    minutesPerStop: 2,
    branches: [
      {
        name: 'Versova – Ghatkopar',
        stations: ['Versova', 'D N Nagar', 'Azad Nagar', 'Andheri', 'Western Express Highway', 'Chakala (J B Nagar)', 'Airport Road', 'Marol Naka', 'Saki Naka', 'Asalpha', 'Jagruti Nagar', 'Ghatkopar'],
      },
    ],
  },
  {
    id: 'm2a',
    kind: 'metro',
    color: '#D4AC0D',
    minutesPerStop: 2,
    branches: [
      {
        name: 'Dahisar East – Andheri West',
        stations: [
          'Dahisar East', 'Anand Nagar', 'Kandarpada', 'Mandapeshwar', 'Eksar', 'Borivali West', 'Pahadi Eksar', 'Kandivali West',
          'Dahanukarwadi', 'Valnai–Meeth Chowky', 'Malad West', 'Lower Malad', 'Bangur Nagar', 'Goregaon West', 'Oshiwara', 'Lower Oshiwara', 'Andheri West',
        ],
      },
    ],
  },
  {
    id: 'm3',
    kind: 'metro',
    color: '#17A2B8',
    minutesPerStop: 2.2,
    branches: [
      {
        name: 'Aarey JVLR – Cuffe Parade',
        stations: [
          'Aarey JVLR', 'SEEPZ', 'MIDC Andheri', 'Marol Naka', 'CSMIA T2', 'Sahar Road', 'CSMIA T1', 'Santacruz Metro', 'Bandra Colony',
          'BKC', 'Dharavi', 'Shitaladevi Mandir', 'Dadar', 'Siddhivinayak', 'Worli', 'Acharya Atre Chowk', 'Science Museum', 'Mahalaxmi',
          'Mumbai Central', 'Grant Road', 'Girgaon', 'Kalbadevi', 'CSMT', 'Hutatma Chowk', 'Churchgate', 'Vidhan Bhavan', 'Cuffe Parade',
        ],
      },
    ],
  },
  {
    id: 'm7',
    kind: 'metro',
    color: '#E74C3C',
    minutesPerStop: 2,
    branches: [
      {
        name: 'Gundavali – Kashigaon (Line 7 + 9)',
        stations: ['Gundavali', 'Mogra', 'Jogeshwari East', 'Goregaon East', 'Aarey', 'Dindoshi', 'Kurar', 'Akurli', 'Poisar', 'Magathane', 'Devipada', 'Rashtriya Udyan', 'Ovaripada', 'Dahisar East', 'Pandurang Wadi', 'Miragaon', 'Kashigaon'],
      },
    ],
  },
  {
    id: 'm2b',
    kind: 'metro',
    color: '#B7950B',
    minutesPerStop: 2.2,
    branches: [{ name: 'Diamond Garden – Mandale (Phase 1)', stations: ['Diamond Garden', 'Shivaji Chowk', 'BSNL Metro', 'Mankhurd', 'Mandale'] }],
  },
];

/** Short walking interchanges between differently-named stations. */
export const WALK_LINKS: [string, string, number][] = [
  ['D N Nagar', 'Andheri West', 6],
  ['Western Express Highway', 'Gundavali', 5],
  ['Chembur', 'Diamond Garden', 12],
];

export const ALL_STATIONS: string[] = [...new Set(LINES.flatMap((l) => l.branches.flatMap((b) => b.stations)))].sort((a, b) => a.localeCompare(b));

export const stationLines = (name: string): LineId[] => LINES.filter((l) => l.branches.some((b) => b.stations.includes(name))).map((l) => l.id);

// Google Maps traffic-layer deep links (data=!5m1!1e1 turns on the traffic layer) for major corridors.
export const CORRIDORS: { name: string; lat: number; lon: number; zoom: number }[] = [
  { name: 'Western Express Highway (WEH)', lat: 19.135, lon: 72.856, zoom: 13 },
  { name: 'Eastern Express Highway (EEH)', lat: 19.125, lon: 72.935, zoom: 13 },
  { name: 'Jogeshwari–Vikhroli Link Road (JVLR)', lat: 19.128, lon: 72.895, zoom: 14 },
  { name: 'Santacruz–Chembur Link Road (SCLR)', lat: 19.07, lon: 72.875, zoom: 14 },
  { name: 'Sion–Panvel Highway', lat: 19.05, lon: 73.01, zoom: 12 },
  { name: 'Atal Setu (MTHL)', lat: 18.97, lon: 72.94, zoom: 12 },
  { name: 'Mumbai Coastal Road', lat: 18.975, lon: 72.808, zoom: 13 },
];
export const mapsTrafficUrl = (c: { lat: number; lon: number; zoom: number }) => `https://www.google.com/maps/@${c.lat},${c.lon},${c.zoom}z/data=!5m1!1e1`;
