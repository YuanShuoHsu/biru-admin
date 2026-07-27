import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import MenuItemAddOns from ".";

import { NO_VALUE_FILTER_OPERATORS } from "@/constants/dataGrid";
import { DEFAULT_PAGE_SIZE } from "@/constants/pagination";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import {
  addOnFilterFieldValues,
  addOnSortFieldValues,
  filterOperatorValues,
  sortDirectionValues,
} from "@/types/api";

import {
  DEFAULT_MENUS_HREF,
  getAdminMenu,
  getAdminMenuItemAddOns,
  getAdminMenuSection,
  getAdminOrganization,
} from "@/utils/menus";

interface MenuItemAddOnsPageProps {
  params: Promise<{
    locale: Locale;
    menuSectionId: string;
    menuItemId: string;
  }>;
  searchParams: Promise<{
    filterField?: string;
    filterOperator?: string;
    filterValue?: string;
    organization?: string;
    page?: string;
    pageSize?: string;
    quickFilterValue?: string;
    sortBy?: string;
    sortDirection?: string;
  }>;
}

const MenuItemAddOnsPage = async ({
  params,
  searchParams,
}: MenuItemAddOnsPageProps) => {
  const [
    cookieStore,
    { locale, menuSectionId, menuItemId },
    {
      filterField: rawFilterField,
      filterOperator: rawFilterOperator,
      filterValue,
      organization,
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
  const pageSize = Math.max(1, Number(rawPageSize) || DEFAULT_PAGE_SIZE);

  const sortBy = addOnSortFieldValues.find((field) => field === rawSortBy);
  const sortDirection = sortDirectionValues.find(
    (direction) => direction === rawSortDirection,
  );

  const filterField = addOnFilterFieldValues.find(
    (field) => field === rawFilterField,
  );
  const filterOperator = filterOperatorValues.find(
    (operator) => operator === rawFilterOperator,
  );

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };
  const section = await getAdminMenuSection(menuSectionId, fetchOptions);

  if (!section?.menuId) notFound();

  const [menu, selectedOrganization] = await Promise.all([
    getAdminMenu(section.menuId, fetchOptions),
    getAdminOrganization(organization, fetchOptions),
  ]);

  if (!selectedOrganization || selectedOrganization.id !== menu?.organizationId)
    return redirect({ href: DEFAULT_MENUS_HREF, locale });

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
      organization: selectedOrganization.slug,
      page: String(page),
      pageSize: String(pageSize),
      ...(sortBy && sortDirection && { sortBy, sortDirection }),
      ...(filterField &&
        filterOperator &&
        filterValue && { filterField, filterOperator, filterValue }),
    });

    redirect({
      href: `/menus/sections/${menuSectionId}/${menuItemId}/add-ons?${redirectParams.toString()}`,
      locale,
    });
  }

  const [{ addOns, total }, sessionData, fullOrgData] = await Promise.all([
    getAdminMenuItemAddOns(
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
    <MenuItemAddOns
      addOns={addOns}
      canWrite={canWrite}
      filterField={filterField}
      filterOperator={filterOperator}
      filterValue={filterValue}
      menuId={menu.id}
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

export default MenuItemAddOnsPage;
