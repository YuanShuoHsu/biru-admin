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
      href: `/menus/${menuId}/${sectionId}?${searchParams.toString()}`,
      locale,
    });
  }

  const currentPage = Number(page);
  const currentPageSize = Number(pageSize);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };
  const [menu, section, { items, total }] = await Promise.all([
    getAdminMenu(menuId, fetchOptions),
    getAdminMenuSection(sectionId, fetchOptions),
    getAdminMenuSectionItems(
      sectionId,
      currentPage,
      currentPageSize,
      fetchOptions,
    ),
  ]);

  if (!menu || !section) notFound();

  return (
    <MenusMenuIdSectionId
      items={items}
      rowCount={total}
      page={currentPage}
      pageSize={currentPageSize}
      sectionId={sectionId}
    />
  );
};

export default MenusMenuIdSectionIdPage;
