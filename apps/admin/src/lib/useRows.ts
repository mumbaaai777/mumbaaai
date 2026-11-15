import { useCallback, useEffect, useState } from 'react';
import type { ListOptions, TableName } from '@mumbaaai/shared';
import { db } from './data';

export function useRows<T>(table: TableName, opts?: ListOptions) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const key = JSON.stringify(opts ?? {});
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await db.list<T>(table, opts));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, key]);
  useEffect(() => {
    void reload();
  }, [reload]);
  return { rows, loading, error, reload, setRows };
}
