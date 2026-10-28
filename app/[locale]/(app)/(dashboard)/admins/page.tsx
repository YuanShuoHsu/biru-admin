import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import Admins from ".";

import ErrorAlert from "@/components/ErrorAlert";

import { NO_VALUE_FILTER_OPERATORS } from "@/constants/dataGrid";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  userFilterFieldValues,
  userFilterOperatorValues,
  userSortFieldValues,
} from "@/types/api";

import type { User } from "@/types/admins";

import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getAdminEnumOptions } from "@/utils/enumOptions";
import { fetcher, settle } from "@/utils/fetcher";

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
    sortBy?: string;
    sortDirection?: string;
  }>;
}

export const generateMetadata = async ({
  params,
}: AdminsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAdmins = await getTranslations({ locale, namespace: "admins" });

  return { title: tAdmins("label") };
};

const AdminsContent = async ({ params, searchParams }: AdminsPageProps) => {
  const [cookieStore, { locale }, rawSearchParams] = await Promise.all([
    cookies(),
    params,
    searchParams,
  ]);

  const {
    filterField,
    filterOperator,
    filterValue,
    page,
    pageSize,
    quickFilterValue,
    redirectParams,
    sortBy,
    sortDirection,
  } = resolveGridSearchParams({
    searchParams: rawSearchParams,
    sortFields: userSortFieldValues,
    filterFields: userFilterFieldValues,
    filterOperators: userFilterOperatorValues,
  });

  if (redirectParams)
    redirect({ href: `/admins?${redirectParams.toString()}`, locale });

  const tAdmins = await getTranslations({ locale, namespace: "admins" });

  const quickFilterEnums = quickFilterValue
    ? getQuickFilterEnums(quickFilterValue, getAdminEnumOptions(tAdmins))
    : [];

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
    ...(quickFilterValue && { quickFilterValue }),
    sortBy: sortBy || "createdAt",
    sortDirection: sortDirection || "desc",
  });
  for (const entry of quickFilterEnums)
    queryParams.append("quickFilterEnums", entry);

  const { data: users, error } = await settle(
    fetcher<{ data: User[]; total: number }>(`/api/users/list?${queryParams}`, {
      headers: fetchOptions.headers,
    }),
  );
  if (error?.status === 403) notFound();
  if (error) return <ErrorAlert />;

  const { data: rows, total: rowCount } = users;

  return (
    <Admins
      filterField={filterField}
      filterOperator={filterOperator}
      filterValue={filterValue}
      page={page}
      pageSize={pageSize}
      quickFilterValue={quickFilterValue}
      rows={rows}
      rowCount={rowCount}
      sortBy={sortBy}
      sortDirection={sortDirection}
    />
  );
};

const AdminsPage = (props: AdminsPageProps) => (
  <Suspense fallback={<Admins loading />}>
    <AdminsContent {...props} />
  </Suspense>
);

export default AdminsPage;
