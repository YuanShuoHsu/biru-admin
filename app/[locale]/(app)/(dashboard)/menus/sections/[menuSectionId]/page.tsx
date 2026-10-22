import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import MenusMenuIdSectionId from ".";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  filterOperatorValues,
  menuItemFilterFieldValues,
  menuItemSortFieldValues,
} from "@/types/api";

import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getMenuEnumOptions } from "@/utils/enumOptions";
import {
  getAdminMenu,
  getAdminMenuSection,
  getAdminMenuSectionItems,
} from "@/utils/menus";
import { hasRolePermission } from "@/utils/organizations";
import { getAdminOrganization, getMemberRole } from "@/utils/session";

interface MenusMenuIdSectionIdPageProps {
  params: Promise<{ locale: Locale; menuSectionId: string }>;
  searchParams: Promise<{
    filterField?: string;
    filterOperator?: string;
    filterValue?: string;
    organization?: string;
    page?: string;
    pageSize?: string;
    quickFilterEnums?: string | string[];
    quickFilterValue?: string;
    sortBy?: string;
    sortDirection?: string;
  }>;
}

export const generateMetadata = async ({
  params,
}: MenusMenuIdSectionIdPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tMenus = await getTranslations({ locale, namespace: "menus" });

  return { title: tMenus("sections.label") };
};

const MenusMenuIdSectionIdContent = async ({
  params,
  searchParams,
}: MenusMenuIdSectionIdPageProps) => {
  const [cookieStore, { locale, menuSectionId }, rawSearchParams] =
    await Promise.all([cookies(), params, searchParams]);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };
  const section = await getAdminMenuSection(menuSectionId, fetchOptions);

  if (!section?.menuId) notFound();

  const menu = await getAdminMenu(section.menuId, fetchOptions);
  const selectedOrganization = await getAdminOrganization(
    menu?.organizationId,
    rawSearchParams.organization,
  );
  if (!selectedOrganization) notFound();

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
    sortFields: menuItemSortFieldValues,
    filterFields: menuItemFilterFieldValues,
    filterOperators: filterOperatorValues,
    organizationSlug: selectedOrganization.slug,
  });

  if (redirectParams)
    redirect({
      href: `/menus/sections/${menuSectionId}?${redirectParams.toString()}`,
      locale,
    });

  const [tMenus, tOrder] = await Promise.all([
    getTranslations({ locale, namespace: "menus" }),
    getTranslations({ locale, namespace: "order" }),
  ]);

  const quickFilterEnums = quickFilterValue
    ? getQuickFilterEnums(quickFilterValue, getMenuEnumOptions(tMenus, tOrder))
    : [];

  const [{ items: rows, total: rowCount }, role] = await Promise.all([
    getAdminMenuSectionItems(
      menuSectionId,
      page,
      pageSize,
      filterField,
      filterOperator,
      filterValue,
      quickFilterValue,
      quickFilterEnums,
      sortBy,
      sortDirection,
      fetchOptions,
    ),
    getMemberRole(selectedOrganization.id),
  ]);

  const canWrite = hasRolePermission(role, { menu: ["update"] });
  const canViewAuditLog = hasRolePermission(role, {
    auditLog: ["read"],
  });
  const canUpdateAvailability = hasRolePermission(role, {
    itemAvailability: ["update"],
  });

  return (
    <MenusMenuIdSectionId
      canUpdateAvailability={canUpdateAvailability}
      canViewAuditLog={canViewAuditLog}
      canWrite={canWrite}
      filterField={filterField}
      filterOperator={filterOperator}
      filterValue={filterValue}
      organization={selectedOrganization}
      page={page}
      pageSize={pageSize}
      quickFilterValue={quickFilterValue}
      rowCount={rowCount}
      rows={rows}
      menuSectionId={menuSectionId}
      sortBy={sortBy}
      sortDirection={sortDirection}
    />
  );
};

const MenusMenuIdSectionIdPage = (props: MenusMenuIdSectionIdPageProps) => (
  <Suspense fallback={<MenusMenuIdSectionId loading />}>
    <MenusMenuIdSectionIdContent {...props} />
  </Suspense>
);

export default MenusMenuIdSectionIdPage;
