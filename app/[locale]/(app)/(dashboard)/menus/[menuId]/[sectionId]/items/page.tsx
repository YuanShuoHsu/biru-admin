import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import MenusMenuIdSectionIdItems from ".";

import type { Locale } from "@/i18n/routing";

import {
  getAdminMenu,
  getAdminMenuSectionItems,
  getAdminMenuSections,
} from "@/utils/admin-menus";

interface MenusMenuIdSectionIdItemsPageProps {
  params: Promise<{ locale: Locale; menuId: string; sectionId: string }>;
}

const MenusMenuIdSectionIdItemsPage = async ({
  params,
}: MenusMenuIdSectionIdItemsPageProps) => {
  const [cookieStore, { locale, menuId, sectionId }] = await Promise.all([
    cookies(),
    params,
  ]);
  setRequestLocale(locale);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };
  const [menu, sections, items] = await Promise.all([
    getAdminMenu(menuId, fetchOptions),
    getAdminMenuSections(menuId, fetchOptions),
    getAdminMenuSectionItems(sectionId, fetchOptions),
  ]);

  if (!menu || !sections.some(({ id }) => id === sectionId)) notFound();

  return (
    <MenusMenuIdSectionIdItems
      menuId={menuId}
      sectionId={sectionId}
      initialSections={sections}
      initialItems={items}
    />
  );
};

export default MenusMenuIdSectionIdItemsPage;
