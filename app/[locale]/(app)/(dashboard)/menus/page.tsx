import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";

import Menus from ".";

import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import type { Menu } from "@/types/menus";

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

  const selectedOrganization = organizations.find(
    ({ slug }) => slug === organization,
  );

  const [menus, sessionData, fullOrgData] = await Promise.all([
    selectedOrganization
      ? fetcher<Menu[]>(
          `/api/organizations/${selectedOrganization.id}/menus`,
          fetchOptions,
        )
      : Promise.resolve([]),
    authClient.getSession({ fetchOptions }),
    selectedOrganization
      ? authClient.organization.getFullOrganization({
          query: { organizationSlug: selectedOrganization.slug },
          fetchOptions,
        })
      : Promise.resolve({ data: null }),
  ]);

  const currentUserId = sessionData.data?.user?.id;
  const members = fullOrgData.data?.members || [];
  const role = members.find(({ userId }) => userId === currentUserId)?.role;
  const canWrite = role === "owner" || role === "admin";

  return (
    <Menus
      canWrite={canWrite}
      menus={menus}
      organizations={organizations}
      organizationSlug={selectedOrganization?.slug || ""}
    />
  );
};

export default MenusPage;
