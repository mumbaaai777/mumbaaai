// Generic CRUD screen: table + slide-over form driven by a field schema.
import { useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Pencil, Trash2, X, Upload, Search } from 'lucide-react';
import type { ListOptions, TableName } from '@mumbaaai/shared';
import { db } from '../lib/data';
import { useRows } from '../lib/useRows';

export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'multiselect' | 'date' | 'datetime' | 'time' | 'checkbox' | 'image' | 'url';
export interface Field {
  key: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  required?: boolean;
  help?: string;
  placeholder?: string;
  half?: boolean;
}
export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

type Row = Record<string, unknown> & { id?: string };

export const inputCls =
  'w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus:border-marigold focus:outline-none focus:ring-2 focus:ring-marigold/25';

export function Btn({ children, variant = 'primary', className = '', ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }) {
  const v = {
    primary: 'bg-navy text-offwhite hover:bg-navy/90 dark:bg-marigold dark:text-navy',
    ghost: 'border border-line-strong text-ink-soft hover:text-ink hover:border-ink/30',
    danger: 'border border-live/40 text-live-ink hover:bg-live/5',
  }[variant];
  return (
    <motion.button whileTap={{ scale: 0.96 }} className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${v} ${className}`} {...(rest as object)}>
      {children}
    </motion.button>
  );
}

function toLocalInput(v: unknown) {
  if (!v) return '';
  const d = new Date(String(v));
  if (isNaN(d.getTime())) return '';
  const ist = new Date(d.getTime() + 330 * 60000);
  return ist.toISOString().slice(0, 16);
}
function fromLocalInput(v: string) {
  return v ? new Date(`${v}:00+05:30`).toISOString() : null;
}

function FieldInput({ f, value, onChange }: { f: Field; value: unknown; onChange: (v: unknown) => void }) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  switch (f.type) {
    case 'textarea':
      return <textarea className={`${inputCls} min-h-20`} value={String(value ?? '')} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />;
    case 'number':
      return <input type="number" className={inputCls} value={value === null || value === undefined ? '' : String(value)} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} />;
    case 'select':
      return (
        <select className={inputCls} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
          {!f.required && <option value="">—</option>}
          {f.options!.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    case 'multiselect': {
      const arr = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="flex flex-wrap gap-1.5">
          {f.options!.map((o) => {
            const on = arr.includes(o.value);
            return (
              <button
                type="button"
                key={o.value}
                onClick={() => onChange(on ? arr.filter((x) => x !== o.value) : [...arr, o.value])}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${on ? 'border-navy bg-navy text-offwhite dark:border-marigold dark:bg-marigold dark:text-navy' : 'border-line-strong text-ink-soft'}`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      );
    }
    case 'date':
      return <input type="date" className={inputCls} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />;
    case 'time':
      return <input type="time" className={inputCls} value={String(value ?? '').slice(0, 5)} onChange={(e) => onChange(e.target.value)} />;
    case 'datetime':
      return <input type="datetime-local" className={inputCls} value={toLocalInput(value)} onChange={(e) => onChange(fromLocalInput(e.target.value))} />;
    case 'checkbox':
      return (
        <label className="inline-flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" className="h-4 w-4 accent-[#F4A300]" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} /> {f.help ?? 'Yes'}
        </label>
      );
    case 'image':
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input className={inputCls} value={String(value ?? '')} placeholder="https://… or upload" onChange={(e) => onChange(e.target.value || null)} />
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-line-strong px-3 text-sm font-semibold text-ink-soft">
              <Upload size={14} /> {uploading ? '…' : 'Upload'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  setErr(null);
                  try {
                    onChange(await db.uploadImage(file));
                  } catch (x) {
                    setErr((x as Error).message);
                  } finally {
                    setUploading(false);
                  }
                }}
              />
            </label>
          </div>
          {err && <p className="text-xs text-live-ink">{err}</p>}
          {typeof value === 'string' && value && <img src={value} alt="" className="h-20 rounded-lg border border-line object-cover" />}
        </div>
      );
    default:
      return <input type={f.type === 'url' ? 'url' : 'text'} className={inputCls} value={String(value ?? '')} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />;
  }
}

