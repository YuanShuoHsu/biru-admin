"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { DEFAULT_PAGINATION_QUERY } from "@/constants/pagination";
import { findRoute, type RouteQuery } from "@/constants/routes";

import type { NavItem } from "@/types/navItem";

import { getHref } from "@/utils/href";

export const useNavItem = (defaultOrganization?: string | null) => {
  const t = useTranslations();
  const searchParams = useSearchParams();

  const values: Record<RouteQuery, string | null> = {
    organization:
      searchParams.get("organization") || defaultOrganization || null,
    page: DEFAULT_PAGINATION_QUERY.page,
    pageSize: DEFAULT_PAGINATION_QUERY.pageSize,
    partySize: searchParams.get("partySize"),
    range: searchParams.get("range"),
    tableNumber: searchParams.get("tableNumber"),
  };

  const buildHref = (href: string) => {
    const { query } = findRoute(href) || {};
    if (!query) return href;

    return getHref(
      href,
      Object.fromEntries(query.map((key) => [key, values[key]])),
    );
  };

  return (path: string, to = path): NavItem & { to: string } => {
    const { icon, labelKey } = findRoute(path) || {};

    return {
      icon,
      label: labelKey && t(labelKey),
      to: buildHref(to),
    };
  };
};
