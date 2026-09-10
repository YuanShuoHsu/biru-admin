import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import UserSessions from ".";

import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

interface UserSessionsPageProps {
  params: Promise<{ locale: Locale; userId: string }>;
}

export const generateMetadata = async ({
  params,
}: UserSessionsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return { title: t("admins.label") };
};

const UserSessionsPage = async ({ params }: UserSessionsPageProps) => {
  const [cookieStore, { locale, userId }] = await Promise.all([
    cookies(),
    params,
  ]);

  setRequestLocale(locale);

  const fetchOptions = {
    headers: {
      cookie: cookieStore.toString(),
      origin: process.env.NEXT_PUBLIC_ADMIN_URL!,
    },
  };

  const [{ data: user }, { data: sessionsData }] = await Promise.all([
    authClient.admin.getUser({ query: { id: userId }, fetchOptions }),
    authClient.admin.listUserSessions({ userId, fetchOptions }),
  ]);

  const initialRows = sessionsData?.sessions || [];

  if (!user) notFound();

  return <UserSessions initialRows={initialRows} user={user} />;
};

export default UserSessionsPage;
