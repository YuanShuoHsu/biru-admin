import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";

import Admins from ".";

import {
  FILTER_FIELDS,
  FILTER_OPERATORS,
  SEARCH_FIELDS,
  SEARCH_OPERATORS,
  SORT_BY_FIELDS,
  SORT_DIRECTIONS,
} from "./constants";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import { getUserSessions } from "@/utils/admins";

interface AdminsPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    filterField?: string;
    filterOperator?: string;
    filterValue?: string;
    searchField?: string;
    searchOperator?: string;
    searchValue?: string;
    sortBy?: string;
    sortDirection?: string;
  }>;
}

const AdminsPage = async ({ params, searchParams }: AdminsPageProps) => {
  const [
    cookieStore,
    { locale },
    {
      page: rawPage,
      pageSize: rawPageSize,
      filterField: rawFilterField,
      filterOperator: rawFilterOperator,
      filterValue,
      searchField: rawSearchField,
      searchOperator: rawSearchOperator,
      searchValue,
      sortBy: rawSortBy,
      sortDirection: rawSortDirection,
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

  const searchField = SEARCH_FIELDS.find((field) => field === rawSearchField);
  const searchOperator = SEARCH_OPERATORS.find(
    (operator) => operator === rawSearchOperator,
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
      !!(filterField && filterOperator && filterValue) ||
    rawSearchField !== searchField ||
    rawSearchOperator !== searchOperator ||
    !!(searchField || searchOperator || searchValue) !==
      !!(searchField && searchOperator && searchValue)
  ) {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      ...(sortBy && sortDirection && { sortBy, sortDirection }),
      ...(filterField &&
        filterOperator &&
        filterValue && {
          filterField,
          filterOperator,
          filterValue,
        }),
      ...(searchField &&
        searchOperator &&
        searchValue && {
          searchField,
          searchOperator,
          searchValue,
        }),
    });
    redirect({ href: `/admins?${params.toString()}`, locale });
  }

  const fetchOptions = {
    headers: {
      cookie: cookieStore.toString(),
      origin: process.env.NEXT_PUBLIC_ADMIN_URL!,
    },
  };

  const { data } = await authClient.admin.listUsers({
    query: {
      limit: pageSize,
      offset: (page - 1) * pageSize,
      sortBy: sortBy || "createdAt",
      sortDirection: sortDirection || "desc",
      ...(filterField &&
        filterOperator &&
        filterValue && {
          filterField,
          filterOperator,
          filterValue,
        }),
      ...(searchField &&
        searchOperator &&
        searchValue && {
          searchField,
          searchOperator,
          searchValue,
        }),
    },
    fetchOptions,
  });

  const rows = data?.users || [];
  const rowCount = data?.total || 0;

  const userSessions = await getUserSessions(rows, fetchOptions);

  return (
    <Admins
      rows={rows}
      rowCount={rowCount}
      page={page}
      pageSize={pageSize}
      filterField={filterField}
      filterOperator={filterOperator}
      filterValue={filterValue}
      searchField={searchField}
      searchOperator={searchOperator}
      searchValue={searchValue}
      sortBy={sortBy}
      sortDirection={sortDirection}
      userSessions={userSessions}
    />
  );
};

export default AdminsPage;
