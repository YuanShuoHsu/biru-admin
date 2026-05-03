import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";

import Menus from ".";

import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import type { AdminMenu } from "@/types/menus";

import { fetcher } from "@/utils/fetcher";

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

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };
  const { data } = await authClient.organization.list({ fetchOptions });

  const organizations = (data || []).toReversed();

  const selectedOrg = organizations.find(({ slug }) => slug === organization);

  const rows = selectedOrg
    ? await fetcher<AdminMenu[]>(
        `/api/organizations/${selectedOrg.id}/menus`,
        fetchOptions,
      ).catch(() => [] as AdminMenu[])
    : [];

  return (
    <Menus
      organizations={organizations}
      organizationSlug={organization || ""}
      rows={rows}
    />
  );
};

export default MenusPage;
