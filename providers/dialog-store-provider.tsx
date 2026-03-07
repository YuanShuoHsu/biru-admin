"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import { type StoreApi, useStore } from "zustand";

import {
  createDialogStore,
  defaultInitState,
  type DialogStore,
} from "@/stores/dialog-store";

const DialogStoreContext = createContext<StoreApi<DialogStore> | undefined>(
  undefined,
);

interface DialogStoreProviderProps {
  children: ReactNode;
}

export const DialogStoreProvider = ({ children }: DialogStoreProviderProps) => {
  const [store] = useState(() => createDialogStore(defaultInitState));

  return (
    <DialogStoreContext.Provider value={store}>
      {children}
    </DialogStoreContext.Provider>
  );
};

export const useDialogStore = <T,>(selector: (store: DialogStore) => T): T => {
  const dialogStoreContext = useContext(DialogStoreContext);

  if (!dialogStoreContext)
    throw new Error(`useDialogStore must be used within DialogStoreProvider`);

  return useStore(dialogStoreContext, selector);
};
