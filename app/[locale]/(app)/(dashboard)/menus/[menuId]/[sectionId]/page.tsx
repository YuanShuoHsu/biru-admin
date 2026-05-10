import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import MenusMenuIdSectionId from ".";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  getAdminMenu,
  getAdminMenuSection,
  getAdminMenuSectionItems,
} from "@/utils/menus";

interface MenusMenuIdSectionIdPageProps {
  params: Promise<{ locale: Locale; menuId: string; sectionId: string }>;
  searchParams: Promise<{
    organization?: string;
    page?: string;
    pageSize?: string;
    sortBy?: string;
    sortDirection?: string;
  }>;
}

const MenusMenuIdSectionIdPage = async ({
  params,
  searchParams,
}: MenusMenuIdSectionIdPageProps) => {
  const [
    cookieStore,
    { locale, menuId, sectionId },
    {
      page: rawPage,
      pageSize: rawPageSize,
      sortBy: rawSortBy,
      sortDirection: rawSortDirection,
      ...restSearchParams
    },
  ] = await Promise.all([cookies(), params, searchParams]);

  setRequestLocale(locale);

  const page = Math.max(1, Number(rawPage) || 1);
  const pageSize = Math.max(1, Number(rawPageSize) || 10);
  const SORT_BY_FIELDS = ["name", "createdAt", "updatedAt"] as const;
  const SORT_DIRECTIONS = ["asc", "desc"] as const;
  const sortBy = SORT_BY_FIELDS.find((field) => field === rawSortBy);
  const sortDirection = SORT_DIRECTIONS.find(
    (direction) => direction === rawSortDirection,
  );

  if (
    rawPage !== String(page) ||
    rawPageSize !== String(pageSize) ||
    rawSortBy !== sortBy ||
    rawSortDirection !== sortDirection
  ) {
    const params = new URLSearchParams({
      ...restSearchParams,
      page: String(page),
      pageSize: String(pageSize),
      ...(sortBy && { sortBy }),
      ...(sortDirection && { sortDirection }),
    });
    redirect({
      href: `/menus/${menuId}/${sectionId}?${params.toString()}`,
      locale,
    });
  }

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };
  const [menu, section, { items, total }] = await Promise.all([
    getAdminMenu(menuId, fetchOptions),
    getAdminMenuSection(sectionId, fetchOptions),
    getAdminMenuSectionItems(
      sectionId,
      page,
      pageSize,
      sortBy,
      sortDirection,
      fetchOptions,
    ),
  ]);

  if (!menu || !section) notFound();

  return (
    <MenusMenuIdSectionId
      items={items}
      page={page}
      pageSize={pageSize}
      rowCount={total}
      sectionId={sectionId}
      sortBy={sortBy}
      sortDirection={sortDirection}
    />
  );
};

export default MenusMenuIdSectionIdPage;
