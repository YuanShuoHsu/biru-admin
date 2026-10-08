"use client";

import { useActiveMemberRole } from "@/hooks/organizations";
import { useAttendanceReviewCounts } from "@/hooks/useAttendanceReviewCounts";
import { useAuthNavItems } from "@/hooks/useAuth";
import { useRoutes } from "@/hooks/useRoutes";

import { useAuthStore } from "@/providers/auth-store-provider";

import type { NavItem } from "@/types/navItem";

import { useAccountNavItems } from "@/utils/account";
import { attendanceNavGroups } from "@/utils/attendance";
import { hasRolePermission } from "@/utils/organizations";

export const useNavChildren = (): Record<string, NavItem[]> => {
  const session = useAuthStore((state) => state.session);

  const memberRole = useActiveMemberRole();

  const navItem = useRoutes();

  const accountChildren = useAccountNavItems();
  const authChildren = useAuthNavItems();
  const reviewCounts = useAttendanceReviewCounts();

  return {
    "/attendance": attendanceNavGroups(memberRole).map(({ children, path }) =>
      children.length === 1
        ? { ...navItem(children[0]), badge: reviewCounts[children[0]] }
        : {
            ...navItem(path),
            badge: children.reduce(
              (sum, child) => sum + (reviewCounts[child] ?? 0),
              0,
            ),
            children: children.map((child) => ({
              ...navItem(child),
              badge: reviewCounts[child],
            })),
          },
    ),
    "/auth": session ? accountChildren : authChildren,
    "/company": [navItem("/company/terms"), navItem("/company/privacy")],
    "/inventory": [
      ...(hasRolePermission(memberRole, { inventory: ["read"] })
        ? [navItem("/inventory/ingredients")]
        : []),
      ...(hasRolePermission(memberRole, { purchasing: ["read"] })
        ? [navItem("/inventory/suppliers")]
        : []),
    ],
    "/menus": [navItem("/menus/sections"), navItem("/menus/modifier-groups")],
    "/orders": [navItem("/orders/board"), navItem("/orders/list")],
    "/waitlist": [navItem("/waitlist/board"), navItem("/waitlist/list")],
  };
};
