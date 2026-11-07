// https://nextjs.org/docs/app/guides/streaming#status-codes

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { type ComponentProps, Suspense } from "react";

import UserSessions from ".";

import ErrorAlert from "@/components/ErrorAlert";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import {
  filterOperatorValues,
  userSessionFilterFieldValues,
  userSessionSortFieldValues,
} from "@/types/api";
import type { UserSessionListResponse } from "@/types/admins";

import { getGridSearchParams, resolveGridSearchParams } from "@/utils/dataGrid";
import { type FetchResult, fetcher, settle } from "@/utils/fetcher";

interface UserSessionsPageProps {
  params: Promise<{ locale: Locale; userId: string }>;
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

export const generateMetadata = async ({
  params,
}: UserSessionsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAdmins = await getTranslations({ locale, namespace: "admins" });

  return { title: tAdmins("label") };
};

interface UserSessionsContentProps
  extends Omit<
    ComponentProps<typeof UserSessions>,
    "loading" | "rowCount" | "rows"
  > {
  sessions: Promise<FetchResult<UserSessionListResponse>>;
}

const UserSessionsContent = async ({
  sessions,
  ...props
}: UserSessionsContentProps) => {
  const { data, error } = await sessions;
  if (error?.status === 403 || error?.status === 404) notFound();
  if (error) return <ErrorAlert />;

  const { data: rows, total: rowCount } = data;

  return <UserSessions {...props} rowCount={rowCount} rows={rows} />;
};

const UserSessionsPage = async ({
  params,
  searchParams,
}: UserSessionsPageProps) => {
  const [cookieStore, { locale, userId }, rawSearchParams] = await Promise.all([
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
    sortFields: userSessionSortFieldValues,
    filterFields: userSessionFilterFieldValues,
    filterOperators: filterOperatorValues,
  });

  if (redirectParams)
    redirect({
      href: `/admins/${userId}?${redirectParams.toString()}`,
      locale,
    });

  const cookie = cookieStore.toString();

  const sessions = settle(
    fetcher<UserSessionListResponse>(
      `/api/users/${userId}/sessions?${getGridSearchParams({
        page,
        pageSize,
        filterField,
        filterOperator,
        filterValue,
        quickFilterValue,
        sortBy,
        sortDirection,
      })}`,
      { headers: { cookie } },
    ),
  );

  const { data: user, error } = await authClient.admin.getUser({
    query: { id: userId },
    fetchOptions: {
      headers: { cookie, origin: process.env.NEXT_PUBLIC_ADMIN_URL! },
    },
  });
  if (error?.status === 403 || error?.status === 404) notFound();
  if (error) return <ErrorAlert />;
  if (!user) notFound();

  const userSessionsProps = {
    filterField,
    filterOperator,
    filterValue,
    page,
    pageSize,
    quickFilterValue,
    sortBy,
    sortDirection,
    user,
  };

  return (
    <Suspense fallback={<UserSessions {...userSessionsProps} loading />}>
      <UserSessionsContent {...userSessionsProps} sessions={sessions} />
    </Suspense>
  );
};

export default UserSessionsPage;
