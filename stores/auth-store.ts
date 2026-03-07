import { createStore } from "zustand/vanilla";

import { authClient } from "@/lib/auth-client";

export type Session = typeof authClient.$Infer.Session;

type AuthState = {
  session: Session | null;
};

type AuthActions = {
  setSession: (session: Session | null) => void;
};

export type AuthStore = AuthState & AuthActions;

export const defaultInitState: AuthState = {
  session: null,
};

export const createAuthStore = (initState: AuthState = defaultInitState) => {
  return createStore<AuthStore>()((set) => ({
    ...initState,
    setSession: (session) => set(() => ({ session })),
  }));
};
