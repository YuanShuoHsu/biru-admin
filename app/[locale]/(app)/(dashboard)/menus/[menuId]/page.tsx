import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import MenuDetail from ".";

import type { Locale } from "@/i18n/routing";

import {
  getAdminMenu,
  getAdminMenuItems,
  getAdminMenuSections,
} from "@/utils/admin-menus";

interface MenuIdPageProps {
  params: Promise<{ locale: Locale; menuId: string }>;
}

const MenuIdPage = async ({ params }: MenuIdPageProps) => {
  const [cookieStore, { locale, menuId }] = await Promise.all([
    cookies(),
    params,
  ]);
  setRequestLocale(locale);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };
  const [menu, sections, items] = await Promise.all([
    getAdminMenu(menuId, fetchOptions),
    getAdminMenuSections(menuId, fetchOptions),
    getAdminMenuItems(menuId, fetchOptions),
  ]);

  if (!menu) notFound();

  return (
    <MenuDetail menu={menu} initialSections={sections} initialItems={items} />
  );
};

export default MenuIdPage;
