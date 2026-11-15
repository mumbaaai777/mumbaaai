import { useEffect, useState } from 'react';
import type { TableName, ListOptions } from '@mumbaaai/shared';
import { db } from './data';

// Tiny in-memory cache so switching tabs doesn't refetch everything.
const mem = new Map<string, { at: number; rows: unknown[] }>();
const TTL = 60_000;

export function useTable<T>(table: TableName, opts?: ListOptions) {
  const key = table + JSON.stringify(opts ?? {});
  const [rows, setRows] = useState<T[] | undefined>(() => mem.get(key)?.rows as T[] | undefined);
  const [error, setError] = useState<unknown>();
  useEffect(() => {
    let alive = true;
    const hit = mem.get(key);
    if (hit && Date.now() - hit.at < TTL) {
      setRows(hit.rows as T[]);
      return;
    }
    db.list<T>(table, opts).then(
      (r) => {
        mem.set(key, { at: Date.now(), rows: r });
        if (alive) setRows(r);
      },
      (e) => alive && setError(e),
    );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return { rows, error, loading: rows === undefined && !error };
}
