"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import { type StoreApi, useStore } from "zustand";

import { type AuthStore, createAuthStore } from "@/stores/auth-store";

import type { Session } from "@/types/auth";

const AuthStoreContext = createContext<StoreApi<AuthStore> | undefined>(
  undefined,
);

interface AuthStoreProviderProps {
  children: ReactNode;
  initialSession: Session | null;
}

export const AuthStoreProvider = ({
  children,
  initialSession,
}: AuthStoreProviderProps) => {
  const [store] = useState(() => createAuthStore({ session: initialSession }));

  return (
    <AuthStoreContext.Provider value={store}>
      {children}
    </AuthStoreContext.Provider>
  );
};

export const useAuthStore = <T,>(selector: (store: AuthStore) => T): T => {
  const authStoreContext = useContext(AuthStoreContext);

  if (!authStoreContext)
    throw new Error(`useAuthStore must be used within AuthStoreProvider`);

  return useStore(authStoreContext, selector);
};
