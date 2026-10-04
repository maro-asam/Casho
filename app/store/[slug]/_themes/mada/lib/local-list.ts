"use client";

// Small per-store id lists kept in this browser (wishlist, recently viewed).
// Backed by localStorage; every write notifies other components and tabs.

import { useCallback, useSyncExternalStore } from "react";

const EVENT = "mada:local-list";
const EMPTY: string[] = [];
const cache = new Map<string, { raw: string | null; value: string[] }>();

function read(key: string): string[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return EMPTY;
  }
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value;
  let value = EMPTY;
  try {
    const parsed = JSON.parse(raw || "[]");
    if (Array.isArray(parsed)) value = parsed.filter((x): x is string => typeof x === "string");
  } catch {}
  cache.set(key, { raw, value });
  return value;
}

function write(key: string, list: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {}
  window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useLocalList(key: string, max = 50) {
  const list = useSyncExternalStore(subscribe, () => read(key), () => EMPTY);

  const toggle = useCallback(
    (id: string) => {
      const cur = read(key);
      write(key, cur.includes(id) ? cur.filter((x) => x !== id) : [id, ...cur].slice(0, max));
    },
    [key, max],
  );

  const pushFront = useCallback(
    (id: string) => {
      const cur = read(key);
      write(key, [id, ...cur.filter((x) => x !== id)].slice(0, max));
    },
    [key, max],
  );

  const remove = useCallback((id: string) => write(key, read(key).filter((x) => x !== id)), [key]);

  return { list, toggle, pushFront, remove };
}

export const wishlistKey = (storeSlug: string) => `mada:wishlist:${storeSlug}`;
export const recentKey = (storeSlug: string) => `mada:recent:${storeSlug}`;
