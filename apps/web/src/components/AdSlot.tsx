import { AdCard, eligibleAds, pickAd, type Ad, type AdPlacement } from '@mumbaaai/shared';
import { useTable } from '../lib/content';
import { useZone } from '../lib/zone';
import { useI18n } from '../lib/i18n';
import { trackClick, useImpression } from '../lib/adTracking';

/** Renders one eligible ad for a placement in the user's zone, with impression/click tracking. */
export function AdSlot({ placement, variant = 'card', index = 0, className }: { placement: AdPlacement; variant?: 'banner' | 'card'; index?: number; className?: string }) {
  const { zone } = useZone();
  const { t } = useI18n();
  const { rows } = useTable<Ad>('ads');
  const ad = pickAd(eligibleAds(rows ?? [], placement, zone), Math.floor(Date.now() / 600000) + index);
  const ref = useImpression<HTMLDivElement>(ad?.id);
  if (!ad) return null;
  return (
    <div ref={ref} className={className} data-ad-id={ad.id} data-placement={placement}>
      <AdCard ad={ad} label={t.ads.label} variant={variant} onClick={() => trackClick(ad.id, ad.link)} />
    </div>
  );
}
