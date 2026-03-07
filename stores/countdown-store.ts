// https://zustand.docs.pmnd.rs/reference/integrations/persisting-store-data

import { type PersistStorage, persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

interface CountdownState {
  items: Record<string, number>;
}

interface CountdownActions {
  clearCountdown: (key: string) => void;
  startCountdown: (
    key: string,
    durationInSeconds?: number,
    onComplete?: () => void,
  ) => void;
}

export type CountdownStore = CountdownState & CountdownActions;

const storage: PersistStorage<CountdownState> = {
  getItem: (name) => {
    const raw = localStorage.getItem(name);
    if (!raw) return null;

    const { expiresAt }: { expiresAt: Record<string, number> } =
      JSON.parse(raw);
    const now = Date.now();
    const items: Record<string, number> = {};

    for (const [key, ts] of Object.entries(expiresAt)) {
      const secs = Math.ceil((ts - now) / 1000);
      if (secs > 0) items[key] = secs;
    }

    return { state: { items } };
  },
  setItem: (name, { state }) => {
    const now = Date.now();
    const expiresAt: Record<string, number> = {};

    for (const [key, secs] of Object.entries(state.items)) {
      expiresAt[key] = now + secs * 1000;
    }

    localStorage.setItem(name, JSON.stringify({ expiresAt }));
  },
  removeItem: (name) => localStorage.removeItem(name),
};

const COUNTDOWN_DURATION = 60;

export const defaultInitState: CountdownState = {
  items: {},
};

export const createCountdownStore = (
  initState: CountdownState = defaultInitState,
) => {
  const intervalMap = new Map<string, ReturnType<typeof setInterval>>();

  return createStore<CountdownStore>()(
    persist(
      (set, get) => {
        const stopInterval = (key: string) => {
          clearInterval(intervalMap.get(key));
          intervalMap.delete(key);
        };

        const deleteKey = (key: string) => {
          stopInterval(key);
          set((state) => {
            const items = { ...state.items };
            delete items[key];

            return { items };
          });
        };

        const tick = (key: string, onComplete?: () => void) => {
          const secs = get().items[key];
          if (!secs || secs === 1) {
            deleteKey(key);
            onComplete?.();
          } else {
            set((state) => ({ items: { ...state.items, [key]: secs - 1 } }));
          }
        };

        const scheduleInterval = (key: string, onComplete?: () => void) => {
          stopInterval(key);
          intervalMap.set(
            key,
            setInterval(() => tick(key, onComplete), 1000),
          );
        };

        return {
          ...initState,
          clearCountdown: deleteKey,
          startCountdown: (
            key,
            durationInSeconds = COUNTDOWN_DURATION,
            onComplete,
          ) => {
            set((state) => ({
              items: { ...state.items, [key]: durationInSeconds },
            }));
            scheduleInterval(key, onComplete);
          },
        };
      },
      {
        name: "biru-countdown-storage",
        onRehydrateStorage: () => (state) => {
          if (!state) return;

          for (const [key, secs] of Object.entries(state.items)) {
            state.startCountdown(key, secs);
          }
        },
        partialize: (state) => ({ items: state.items }),
        storage,
      },
    ),
  );
};
