import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import MenuItemOffers from ".";

import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import {
  getAdminMenu,
  getAdminMenuItemOffers,
  getAdminMenuSection,
} from "@/utils/menus";

interface MenuItemOffersPageProps {
  params: Promise<{
    locale: Locale;
    menuId: string;
    menuSectionId: string;
    menuItemId: string;
  }>;
}

const MenuItemOffersPage = async ({ params }: MenuItemOffersPageProps) => {
  const [cookieStore, { locale, menuId, menuSectionId, menuItemId }] =
    await Promise.all([cookies(), params]);

  setRequestLocale(locale);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const [menu, section, offers] = await Promise.all([
    getAdminMenu(menuId, fetchOptions),
    getAdminMenuSection(menuSectionId, fetchOptions),
    getAdminMenuItemOffers(menuItemId, fetchOptions),
  ]);

  if (!menu || !section) notFound();

  const [sessionData, fullOrgData] = await Promise.all([
    authClient.getSession({ fetchOptions }),
    authClient.organization.getFullOrganization({
      query: { organizationId: menu.organizationId },
      fetchOptions,
    }),
  ]);

  const currentUserId = sessionData.data?.user?.id;
  const members = fullOrgData.data?.members || [];
  const role = members.find(({ userId }) => userId === currentUserId)?.role;
  const canWrite = role === "owner" || role === "admin";

  return (
    <MenuItemOffers
      canWrite={canWrite}
      menuItemId={menuItemId}
      offers={offers}
    />
  );
};

export default MenuItemOffersPage;
