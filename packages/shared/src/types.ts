// Shared domain types. Mirrors supabase/schema.sql — keep the two in sync.

export const AD_CATEGORIES = [
  'real_estate',
  'retail',
  'education',
  'food',
  'jobs',
  'healthcare',
  'auto',
  'events',
  'other',
] as const;
export type AdCategory = (typeof AD_CATEGORIES)[number];

export const AD_PLACEMENTS = [
  'home_banner',
  'feed_card',
  'radio_preroll_audio',
  'jobs_sponsored',
  'ask_aai_sponsored',
] as const;
export type AdPlacement = (typeof AD_PLACEMENTS)[number];

export const PRICING_MODELS = ['cpm', 'cpc', 'flat_daily'] as const;
export type PricingModel = (typeof PRICING_MODELS)[number];

export const AD_STATUSES = ['draft', 'active', 'paused', 'ended'] as const;
export type AdStatus = (typeof AD_STATUSES)[number];

export const ZONE_IDS = [
  'south_mumbai',
  'western_suburbs',
  'central_suburbs',
  'harbour',
  'thane',
  'navi_mumbai',
  'raigad_panvel',
  'vasai_virar',
  'kalyan_dombivli',
] as const;
export type ZoneId = (typeof ZONE_IDS)[number];

export interface Ad {
  id: string;
  advertiser: string;
  category: AdCategory;
  title: string;
  body?: string | null;
  cta?: string | null;
  image_url?: string | null;
  link: string;
  placement: AdPlacement;
  zones: ZoneId[]; // empty = all zones
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  budget_inr: number;
  pricing_model: PricingModel;
  rate_inr?: number | null; // price per unit for the pricing model (per 1000 imp, per click, per day)
  status: AdStatus;
  impressions: number;
  clicks: number;
  created_at?: string;
  sample?: boolean;
}

export const JOB_TYPES = ['full_time', 'part_time', 'contract', 'internship', 'gig'] as const;
export type JobType = (typeof JOB_TYPES)[number];

export interface Job {
  id: string;
  title: string;
  company: string;
  zone: ZoneId;
  locality?: string | null;
  job_type: JobType;
  salary_min_inr?: number | null; // per month
  salary_max_inr?: number | null;
  description?: string | null;
  whatsapp_number: string; // E.164 without + e.g. 919800000000
  sponsored: boolean;
  status: 'active' | 'closed' | 'draft';
  posted_at: string;
  sample?: boolean;
}

export type AlertSeverity = 'info' | 'warning' | 'critical';
export interface CityAlert {
  id: string;
  title: string;
  body?: string | null;
  severity: AlertSeverity;
  kind: 'waterlogging' | 'traffic' | 'train' | 'weather' | 'civic' | 'other';
  zones: ZoneId[]; // empty = all
  starts_at: string;
  ends_at?: string | null;
  active: boolean;
  sample?: boolean;
}

export interface RadioShow {
  id: string;
  title: string;
  description?: string | null;
  rj_id?: string | null;
  rj_name?: string | null;
  start_time: string; // HH:MM, IST
  end_time: string; // HH:MM, IST (may wrap past midnight)
  language: 'en' | 'hi' | 'mr' | 'mixed';
  days: number[]; // 0=Sun..6=Sat; empty = daily
  sort_order?: number;
  sample?: boolean;
}

export interface RjProfile {
  id: string;
  name: string;
  bio?: string | null;
  photo_url?: string | null;
  languages: string[];
  instagram?: string | null;
  active: boolean;
  sample?: boolean;
}

export type ReportKind = 'traffic' | 'train' | 'waterlogging' | 'other';
export type ModerationStatus = 'pending' | 'approved' | 'rejected';
export interface ListenerReport {
  id: string;
  kind: ReportKind;
  zone: ZoneId;
  location: string;
  line?: string | null; // e.g. western, central, harbour, trans_harbour
  message: string;
  reporter_name?: string | null;
  status: ModerationStatus;
  created_at: string;
  sample?: boolean;
}

export const DEDICATION_KINDS = ['farmaish', 'birthday', 'anniversary', 'congrats', 'other'] as const;
export type DedicationKind = (typeof DEDICATION_KINDS)[number];
export const DEDICATION_STATUSES = ['pending', 'approved', 'scheduled', 'aired', 'rejected'] as const;
export type DedicationStatus = (typeof DEDICATION_STATUSES)[number];
/** A listener's song request + message (Aap Ki Farmaish / Celebrations). */
export interface Dedication {
  id: string;
  kind: DedicationKind;
  from_name: string;
  from_area?: string | null;
  to_name: string;
  song: string; // song title / film / artist as the listener typed it
  message: string;
  show_pref?: string | null; // preferred show title
  phone?: string | null; // never shown publicly
  status: DedicationStatus;
  air_at?: string | null; // ISO, set by RJ when scheduled
  rj_note?: string | null;
  created_at: string;
  sample?: boolean;
}

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  source: string;
  published_at?: string | null;
  pinned?: boolean;
  sample?: boolean;
}

export interface NewsOverride {
  id: string;
  url: string;
  action: 'pin' | 'hide';
  title?: string | null;
  source?: string | null;
  created_at?: string;
}

export interface AppUsersStat {
  day: string; // YYYY-MM-DD
  daily_active_users: number;
  new_installs: number;
  radio_listeners: number;
  ask_aai_queries: number;
  sample?: boolean;
}

export interface RateCardRow {
  id: string;
  placement: AdPlacement;
  pricing_model: PricingModel;
  price_inr: number;
  notes?: string | null;
}

export type Lang = 'en' | 'hi' | 'mr';
