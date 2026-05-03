import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import Menus from ".";

import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

interface MenusPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ organization?: string }>;
}

const MenusPage = async ({ params, searchParams }: MenusPageProps) => {
  const [cookieStore, { locale }, { organization }] = await Promise.all([
    cookies(),
    params,
    searchParams,
  ]);

  setRequestLocale(locale);

  if (!organization) notFound();

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };
  const { data } = await authClient.organization.list({ fetchOptions });

  const organizations = (data || []).toReversed();

  return <Menus organizations={organizations} />;
};

export default MenusPage;
