"use client";

import { useCallback, useSyncExternalStore } from "react";

import useSWR, { type SWRConfiguration } from "swr";

import type { QuantCredential } from "@/types/quant";

import { fetcher } from "@/utils/fetcher";

export const QUANT_CREDENTIALS_URL = "/api/quant/credentials";

const SELECTED_CREDENTIAL_KEY = "quant.credentialId";
const SELECTED_CREDENTIAL_EVENT = "quant-credential-change";

export const quantAccountUrl = (credentialId: string, path: string) =>
  `${QUANT_CREDENTIALS_URL}/${credentialId}/${path}`;

export const isQuantAccountKey = (credentialId: string) => (key: unknown) =>
  typeof key === "string" &&
  key.startsWith(`${QUANT_CREDENTIALS_URL}/${credentialId}/`);

const subscribe = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  window.addEventListener(SELECTED_CREDENTIAL_EVENT, onChange);

  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(SELECTED_CREDENTIAL_EVENT, onChange);
  };
};

const readSelected = () => {
  try {
    return localStorage.getItem(SELECTED_CREDENTIAL_KEY);
  } catch {
    return null;
  }
};

export const useQuantCredentials = (
  config?: SWRConfiguration<QuantCredential[]>,
) => {
  const { data: credentials, mutate } = useSWR<QuantCredential[]>(
    QUANT_CREDENTIALS_URL,
    fetcher,
    config,
  );

  const selectedId = useSyncExternalStore(subscribe, readSelected, () => null);

  const selectCredential = useCallback((id: string) => {
    try {
      localStorage.setItem(SELECTED_CREDENTIAL_KEY, id);
    } catch {}
    window.dispatchEvent(new Event(SELECTED_CREDENTIAL_EVENT));
  }, []);

  const credential =
    credentials?.find(({ id }) => id === selectedId) ?? credentials?.[0];

  return { credential, credentials, mutate, selectCredential };
};
