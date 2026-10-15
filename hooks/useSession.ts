"use client";

import { use } from "react";

import { useAuthStore } from "@/providers/auth-store-provider";

export const useSession = () => {
  const { session, sessionPromise } = useAuthStore((state) => state);

  return session === undefined ? use(sessionPromise) : session;
};
