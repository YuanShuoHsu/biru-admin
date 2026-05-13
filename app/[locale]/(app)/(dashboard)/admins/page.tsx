import type { UserWithRole } from "better-auth/client/plugins";
import { getMessages, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";

import Admins from ".";
import {
  FILTER_FIELDS,
  FILTER_OPERATORS,
  NO_VALUE_FILTER_OPERATORS,
  SORT_BY_FIELDS,
  SORT_DIRECTIONS,
} from "./constants";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { getQuickFilterValue, getUserSessions } from "@/utils/admins";
import { fetcher } from "@/utils/fetcher";

interface AdminsPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    filterField?: string;
    filterOperator?: string;
    filterValue?: string;
    quickFilterValue?: string;
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
      filterField: rawFilterField,
      filterOperator: rawFilterOperator,
      filterValue,
      page: rawPage,
      pageSize: rawPageSize,
      quickFilterValue: rawQuickFilterValue,
      // searchField: rawSearchField,
      // searchOperator: rawSearchOperator,
      // searchValue,
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

  // const searchField = SEARCH_FIELDS.find((field) => field === rawSearchField);
  // const searchOperator = SEARCH_OPERATORS.find(
  //   (operator) => operator === rawSearchOperator,
  // );

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
    // ||
    // rawSearchField !== searchField ||
    // rawSearchOperator !== searchOperator ||
    // !!(searchField || searchOperator || searchValue) !==
    //   !!(searchField && searchOperator && searchValue)
  ) {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      ...(sortBy && sortDirection && { sortBy, sortDirection }),
      ...(filterField &&
        filterOperator &&
        filterValue && { filterField, filterOperator, filterValue }),
      ...(rawQuickFilterValue && { quickFilterValue: rawQuickFilterValue }),
      // ...(searchField &&
      //   searchOperator &&
      //   searchValue && { searchField, searchOperator, searchValue }),
    });
    redirect({ href: `/admins?${params.toString()}`, locale });
  }

  const fetchOptions = {
    headers: {
      cookie: cookieStore.toString(),
      origin: process.env.NEXT_PUBLIC_ADMIN_URL!,
    },
  };

  const messages = await getMessages();
  const quickFilterMessages = messages.admins;
  const quickFilterValue = getQuickFilterValue(
    quickFilterMessages,
    rawQuickFilterValue || "",
  );

  const queryParams = new URLSearchParams({
    ...(filterField &&
      filterOperator &&
      (filterValue || NO_VALUE_FILTER_OPERATORS.includes(filterOperator)) && {
        filterField,
        filterOperator,
        ...(filterValue && { filterValue }),
      }),
    limit: String(pageSize),
    offset: String((page - 1) * pageSize),
    ...(quickFilterValue && { quickFilterValue }),
    sortBy: sortBy || "createdAt",
    sortDirection: sortDirection || "desc",
  });

  const { data, total } = await fetcher<{
    data: UserWithRole[];
    total: number;
  }>(`/api/users/list?${queryParams}`, { headers: fetchOptions.headers });

  const rows: UserWithRole[] = data || [];
  const rowCount = total || 0;

  const userSessions = await getUserSessions(rows, fetchOptions);

  return (
    <Admins
      filterField={filterField}
      filterOperator={filterOperator}
      filterValue={filterValue}
      page={page}
      pageSize={pageSize}
      quickFilterMessages={quickFilterMessages}
      quickFilterValue={rawQuickFilterValue}
      rows={rows}
      rowCount={rowCount}
      // searchField={searchField}
      // searchOperator={searchOperator}
      // searchValue={searchValue}
      sortBy={sortBy}
      sortDirection={sortDirection}
      userSessions={userSessions}
    />
  );
};

export default AdminsPage;
