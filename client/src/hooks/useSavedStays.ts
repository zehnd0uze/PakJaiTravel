import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'pakjai_saved_stays';
const SYNC_EVENT = 'pakjai-saved-stays-changed';

const readSavedIds = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
};

const writeSavedIds = (ids: string[]) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: ids }));
  } catch {
    // Ignore storage quota errors
  }
};

export const useSavedStays = () => {
  const [savedIds, setSavedIds] = useState<string[]>(() => readSavedIds());

  useEffect(() => {
    const onCustomSync = (e: Event) => {
      const next = (e as CustomEvent<string[]>).detail;
      setSavedIds(Array.isArray(next) ? next : readSavedIds());
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setSavedIds(readSavedIds());
    };

    window.addEventListener(SYNC_EVENT, onCustomSync);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(SYNC_EVENT, onCustomSync);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const isSaved = useCallback((id: string) => savedIds.includes(id), [savedIds]);

  const toggleSaved = useCallback((id: string) => {
    const current = readSavedIds();
    const exists = current.includes(id);
    const next = exists ? current.filter((item) => item !== id) : [id, ...current];
    writeSavedIds(next);
    setSavedIds(next);
  }, []);

  const clearSaved = useCallback(() => {
    writeSavedIds([]);
    setSavedIds([]);
  }, []);

  return {
    savedIds,
    savedCount: savedIds.length,
    isSaved,
    toggleSaved,
    clearSaved,
  };
};
