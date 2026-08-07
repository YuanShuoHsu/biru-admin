import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";

import Admins from ".";

import { NO_VALUE_FILTER_OPERATORS } from "@/constants/dataGrid";
import { DEFAULT_PAGE_SIZE } from "@/constants/pagination";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  sortDirectionValues,
  userFilterFieldValues,
  userFilterOperatorValues,
  userSortFieldValues,
} from "@/types/api";

import type { User } from "@/types/admins";

import { getUserSessions } from "@/utils/admins";
import { fetcher } from "@/utils/fetcher";

interface AdminsPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    filterField?: string;
    filterOperator?: string;
    filterValue?: string;
    quickFilterEnums?: string | string[];
    quickFilterValue?: string;
    searchField?: string;
    searchOperator?: string;
    searchValue?: string;
    sortBy?: string;
    sortDirection?: string;
  }>;
}

export const generateMetadata = async ({
  params,
}: AdminsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return { title: t("admins.label") };
};

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
      quickFilterEnums: rawQuickFilterEnums,
      quickFilterValue: rawQuickFilterValue,
      sortBy: rawSortBy,
      sortDirection: rawSortDirection,
    },
  ] = await Promise.all([cookies(), params, searchParams]);

  setRequestLocale(locale);

  const quickFilterEnums = [rawQuickFilterEnums || []].flat();

  const page = Math.max(1, Number(rawPage) || 1);
  const pageSize = Math.max(1, Number(rawPageSize) || DEFAULT_PAGE_SIZE);

  const sortBy = userSortFieldValues.find((field) => field === rawSortBy);
  const sortDirection = sortDirectionValues.find(
    (direction) => direction === rawSortDirection,
  );

  const filterField = userFilterFieldValues.find(
    (field) => field === rawFilterField,
  );
  const filterOperator = userFilterOperatorValues.find(
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
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      ...(sortBy && sortDirection && { sortBy, sortDirection }),
      ...(filterField &&
        filterOperator &&
        (filterValue || NO_VALUE_FILTER_OPERATORS.includes(filterOperator)) && {
          filterField,
          filterOperator,
          ...(filterValue && { filterValue }),
        }),
      ...(rawQuickFilterValue && { quickFilterValue: rawQuickFilterValue }),
    });
    for (const entry of quickFilterEnums)
      params.append("quickFilterEnums", entry);

    redirect({ href: `/admins?${params.toString()}`, locale });
  }

  const fetchOptions = {
    headers: {
      cookie: cookieStore.toString(),
      origin: process.env.NEXT_PUBLIC_ADMIN_URL!,
    },
  };

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
    ...(rawQuickFilterValue && { quickFilterValue: rawQuickFilterValue }),
    sortBy: sortBy || "createdAt",
    sortDirection: sortDirection || "desc",
  });
  for (const entry of quickFilterEnums)
    queryParams.append("quickFilterEnums", entry);

  const { data, total } = await fetcher<{
    data: User[];
    total: number;
  }>(`/api/users/list?${queryParams}`, { headers: fetchOptions.headers });

  const rows: User[] = data || [];
  const rowCount = total || 0;

  const userSessions = await getUserSessions(rows, fetchOptions);

  return (
    <Admins
      filterField={filterField}
      filterOperator={filterOperator}
      filterValue={filterValue}
      page={page}
      pageSize={pageSize}
      quickFilterValue={rawQuickFilterValue}
      rows={rows}
      rowCount={rowCount}
      sortBy={sortBy}
      sortDirection={sortDirection}
      userSessions={userSessions}
    />
  );
};

export default AdminsPage;
