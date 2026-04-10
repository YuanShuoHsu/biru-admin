import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import Sessions from ".";

import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

interface SessionsPageProps {
  params: Promise<{ locale: Locale; userId: string }>;
}

const SessionsPage = async ({ params }: SessionsPageProps) => {
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

  return <Sessions user={user} initialRows={initialRows} />;
};

export default SessionsPage;
