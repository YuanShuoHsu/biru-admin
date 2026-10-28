import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import MenuItemModifierGroups from ".";

import ErrorAlert from "@/components/ErrorAlert";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  filterOperatorValues,
  modifierGroupFilterFieldValues,
  modifierGroupSortFieldValues,
} from "@/types/api";

import { resolveGridSearchParams } from "@/utils/dataGrid";
import { isMissingResource, settle } from "@/utils/fetcher";
import {
  getAdminMenu,
  getAdminMenuItemModifierGroups,
  getAdminMenuSection,
} from "@/utils/menus";
import { hasRolePermission } from "@/utils/organizations";
import { getAdminOrganization, getMemberRole } from "@/utils/session";

interface MenuItemModifierGroupsPageProps {
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
}: MenuItemModifierGroupsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tMenus = await getTranslations({ locale, namespace: "menus" });

  return { title: tMenus("items.modifierGroups.label") };
};

const MenuItemModifierGroupsContent = async ({
  params,
  searchParams,
}: MenuItemModifierGroupsPageProps) => {
  const [cookieStore, { locale, menuSectionId, menuItemId }, rawSearchParams] =
    await Promise.all([cookies(), params, searchParams]);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };
  const { data: section, error: sectionError } = await settle(
    getAdminMenuSection(menuSectionId, fetchOptions),
  );
  if (isMissingResource(sectionError)) notFound();
  if (sectionError) return <ErrorAlert />;

  const { data: menu, error: menuError } = await settle(
    getAdminMenu(section.menuId, fetchOptions),
  );
  if (isMissingResource(menuError)) notFound();
  if (menuError) return <ErrorAlert />;

  const selectedOrganization = await getAdminOrganization(
    menu.organizationId,
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
    sortFields: modifierGroupSortFieldValues,
    filterFields: modifierGroupFilterFieldValues,
    filterOperators: filterOperatorValues,
    organizationSlug: selectedOrganization.slug,
  });

  if (redirectParams)
    redirect({
      href: `/menus/sections/${menuSectionId}/${menuItemId}/modifier-groups?${redirectParams.toString()}`,
      locale,
    });

  const [{ data: links, error: linksError }, role] = await Promise.all([
    settle(
      getAdminMenuItemModifierGroups(
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
    ),
    getMemberRole(selectedOrganization.id),
  ]);
  if (linksError) return <ErrorAlert />;

  const { links: rows, total: rowCount } = links;

  const canWrite = hasRolePermission(role, { menu: ["update"] });
  const canViewAuditLog = hasRolePermission(role, {
    auditLog: ["read"],
  });

  return (
    <MenuItemModifierGroups
      canViewAuditLog={canViewAuditLog}
      canWrite={canWrite}
      filterField={filterField}
      filterOperator={filterOperator}
      filterValue={filterValue}
      menuId={section.menuId}
      menuItemId={menuItemId}
      page={page}
      pageSize={pageSize}
      quickFilterValue={quickFilterValue}
      rowCount={rowCount}
      rows={rows}
      sortBy={sortBy}
      sortDirection={sortDirection}
    />
  );
};

const MenuItemModifierGroupsPage = (props: MenuItemModifierGroupsPageProps) => (
  <Suspense fallback={<MenuItemModifierGroups loading />}>
    <MenuItemModifierGroupsContent {...props} />
  </Suspense>
);

export default MenuItemModifierGroupsPage;
