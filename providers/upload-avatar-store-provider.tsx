"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import { type StoreApi, useStore } from "zustand";

import {
  createUploadAvatarStore,
  defaultInitState,
  type UploadAvatarStore,
} from "@/stores/upload-avatar-store";

const UploadAvatarStoreContext = createContext<
  StoreApi<UploadAvatarStore> | undefined
>(undefined);

interface UploadAvatarStoreProviderProps {
  children: ReactNode;
}

export const UploadAvatarStoreProvider = ({
  children,
}: UploadAvatarStoreProviderProps) => {
  const [store] = useState(() => createUploadAvatarStore(defaultInitState));

  return (
    <UploadAvatarStoreContext.Provider value={store}>
      {children}
    </UploadAvatarStoreContext.Provider>
  );
};

export const useUploadAvatarStore = <T,>(
  selector: (store: UploadAvatarStore) => T,
): T => {
  const context = useContext(UploadAvatarStoreContext);

  if (!context)
    throw new Error(
      `useUploadAvatarStore must be used within UploadAvatarStoreProvider`,
    );

  return useStore(context, selector);
};
