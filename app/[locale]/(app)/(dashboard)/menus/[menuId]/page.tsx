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
    { page, pageSize, ...restSearchParams },
  ] = await Promise.all([cookies(), params, searchParams]);

  setRequestLocale(locale);

  if (!page || !pageSize) {
    const searchParams = new URLSearchParams({
      ...restSearchParams,
      page: page || "1",
      pageSize: pageSize || "10",
    });
    redirect({
      href: `/menus/${menuId}?${searchParams.toString()}`,
      locale,
    });
  }

  const currentPage = Number(page);
  const currentPageSize = Number(pageSize);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };
  const [menu, { sections, total }] = await Promise.all([
    getAdminMenu(menuId, fetchOptions),
    getAdminMenuSections(menuId, currentPage, currentPageSize, fetchOptions),
  ]);

  if (!menu) notFound();

  return (
    <MenusMenuId
      menu={menu}
      sections={sections}
      rowCount={total}
      page={currentPage}
      pageSize={currentPageSize}
    />
  );
};

export default MenusMenuIdPage;
