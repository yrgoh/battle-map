import { useEffect, useState } from 'react';
import type { BattleConfig } from '../types/battle';
import { useBattleStore } from '../store/battleStore';

// Static fallback data for battles that aren't yet fully seeded in the DB.
// Once a battle is fully migrated to SQLite, remove its entry here.
const STATIC_FALLBACKS: Record<string, () => Promise<{ default: BattleConfig }>> = {
  stalingrad: () => import('../data/stalingrad/stalingradData').then((m) => ({ default: m.stalingradBattle })),
};

interface UseBattleResult {
  battle: BattleConfig | undefined;
  loading: boolean;
  error: string | null;
}

/**
 * Fetch and cache a battle config. Falls back to static import if the API
 * returns empty data (battle not yet fully seeded in SQLite).
 */
export function useBattle(battleId: string | undefined): UseBattleResult {
  const getConfig = useBattleStore((s) => s.getBattleConfig);
  const loadConfig = useBattleStore((s) => s.loadBattleConfig);
  const configLoading = useBattleStore((s) => s.configLoading);
  const configError = useBattleStore((s) => s.configError);

  const [battle, setBattle] = useState<BattleConfig | undefined>(
    battleId ? getConfig(battleId) : undefined,
  );

  useEffect(() => {
    if (!battleId) {
      setBattle(undefined);
      return;
    }

    const cached = getConfig(battleId);
    if (cached) {
      setBattle(cached);
      return;
    }

    let cancelled = false;
    setBattle(undefined);

    loadConfig(battleId)
      .then((config) => {
        if (cancelled) return;
        // If API returned empty keyframes (DB not fully seeded), try static fallback
        if (config.keyframes.length === 0 && STATIC_FALLBACKS[battleId]) {
          STATIC_FALLBACKS[battleId]().then((mod) => {
            if (!cancelled) setBattle(mod.default);
          });
          return;
        }
        setBattle(config);
      })
      .catch(() => {
        if (cancelled) return;
        // On API error, try static fallback
        if (STATIC_FALLBACKS[battleId]) {
          STATIC_FALLBACKS[battleId]().then((mod) => {
            if (!cancelled) setBattle(mod.default);
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [battleId, getConfig, loadConfig]);

  const loading = battleId ? (configLoading[battleId] ?? false) : false;
  const error = battleId ? (configError[battleId] ?? null) : null;

  return { battle, loading, error };
}

/**
 * Convenience hook that also sets the current battle ID in the store.
 */
export function useActiveBattle(battleId: string | undefined): UseBattleResult {
  const setCurrentBattle = useBattleStore((s) => s.setCurrentBattle);

  useEffect(() => {
    if (battleId) {
      setCurrentBattle(battleId);
    }
  }, [battleId, setCurrentBattle]);

  return useBattle(battleId);
}
