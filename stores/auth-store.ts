import { createStore } from "zustand/vanilla";

import type { Session } from "@/types/auth";

type AuthState = {
  session?: Session | null;
  sessionPromise: Promise<Session | null>;
};

type AuthActions = {
  setSession: (session: Session | null) => void;
};

export type AuthStore = AuthState & AuthActions;

const defaultInitState: AuthState = {
  sessionPromise: Promise.resolve(null),
};

export const createAuthStore = (initState: AuthState = defaultInitState) => {
  return createStore<AuthStore>()((set) => ({
    ...initState,
    setSession: (session) => set({ session }),
  }));
};
