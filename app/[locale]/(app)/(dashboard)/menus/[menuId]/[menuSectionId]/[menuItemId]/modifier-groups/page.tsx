import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import MenuItemModifierGroups from ".";
import {
  FILTER_FIELDS,
  FILTER_OPERATORS,
  SORT_BY_FIELDS,
  SORT_DIRECTIONS,
} from "./constants";

import { NO_VALUE_FILTER_OPERATORS } from "@/constants/dataGrid";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import {
  getAdminMenu,
  getAdminMenuItemModifierGroups,
  getAdminMenuSection,
} from "@/utils/menus";

interface MenuItemModifierGroupsPageProps {
  params: Promise<{
    locale: Locale;
    menuId: string;
    menuSectionId: string;
    menuItemId: string;
  }>;
  searchParams: Promise<{
    filterField?: string;
    filterOperator?: string;
    filterValue?: string;
    page?: string;
    pageSize?: string;
    quickFilterValue?: string;
    sortBy?: string;
    sortDirection?: string;
  }>;
}

const MenuItemModifierGroupsPage = async ({
  params,
  searchParams,
}: MenuItemModifierGroupsPageProps) => {
  const [
    cookieStore,
    { locale, menuId, menuSectionId, menuItemId },
    {
      filterField: rawFilterField,
      filterOperator: rawFilterOperator,
      filterValue,
      page: rawPage,
      pageSize: rawPageSize,
      quickFilterValue,
      sortBy: rawSortBy,
      sortDirection: rawSortDirection,
      ...restSearchParams
    },
  ] = await Promise.all([cookies(), params, searchParams]);

  setRequestLocale(locale);

  const page = Math.max(1, Number(rawPage) || 1);
  const pageSize = Math.max(1, Number(rawPageSize) || 10);

  const sortBy = SORT_BY_FIELDS.find((field) => field === rawSortBy);
  const sortDirection = SORT_DIRECTIONS.find(
    (direction) => direction === rawSortDirection,
  );

  const filterField = FILTER_FIELDS.find((field) => field === rawFilterField);
  const filterOperator = FILTER_OPERATORS.find(
    (operator) => operator === rawFilterOperator,
  );

  if (
    rawPage !== String(page) ||
    rawPageSize !== String(pageSize) ||
    rawSortBy !== sortBy ||
    rawSortDirection !== sortDirection ||
    !!sortBy !== !!sortDirection ||
    rawFilterField !== filterField ||
    rawFilterOperator !== filterOperator ||
    !!(filterField || filterOperator || filterValue) !==
      !!(
        filterField &&
        filterOperator &&
        (filterValue || NO_VALUE_FILTER_OPERATORS.includes(filterOperator))
      )
  ) {
    const redirectParams = new URLSearchParams({
      ...restSearchParams,
      page: String(page),
      pageSize: String(pageSize),
      ...(sortBy && sortDirection && { sortBy, sortDirection }),
      ...(filterField &&
        filterOperator &&
        filterValue && { filterField, filterOperator, filterValue }),
    });
    redirect({
      href: `/menus/${menuId}/${menuSectionId}/${menuItemId}/modifier-groups?${redirectParams.toString()}`,
      locale,
    });
  }

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const [menu, section, { links, total }] = await Promise.all([
    getAdminMenu(menuId, fetchOptions),
    getAdminMenuSection(menuSectionId, fetchOptions),
    getAdminMenuItemModifierGroups(
      menuItemId,
      page,
      pageSize,
      filterField,
      filterOperator,
      filterValue,
      quickFilterValue,
      sortBy,
      sortDirection,
      fetchOptions,
    ),
  ]);

  if (!menu || !section) notFound();

  const [sessionData, fullOrgData] = await Promise.all([
    authClient.getSession({ fetchOptions }),
    authClient.organization.getFullOrganization({
      query: { organizationId: menu.organizationId },
      fetchOptions,
    }),
  ]);

  const currentUserId = sessionData.data?.user?.id;
  const members = fullOrgData.data?.members || [];
  const role = members.find(({ userId }) => userId === currentUserId)?.role;
  const canWrite = role === "owner" || role === "admin";

  return (
    <MenuItemModifierGroups
      canWrite={canWrite}
      filterField={filterField}
      filterOperator={filterOperator}
      filterValue={filterValue}
      links={links}
      menuId={menuId}
      menuItemId={menuItemId}
      page={page}
      pageSize={pageSize}
      quickFilterValue={quickFilterValue}
      rowCount={total}
      sortBy={sortBy}
      sortDirection={sortDirection}
    />
  );
};

export default MenuItemModifierGroupsPage;
