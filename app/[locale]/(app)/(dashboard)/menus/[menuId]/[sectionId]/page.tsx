import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import MenusMenuIdSectionId from ".";

import type { Locale } from "@/i18n/routing";

import {
  getMenu,
  getMenuSectionItems,
  getMenuSections,
} from "@/utils/menus";

interface MenusMenuIdSectionIdPageProps {
  params: Promise<{ locale: Locale; menuId: string; sectionId: string }>;
}

const MenusMenuIdSectionIdPage = async ({
  params,
}: MenusMenuIdSectionIdPageProps) => {
  const [cookieStore, { locale, menuId, sectionId }] = await Promise.all([
    cookies(),
    params,
  ]);
  setRequestLocale(locale);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };
  const [menu, sections, items] = await Promise.all([
    getMenu(menuId, fetchOptions),
    getMenuSections(menuId, fetchOptions),
    getMenuSectionItems(sectionId, fetchOptions),
  ]);
  const section = sections.find(({ id }) => id === sectionId);

  if (!menu || !section) notFound();

  return (
    <MenusMenuIdSectionId
      items={items}
      sections={sections}
      sectionId={sectionId}
    />
  );
};

export default MenusMenuIdSectionIdPage;
