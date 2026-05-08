import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import MenusMenuId from ".";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { getAdminMenu, getAdminMenuSections } from "@/utils/menus";

interface MenusMenuIdPageProps {
  params: Promise<{ locale: Locale; menuId: string }>;
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    organization?: string;
  }>;
}

const MenusMenuIdPage = async ({
  params,
  searchParams,
}: MenusMenuIdPageProps) => {
  const [
    cookieStore,
    { locale, menuId },
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
      href: `/menus/${menuId}?${params.toString()}`,
      locale,
    });
  }

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };
  const [menu, { sections, total }] = await Promise.all([
    getAdminMenu(menuId, fetchOptions),
    getAdminMenuSections(menuId, page, pageSize, fetchOptions),
  ]);

  if (!menu) notFound();

  return (
    <MenusMenuId
      menu={menu}
      sections={sections}
      rowCount={total}
      page={page}
      pageSize={pageSize}
    />
  );
};

export default MenusMenuIdPage;
