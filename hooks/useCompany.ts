"use client";

import { useRoutes } from "@/hooks/useRoutes";

import type { NavItem } from "@/types/navItem";

import { getHref } from "@/utils/href";

export const useCompanyNavItems = (
  legalQuery?: Record<string, string | null>,
): NavItem[] => {
  const navItem = useRoutes();

  return [
    navItem("/company/about"),
    navItem("/company/terms", getHref("/company/terms", legalQuery)),
    navItem("/company/privacy", getHref("/company/privacy", legalQuery)),
  ];
};
