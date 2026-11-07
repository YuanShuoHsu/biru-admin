// https://nextjs.org/docs/app/guides/streaming#status-codes

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { type ComponentProps, Suspense } from "react";

import Admins from ".";

import ErrorAlert from "@/components/ErrorAlert";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  userFilterFieldValues,
  userFilterOperatorValues,
  userSortFieldValues,
} from "@/types/api";

import type { User, UserListResponse } from "@/types/admins";

import {
  getGridSearchParams,
  getQuickFilterEnums,
  resolveGridSearchParams,
} from "@/utils/dataGrid";
import { getAdminEnumOptions } from "@/utils/enumOptions";
import { type FetchResult, fetcher, settle } from "@/utils/fetcher";
import { getSession } from "@/utils/session";

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

interface AdminsContentProps
  extends Omit<ComponentProps<typeof Admins>, "loading" | "rowCount" | "rows"> {
  users: Promise<FetchResult<UserListResponse>>;
}

const AdminsContent = async ({ users, ...props }: AdminsContentProps) => {
  const { data, error } = await users;
  if (error?.status === 403) notFound();
  if (error) return <ErrorAlert />;

  const rows: User[] = data.data || [];
  const rowCount = data.total || 0;

  return <Admins {...props} rows={rows} rowCount={rowCount} />;
};

const AdminsPage = async ({ params, searchParams }: AdminsPageProps) => {
  const [session, cookieStore, { locale }, rawSearchParams] = await Promise.all(
    [getSession(), cookies(), params, searchParams],
  );

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

  if (session?.user?.role !== "admin") notFound();

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

  const queryParams = getGridSearchParams({
    page,
    pageSize,
    filterField,
    filterOperator,
    filterValue,
    quickFilterEnums,
    quickFilterValue,
    sortBy,
    sortDirection,
  });

  const users = settle(
    fetcher<UserListResponse>(`/api/users/list?${queryParams}`, {
      headers: fetchOptions.headers,
    }),
  );

  const adminsProps = {
    filterField,
    filterOperator,
    filterValue,
    page,
    pageSize,
    quickFilterValue,
    sortBy,
    sortDirection,
  };

  return (
    <Suspense fallback={<Admins {...adminsProps} loading />}>
      <AdminsContent {...adminsProps} users={users} />
    </Suspense>
  );
};

export default AdminsPage;
