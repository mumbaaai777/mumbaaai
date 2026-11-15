import { ZONES } from '@mumbaaai/shared';
import { MapPin } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { useZone } from '../lib/zone';
import { Chip } from './ui';

export function ZonePicker() {
  const { t } = useI18n();
  const { zone, setZone } = useZone();
  return (
    <div>
      <p className="eyebrow mb-2 flex items-center gap-1.5">
        <MapPin size={12} strokeWidth={2} /> {t.zones.label}
      </p>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
        {ZONES.map((z) => (
          <Chip key={z.id} active={z.id === zone} onClick={() => setZone(z.id)}>
            {t.zones[z.id]}
          </Chip>
        ))}
      </div>
    </div>
  );
}
