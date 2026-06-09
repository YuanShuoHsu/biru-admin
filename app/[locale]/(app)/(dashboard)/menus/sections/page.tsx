import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";

import MenusSections from ".";
import { FILTER_FIELDS, SORT_BY_FIELDS } from "./constants";

import {
  FILTER_OPERATORS,
  NO_VALUE_FILTER_OPERATORS,
  SORT_DIRECTIONS,
} from "@/constants/dataGrid";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import { getAdminMenuSections, getAdminOrganizationMenu } from "@/utils/menus";

import MenusTabsLayout from "../MenusTabsLayout";

interface MenusSectionsPageProps {
  params: Promise<{ locale: Locale }>;
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

const MenusSectionsPage = async ({
  params,
  searchParams,
}: MenusSectionsPageProps) => {
  const [
    cookieStore,
    { locale },
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
  const pageSize = Math.max(1, Number(rawPageSize) || 10);

  const sortBy = SORT_BY_FIELDS.find((field) => field === rawSortBy);
  const sortDirection = SORT_DIRECTIONS.find(
    (direction) => direction === rawSortDirection,
  );

  const filterField = FILTER_FIELDS.find((field) => field === rawFilterField);
  const filterOperator = FILTER_OPERATORS.find(
    (operator) => operator === rawFilterOperator,
  );

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const { organization: selectedOrganization, menu } =
    await getAdminOrganizationMenu(organization, fetchOptions);

  if (!selectedOrganization || !menu)
    return <MenusTabsLayout>{null}</MenusTabsLayout>;

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
    const params = new URLSearchParams({
      ...restSearchParams,
      organization: selectedOrganization.slug,
      page: String(page),
      pageSize: String(pageSize),
      ...(sortBy && sortDirection && { sortBy, sortDirection }),
      ...(filterField &&
        filterOperator &&
        filterValue && { filterField, filterOperator, filterValue }),
    });

    redirect({ href: `/menus/sections?${params.toString()}`, locale });
  }

  const [{ sections, total }, sessionData, fullOrgData] = await Promise.all([
    getAdminMenuSections(
      menu.id,
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
    <MenusTabsLayout canWrite={canWrite} menu={menu}>
      <MenusSections
        canWrite={canWrite}
        filterField={filterField}
        filterOperator={filterOperator}
        filterValue={filterValue}
        menu={menu}
        page={page}
        pageSize={pageSize}
        quickFilterValue={quickFilterValue}
        rowCount={total}
        sections={sections}
        sortBy={sortBy}
        sortDirection={sortDirection}
      />
    </MenusTabsLayout>
  );
};

export default MenusSectionsPage;
