import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import MenusMenuId from ".";

import type { Locale } from "@/i18n/routing";

import { getAdminMenu, getAdminMenuSections } from "@/utils/admin-menus";

interface MenusMenuIdPageProps {
  params: Promise<{ locale: Locale; menuId: string }>;
}

const MenusMenuIdPage = async ({ params }: MenusMenuIdPageProps) => {
  const [cookieStore, { locale, menuId }] = await Promise.all([
    cookies(),
    params,
  ]);
  setRequestLocale(locale);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };
  const [menu, sections] = await Promise.all([
    getAdminMenu(menuId, fetchOptions),
    getAdminMenuSections(menuId, fetchOptions),
  ]);

  if (!menu) notFound();

  return <MenusMenuId menu={menu} sections={sections} />;
};

export default MenusMenuIdPage;
