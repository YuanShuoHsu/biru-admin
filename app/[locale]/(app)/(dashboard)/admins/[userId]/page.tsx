import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import UserSessions from ".";

import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

interface UserSessionsPageProps {
  params: Promise<{ locale: Locale; userId: string }>;
}

const UserSessionsPage = async ({ params }: UserSessionsPageProps) => {
  const [cookieStore, { locale, userId }] = await Promise.all([
    cookies(),
    params,
  ]);

  setRequestLocale(locale);

  const fetchOptions = {
    headers: {
      cookie: cookieStore.toString(),
      origin: process.env.NEXT_PUBLIC_NEXT_URL!,
    },
  };

  const [{ data: userData }, { data: sessionsData }] = await Promise.all([
    authClient.admin.listUsers({
      query: {
        limit: 1,
        offset: 0,
        filterField: "id",
        filterValue: userId,
        filterOperator: "eq",
      },
      fetchOptions,
    }),
    authClient.admin.listUserSessions({ userId, fetchOptions }),
  ]);

  const user = userData?.users[0];
  const initialRows = sessionsData?.sessions || [];

  if (!user) notFound();

  return <UserSessions initialRows={initialRows} user={user} />;
};

export default UserSessionsPage;
