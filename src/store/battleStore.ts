import { create } from 'zustand';
import type { BattleConfig, BattleSummary } from '../types/battle';
import { fetchBattles, exportBattle, type BattleListItem } from '../lib/editorApi';

const MAX_CACHE_SIZE = 5;

interface BattleStore {
  // Battle list (from server)
  battleList: BattleSummary[];
  battleListLoading: boolean;

  // Current battle
  currentBattleId: string | null;

  // Config cache (LRU-ish: last 5 accessed)
  configCache: Record<string, BattleConfig>;
  configLoading: Record<string, boolean>;
  configError: Record<string, string>;

  // Actions
  loadBattleList: () => Promise<void>;
  setCurrentBattle: (id: string) => void;
  getBattleConfig: (id: string) => BattleConfig | undefined;
  loadBattleConfig: (id: string) => Promise<BattleConfig>;
  evictCache: (keepId?: string) => void;
}

export const useBattleStore = create<BattleStore>((set, get) => ({
  battleList: [],
  battleListLoading: false,
  currentBattleId: null,
  configCache: {},
  configLoading: {},
  configError: {},

  loadBattleList: async () => {
    if (get().battleList.length > 0 && !get().battleListLoading) return;
    set({ battleListLoading: true });
    try {
      const items: BattleListItem[] = await fetchBattles();
      const summaries: BattleSummary[] = items.map((b) => ({
        id: b.id,
        name: b.name,
        dateStart: b.dateStart,
        dateEnd: b.dateEnd,
        theatre: b.theatre ?? 'eastern_front',
      }));
      set({ battleList: summaries, battleListLoading: false });
    } catch (err: any) {
      set({ battleListLoading: false });
      console.error('[battleStore] Failed to load battle list:', err.message);
    }
  },

  setCurrentBattle: (id: string) => {
    set({ currentBattleId: id });
  },

  getBattleConfig: (id: string) => {
    return get().configCache[id];
  },

  loadBattleConfig: async (id: string) => {
    const state = get();
    // Already cached
    if (state.configCache[id]) return state.configCache[id];
    // Already loading
    if (state.configLoading[id]) {
      // Wait for it to load (simple poll approach — in practice, use a promise map)
      return new Promise<BattleConfig>((resolve, reject) => {
        const check = setInterval(() => {
          const s = get();
          if (s.configCache[id]) {
            clearInterval(check);
            resolve(s.configCache[id]);
          }
          if (s.configError[id]) {
            clearInterval(check);
            reject(new Error(s.configError[id]));
          }
        }, 100);
      });
    }

    set({ configLoading: { ...get().configLoading, [id]: true } });
    try {
      const config = await exportBattle(id);
      const cache = { ...get().configCache, [id]: config };
      // Evict oldest if over limit
      const keys = Object.keys(cache);
      if (keys.length > MAX_CACHE_SIZE) {
        // Remove the least recently added (first key that's not current)
        const toEvict = keys.find((k) => k !== id);
        if (toEvict) delete cache[toEvict];
      }
      set({
        configCache: cache,
        configLoading: { ...get().configLoading, [id]: false },
      });
      return config;
    } catch (err: any) {
      set({
        configLoading: { ...get().configLoading, [id]: false },
        configError: { ...get().configError, [id]: err.message },
      });
      throw err;
    }
  },

  evictCache: (keepId?: string) => {
    if (keepId) {
      const cache = get().configCache;
      if (cache[keepId]) {
        set({ configCache: { [keepId]: cache[keepId] } });
      } else {
        set({ configCache: {} });
      }
    } else {
      set({ configCache: {} });
    }
  },
}));
