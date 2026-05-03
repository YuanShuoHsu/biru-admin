import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";

import Menus from ".";

import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

interface MenusPageProps {
  params: Promise<{ locale: Locale }>;
}

const MenusPage = async ({ params }: MenusPageProps) => {
  const [cookieStore, { locale }] = await Promise.all([cookies(), params]);

  setRequestLocale(locale);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const { data } = await authClient.organization.list({ fetchOptions });

  const organizations = (data || []).toReversed();

  return <Menus organizations={organizations} />;
};

export default MenusPage;
