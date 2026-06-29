import { useCallback, useEffect, useReducer, useRef } from 'react';
import { isApiError } from '../api/client';

/**
 * Tiny in-memory query cache with TTL, in-flight de-duplication, and
 * stale-while-revalidate. Keeps navigation snappy: revisiting a page within the
 * TTL window serves cached data instantly instead of refetching, and concurrent
 * requests for the same key (including React StrictMode's double-invoke) share a
 * single network call.
 */

interface Entry<T = unknown> {
  data?: T;
  error?: unknown;
  updatedAt: number;
  promise?: Promise<T>;
}

const cache = new Map<string, Entry>();
const subscribers = new Map<string, Set<() => void>>();

export const DEFAULT_TTL = 30_000;

function notify(key: string): void {
  subscribers.get(key)?.forEach((cb) => cb());
}

function getEntry<T>(key: string): Entry<T> | undefined {
  return cache.get(key) as Entry<T> | undefined;
}

export async function runQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = DEFAULT_TTL,
  force = false
): Promise<T> {
  const existing = getEntry<T>(key);
  if (existing?.promise) return existing.promise; // share an in-flight request
  if (!force && existing?.data !== undefined && Date.now() - existing.updatedAt < ttl) {
    return existing.data; // still fresh
  }

  const promise = (async () => {
    try {
      const data = await fetcher();
      cache.set(key, { data, updatedAt: Date.now() });
      return data;
    } catch (err) {
      const prev = getEntry<T>(key);
      cache.set(key, { data: prev?.data, error: err, updatedAt: Date.now() });
      throw err;
    } finally {
      notify(key);
    }
  })();

  // Keep any stale data visible while the refetch is in flight.
  cache.set(key, { ...(existing ?? { updatedAt: 0 }), promise });
  return promise;
}

/** Drops every cached entry whose key starts with the given prefix. */
export function invalidate(prefix: string): void {
  for (const key of [...cache.keys()]) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
      notify(key);
    }
  }
}

interface UseQueryResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { ttl?: number; enabled?: boolean } = {}
): UseQueryResult<T> {
  const { ttl = DEFAULT_TTL, enabled = true } = options;
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const [, rerender] = useReducer((n: number) => n + 1, 0);

  const load = useCallback(
    (force = false): Promise<void> => {
      if (!enabled) return Promise.resolve();
      return runQuery<T>(key, () => fetcherRef.current(), ttl, force).then(
        () => undefined,
        () => undefined
      );
    },
    [key, ttl, enabled]
  );

  useEffect(() => {
    let set = subscribers.get(key);
    if (!set) {
      set = new Set();
      subscribers.set(key, set);
    }
    set.add(rerender);

    const entry = getEntry<T>(key);
    const fresh = entry?.data !== undefined && Date.now() - entry.updatedAt < ttl;
    if (enabled && !fresh && !entry?.promise) {
      void load();
    }

    return () => {
      set?.delete(rerender);
      if (set && set.size === 0) subscribers.delete(key);
    };
  }, [key, ttl, enabled, load]);

  const entry = getEntry<T>(key);
  const data = (entry?.data ?? null) as T | null;
  const isLoading = enabled && data === null && (entry?.promise !== undefined || entry === undefined);
  const error = entry?.error
    ? isApiError(entry.error)
      ? entry.error.message
      : 'An error occurred'
    : null;

  return { data, isLoading, error, refetch: () => load(true) };
}
