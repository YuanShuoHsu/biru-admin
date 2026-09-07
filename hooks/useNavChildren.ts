"use client";

import { useActiveMemberRole } from "@/hooks/organizations";
import { useAuthNavItems } from "@/hooks/useAuth";
import { useRoutes } from "@/hooks/useRoutes";

import { useAuthStore } from "@/providers/auth-store-provider";

import type { NavItem } from "@/types/navItem";

import { useAccountNavItems } from "@/utils/account";
import { hasRolePermission } from "@/utils/organizations";

export const useNavChildren = (): Record<string, NavItem[]> => {
  const session = useAuthStore((state) => state.session);

  const memberRole = useActiveMemberRole();

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
    "/inventory": [
      ...(hasRolePermission(memberRole, { inventory: ["read"] })
        ? [navItem("/inventory/ingredients")]
        : []),
      ...(hasRolePermission(memberRole, { purchasing: ["read"] })
        ? [navItem("/inventory/suppliers")]
        : []),
    ],
    "/menus": [navItem("/menus/sections"), navItem("/menus/modifier-groups")],
    "/orders": [navItem("/orders/list"), navItem("/orders/board")],
  };
};
