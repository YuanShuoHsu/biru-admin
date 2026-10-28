import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

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
import type { UserSession } from "@/types/admins";

import { getGridSearchParams, resolveGridSearchParams } from "@/utils/dataGrid";
import { fetcher, isMissingResource, settle } from "@/utils/fetcher";

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

const UserSessionsContent = async ({
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

  const [{ data: user, error }, { data: sessions, error: sessionsError }] =
    await Promise.all([
      authClient.admin.getUser({
        query: { id: userId },
        fetchOptions: {
          headers: { cookie, origin: process.env.NEXT_PUBLIC_ADMIN_URL! },
        },
      }),
      settle(
        fetcher<{ data: UserSession[]; total: number }>(
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
      ),
    ]);

  if (
    error?.status === 403 ||
    error?.status === 404 ||
    isMissingResource(sessionsError)
  )
    notFound();
  if (error || sessionsError) return <ErrorAlert />;
  if (!user) notFound();

  const { data: rows, total: rowCount } = sessions;

  return (
    <UserSessions
      filterField={filterField}
      filterOperator={filterOperator}
      filterValue={filterValue}
      page={page}
      pageSize={pageSize}
      quickFilterValue={quickFilterValue}
      rowCount={rowCount}
      rows={rows}
      sortBy={sortBy}
      sortDirection={sortDirection}
      user={user}
    />
  );
};

const UserSessionsPage = (props: UserSessionsPageProps) => (
  <Suspense fallback={<UserSessions loading />}>
    <UserSessionsContent {...props} />
  </Suspense>
);

export default UserSessionsPage;
