"use client";

import { useRoutes } from "@/hooks/useRoutes";

import type { NavItem } from "@/types/navItem";

export const useCompanyNavItems = (): NavItem[] => {
  const navItem = useRoutes();

  return [
    navItem("/company/about"),
    navItem("/company/terms"),
    navItem("/company/privacy"),
  ];
};
