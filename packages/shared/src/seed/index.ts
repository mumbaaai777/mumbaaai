// Bundled seed data used when Supabase is not configured. Every record carries `sample: true`
// and the UI labels it as sample data.
import type { BusinessListing, PaperArticle, Dedication, Ad, AppUsersStat, CityAlert, Job, ListenerReport, NewsItem, RadioShow, RateCardRow, RjProfile } from '../types';
import ads from './ads.json';
import jobs from './jobs.json';
import alerts from './alerts.json';
import radioSchedule from './radio_schedule.json';
import rjProfiles from './rj_profiles.json';
import listenerReports from './listener_reports.json';
import news from './news.json';
import appUsersStats from './app_users_stats.json';
import rateCard from './rate_card.json';
import dedications from './dedications.json';
import businessListings from './business_listings.json';
import paperArticles from './paper_articles.json';

export const seed = {
  ads: ads as Ad[],
  jobs: jobs as Job[],
  alerts: alerts as CityAlert[],
  radio_schedule: radioSchedule as RadioShow[],
  rj_profiles: rjProfiles as RjProfile[],
  listener_reports: listenerReports as ListenerReport[],
  news: news as NewsItem[],
  app_users_stats: appUsersStats as AppUsersStat[],
  rate_card: rateCard as RateCardRow[],
  dedications: dedications as Dedication[],
  business_listings: businessListings as BusinessListing[],
  paper_articles: paperArticles as unknown as PaperArticle[],
};
export type SeedTables = typeof seed;
