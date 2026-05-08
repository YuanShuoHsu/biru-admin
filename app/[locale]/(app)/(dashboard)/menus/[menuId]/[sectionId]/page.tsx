import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import MenusMenuIdSectionId from ".";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  getAdminMenu,
  getAdminMenuSection,
  getAdminMenuSectionItems,
} from "@/utils/menus";

interface MenusMenuIdSectionIdPageProps {
  params: Promise<{ locale: Locale; menuId: string; sectionId: string }>;
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    organization?: string;
  }>;
}

const MenusMenuIdSectionIdPage = async ({
  params,
  searchParams,
}: MenusMenuIdSectionIdPageProps) => {
  const [
    cookieStore,
    { locale, menuId, sectionId },
    { page: rawPage, pageSize: rawPageSize, ...restSearchParams },
  ] = await Promise.all([cookies(), params, searchParams]);

  setRequestLocale(locale);

  const page = Math.max(1, Number(rawPage) || 1);
  const pageSize = Math.max(1, Number(rawPageSize) || 10);

  if (rawPage !== String(page) || rawPageSize !== String(pageSize)) {
    const params = new URLSearchParams({
      ...restSearchParams,
      page: String(page),
      pageSize: String(pageSize),
    });
    redirect({
      href: `/menus/${menuId}/${sectionId}?${params.toString()}`,
      locale,
    });
  }

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };
  const [menu, section, { items, total }] = await Promise.all([
    getAdminMenu(menuId, fetchOptions),
    getAdminMenuSection(sectionId, fetchOptions),
    getAdminMenuSectionItems(sectionId, page, pageSize, fetchOptions),
  ]);

  if (!menu || !section) notFound();

  return (
    <MenusMenuIdSectionId
      items={items}
      rowCount={total}
      page={page}
      pageSize={pageSize}
      sectionId={sectionId}
    />
  );
};

export default MenusMenuIdSectionIdPage;