export function ResourcePage<T extends Row>({
  table,
  title,
  description,
  fields,
  columns,
  defaults,
  preview,
  listOptions,
  beforeSave,
  searchKeys = [],
  toolbar,
}: {
  table: TableName;
  title: string;
  description?: string;
  fields: Field[];
  columns: Column<T>[];
  defaults: () => Partial<T>;
  preview?: (draft: Partial<T>) => ReactNode;
  listOptions?: ListOptions;
  beforeSave?: (draft: Partial<T>) => Partial<T>;
  searchKeys?: string[];
  toolbar?: ReactNode;
}) {
  const { rows, loading, error, reload } = useRows<T>(table, listOptions);
  const [draft, setDraft] = useState<Partial<T> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const filtered = useMemo(
    () => (q ? rows.filter((r) => searchKeys.some((k) => String(r[k] ?? '').toLowerCase().includes(q.toLowerCase()))) : rows),
    [rows, q, searchKeys],
  );

  const save = async () => {
    if (!draft) return;
    const missing = fields.filter((f) => f.required && (draft[f.key] === undefined || draft[f.key] === '' || draft[f.key] === null));
    if (missing.length) return setSaveErr(`Required: ${missing.map((m) => m.label).join(', ')}`);
    setSaving(true);
    setSaveErr(null);
    try {
      const payload = { ...(beforeSave ? beforeSave(draft) : draft) } as Row;
      const id = payload.id as string | undefined;
      delete payload.sample;
      if (id) {
        delete payload.id;
        await db.update(table, id, payload);
      } else {
        delete payload.id;
        await db.insert(table, payload);
      }
      setDraft(null);
      await reload();
    } catch (e) {
      setSaveErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  };
  const remove = async (r: T) => {
    if (!r.id || !confirm('Delete this item? This cannot be undone.')) return;
    await db.remove(table, r.id);
    await reload();
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {toolbar}
          {searchKeys.length > 0 && (
            <label className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
              <input className={`${inputCls} w-48 pl-8`} placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
            </label>
          )}
          <Btn onClick={() => setDraft(defaults())}>
            <Plus size={15} /> New
          </Btn>
        </div>
      </div>
      {error && <p className="mb-3 rounded-lg border border-live/40 p-3 text-sm text-live-ink">{error}</p>}
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="whitespace-nowrap px-4 py-3 font-semibold">
                  {c.label}
                </th>
              ))}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-muted">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-muted">
                  Nothing here yet.
                </td>
              </tr>
            ) : (
              filtered.map((r, i) => (
                <motion.tr key={String(r.id ?? i)} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: Math.min(i, 12) * 0.02 } }} className="hover:bg-surface-2/40">
                  {columns.map((c) => (
                    <td key={c.key} className={`px-4 py-3 align-top text-ink ${c.className ?? ''}`}>
                      {c.render ? c.render(r) : String(r[c.key] ?? '—')}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-ink" onClick={() => setDraft({ ...r })} aria-label="Edit">
                      <Pencil size={15} />
                    </button>
                    <button className="rounded-md p-1.5 text-muted hover:bg-live/10 hover:text-live-ink" onClick={() => remove(r)} aria-label="Delete">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {draft && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-navy/40 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDraft(null)} />
            <motion.aside
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-line bg-bg shadow-2xl"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              role="dialog"
              aria-label={draft.id ? 'Edit' : 'New'}
            >
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h2 className="font-semibold text-ink">
                  {draft.id ? 'Edit' : 'New'} · {title}
                </h2>
                <button onClick={() => setDraft(null)} className="rounded-md p-1.5 text-muted hover:text-ink" aria-label="Close">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                {preview && (
                  <div className="rounded-xl bg-surface-2 p-4">
                    <p className="eyebrow mb-2">Preview in app</p>
                    <div className="mx-auto max-w-sm">{preview(draft)}</div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {fields.map((f) => (
                    <label key={f.key} className={`grid gap-1.5 ${f.half ? '' : 'col-span-2'}`}>
                      <span className="text-xs font-semibold text-ink-soft">
                        {f.label}
                        {f.required && <span className="text-live-ink"> *</span>}
                      </span>
                      <FieldInput f={f} value={draft[f.key]} onChange={(v) => setDraft((d) => ({ ...d!, [f.key]: v }))} />
                      {f.help && f.type !== 'checkbox' && <span className="text-[11px] text-muted">{f.help}</span>}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4">
                <p className="text-sm text-live-ink">{saveErr}</p>
                <div className="flex gap-2">
                  <Btn variant="ghost" onClick={() => setDraft(null)}>
                    Cancel
                  </Btn>
                  <Btn onClick={save} disabled={saving}>
                    {saving ? 'Saving…' : 'Save'}
                  </Btn>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export const Badge = ({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'good' | 'warn' | 'bad' | 'accent' }) => {
  const c = {
    muted: 'bg-surface-2 text-ink-soft',
    good: 'bg-[#3E9B5F]/12 text-[#2B7347] dark:text-[#7FD19C]',
    warn: 'bg-accent-soft text-marigold-ink',
    bad: 'bg-live/10 text-live-ink',
    accent: 'bg-navy text-offwhite dark:bg-marigold dark:text-navy',
  }[tone];
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${c}`}>{children}</span>;
};
