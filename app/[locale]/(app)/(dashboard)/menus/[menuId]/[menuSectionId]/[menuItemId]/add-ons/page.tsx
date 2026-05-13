import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import MenuItemAddOns from ".";

import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import { getAdminMenu, getAdminMenuItemAddOns, getAdminMenuSection } from "@/utils/menus";

interface MenuItemAddOnsPageProps {
  params: Promise<{
    locale: Locale;
    menuId: string;
    menuSectionId: string;
    menuItemId: string;
  }>;
}

const MenuItemAddOnsPage = async ({ params }: MenuItemAddOnsPageProps) => {
  const [cookieStore, { locale, menuId, menuSectionId, menuItemId }] =
    await Promise.all([cookies(), params]);

  setRequestLocale(locale);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const [menu, section, addOns] = await Promise.all([
    getAdminMenu(menuId, fetchOptions),
    getAdminMenuSection(menuSectionId, fetchOptions),
    getAdminMenuItemAddOns(menuItemId, fetchOptions),
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
    <MenuItemAddOns
      addOns={addOns}
      canWrite={canWrite}
      menuId={menuId}
      menuItemId={menuItemId}
    />
  );
};

export default MenuItemAddOnsPage;
