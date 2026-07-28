"use client";

import { useAuthNavItems } from "@/hooks/useAuth";
import { useRoutes } from "@/hooks/useRoutes";

import { useAuthStore } from "@/providers/auth-store-provider";

import type { NavItem } from "@/types/navItem";

import { useAccountNavItems } from "@/utils/account";

export const useNavChildren = (): Record<string, NavItem[]> => {
  const session = useAuthStore((state) => state.session);

  const navItem = useRoutes();

  const accountChildren = useAccountNavItems();
  const authChildren = useAuthNavItems();

  return {
    "/auth": session ? accountChildren : authChildren,
    "/company": [
      navItem("/company/about"),
      navItem("/company/terms"),
      navItem("/company/privacy"),
    ],
  };
};
