import { useState, useEffect, useRef, useCallback } from 'react';

interface UseAutoSaveOptions {
  data: unknown;
  onSave: () => Promise<void>;
  interval?: number;
  enabled?: boolean;
}

interface UseAutoSaveReturn {
  lastSaved: Date | null;
  isSaving: boolean;
  saveNow: () => Promise<void>;
}

export function useAutoSave({
  data,
  onSave,
  interval = 30000,
  enabled = true,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const dataRef = useRef(data);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const saveNow = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onSave();
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, onSave]);

  useEffect(() => {
    if (!enabled) return;

    saveTimeoutRef.current = setInterval(() => {
      saveNow();
    }, interval);

    return () => {
      if (saveTimeoutRef.current) {
        clearInterval(saveTimeoutRef.current);
      }
    };
  }, [enabled, interval, saveNow]);

  return { lastSaved, isSaving, saveNow };
}
