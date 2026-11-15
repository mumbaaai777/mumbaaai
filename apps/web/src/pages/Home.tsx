import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper } from 'lucide-react';
import { greetingKey, istNow } from '@mumbaaai/shared';
import { useI18n } from '../lib/i18n';
import { Page, Stagger, Item, LetterReveal } from '../components/motion';
import { ZonePicker } from '../components/ZonePicker';
import { WeatherCard } from '../components/WeatherCard';
import { AlertsBanner } from '../components/AlertsBanner';
import { MiniPlayer } from '../components/MiniPlayer';
import { NewsList } from '../components/NewsList';
import { AdSlot } from '../components/AdSlot';

export default function Home() {
  const { t, locale } = useI18n();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const g = t.greeting[greetingKey(istNow(now).hour)];
  const dateLine = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata' }).format(now);

  return (
    <Page>
      <section className="pb-5 pt-6 md:pt-10">
        <p className="eyebrow mb-2">{dateLine}</p>
        <h1 className="text-[2.15rem] font-semibold leading-[1.1] tracking-tight text-ink md:text-5xl">
          <LetterReveal text={g} />
        </h1>
        <p className="mt-2 text-[15px] text-muted">{t.greeting.sub}</p>
      </section>

      <Stagger className="grid gap-5 md:grid-cols-[1.15fr_1fr] md:gap-6">
        <Item className="md:col-span-2">
          <ZonePicker />
        </Item>
        <Item className="md:col-span-2">
          <AlertsBanner />
        </Item>
        <Item className="space-y-5">
          <WeatherCard />
          <MiniPlayer />
          <AdSlot placement="home_banner" variant="banner" />
        </Item>
        <Item className="space-y-5">
          <Link to="/paper" className="card flex items-center gap-4 p-4 transition hover:-translate-y-0.5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-navy text-marigold"><Newspaper size={24} /></span>
            <span className="min-w-0 flex-1">
              <span className="eyebrow">{t.paper.today}</span>
              <span className="block text-lg font-bold text-ink" style={{ fontFamily: 'Georgia, "Noto Serif Devanagari", serif' }}>{t.paper.title}</span>
              <span className="block text-sm text-muted">{t.paper.cta}</span>
            </span>
            <span className="text-2xl text-marigold-ink">→</span>
          </Link>
          <NewsList limit={8} />
        </Item>
      </Stagger>
    </Page>
  );
}
