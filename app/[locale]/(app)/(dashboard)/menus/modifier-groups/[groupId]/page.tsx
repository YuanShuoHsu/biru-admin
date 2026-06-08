import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import Modifiers from ".";
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
  DEFAULT_MENUS_HREF,
  getAdminMenu,
  getAdminModifierGroup,
  getAdminModifiers,
  getAdminOrganization,
} from "@/utils/menus";

interface ModifiersPageProps {
  params: Promise<{ locale: Locale; groupId: string }>;
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

const ModifiersPage = async ({ params, searchParams }: ModifiersPageProps) => {
  const [
    cookieStore,
    { locale, groupId },
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
  const group = await getAdminModifierGroup(groupId, fetchOptions);

  if (!group?.menuId) notFound();

  const [menu, selectedOrganization] = await Promise.all([
    getAdminMenu(group.menuId, fetchOptions),
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

    redirect({
      href: `/menus/modifier-groups/${groupId}?${params.toString()}`,
      locale,
    });
  }

  const [{ modifiers, total }, sessionData, fullOrgData] = await Promise.all([
    getAdminModifiers(
      groupId,
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
    <Modifiers
      canWrite={canWrite}
      filterField={filterField}
      filterOperator={filterOperator}
      filterValue={filterValue}
      group={group}
      modifiers={modifiers}
      page={page}
      pageSize={pageSize}
      quickFilterValue={quickFilterValue}
      rowCount={total}
      sortBy={sortBy}
      sortDirection={sortDirection}
    />
  );
};

export default ModifiersPage;
