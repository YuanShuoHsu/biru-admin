import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import MenuItemAddOns from ".";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import {
  addOnFilterFieldValues,
  addOnSortFieldValues,
  filterOperatorValues,
} from "@/types/api";

import { resolveGridSearchParams } from "@/utils/dataGrid";
import {
  DEFAULT_MENUS_HREF,
  getAdminMenu,
  getAdminMenuItemAddOns,
  getAdminMenuSection,
  getAdminOrganization,
} from "@/utils/menus";
import { hasRolePermission } from "@/utils/organizations";
import { getSession } from "@/utils/session";

interface MenuItemAddOnsPageProps {
  params: Promise<{
    locale: Locale;
    menuSectionId: string;
    menuItemId: string;
  }>;
  searchParams: Promise<{
    filterField?: string;
    filterOperator?: string;
    filterValue?: string;
    organization?: string;
    page?: string;
    pageSize?: string;
    quickFilterValue?: string;
    sortBy?: string;
    sortDirection?: string;
  }>;
}

export const generateMetadata = async ({
  params,
}: MenuItemAddOnsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return { title: t("menus.items.addOns.label") };
};

const MenuItemAddOnsPage = async ({
  params,
  searchParams,
}: MenuItemAddOnsPageProps) => {
  const [cookieStore, { locale, menuSectionId, menuItemId }, rawSearchParams] =
    await Promise.all([cookies(), params, searchParams]);

  setRequestLocale(locale);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };
  const section = await getAdminMenuSection(menuSectionId, fetchOptions);

  if (!section?.menuId) notFound();

  const [menu, selectedOrganization] = await Promise.all([
    getAdminMenu(section.menuId, fetchOptions),
    getAdminOrganization(rawSearchParams.organization, fetchOptions),
  ]);

  if (!selectedOrganization || selectedOrganization.id !== menu?.organizationId)
    return redirect({ href: DEFAULT_MENUS_HREF, locale });

  const {
    filterField,
    filterOperator,
    filterValue,
    page,
    pageSize,
    quickFilterValue,
    redirectParams,
    sortBy,
    sortDirection,
  } = resolveGridSearchParams({
    searchParams: rawSearchParams,
    sortFields: addOnSortFieldValues,
    filterFields: addOnFilterFieldValues,
    filterOperators: filterOperatorValues,
    organizationSlug: selectedOrganization.slug,
  });

  if (redirectParams)
    redirect({
      href: `/menus/sections/${menuSectionId}/${menuItemId}/add-ons?${redirectParams.toString()}`,
      locale,
    });

  const [{ addOns, total }, session, fullOrgData] = await Promise.all([
    getAdminMenuItemAddOns(
      menuItemId,
      page,
      pageSize,
      filterField,
      filterOperator,
      filterValue,
      quickFilterValue,
      sortBy,
      sortDirection,
      fetchOptions,
    ),
    getSession(),
    authClient.organization.getFullOrganization({
      query: { organizationId: menu.organizationId },
      fetchOptions,
    }),
  ]);

  const currentUserId = session?.user?.id;
  const members = fullOrgData.data?.members || [];
  const role = members.find(({ userId }) => userId === currentUserId)?.role;
  const canWrite = hasRolePermission(role, { menu: ["update"] });
  const canViewAuditLog = hasRolePermission(role, {
    auditLog: ["read"],
  });

  return (
    <MenuItemAddOns
      addOns={addOns}
      canViewAuditLog={canViewAuditLog}
      canWrite={canWrite}
      filterField={filterField}
      filterOperator={filterOperator}
      filterValue={filterValue}
      menuId={menu.id}
      menuItemId={menuItemId}
      page={page}
      pageSize={pageSize}
      quickFilterValue={quickFilterValue}
      rowCount={total}
      sortBy={sortBy}
      sortDirection={sortDirection}
    />
  );
};

export default MenuItemAddOnsPage;
