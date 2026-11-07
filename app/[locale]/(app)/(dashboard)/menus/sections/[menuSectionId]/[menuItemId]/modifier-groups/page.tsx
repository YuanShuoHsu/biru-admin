// https://nextjs.org/docs/app/guides/streaming#status-codes

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
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type {
  MenuItemModifierGroup,
  ModifierGroupFilterField,
  ModifierGroupSortField,
} from "@/types/menus";

import { resolveGridSearchParams } from "@/utils/dataGrid";
import { type FetchResult, isMissingResource, settle } from "@/utils/fetcher";
import {
  getAdminMenu,
  getAdminMenuItem,
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

interface MenuItemModifierGroupsContentProps {
  canViewAuditLog: boolean;
  canWrite: boolean;
  filterField?: ModifierGroupFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  links: Promise<
    FetchResult<{ links: MenuItemModifierGroup[]; total: number }>
  >;
  menuId: string;
  menuItemId: string;
  organizationSlug: string;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  sortBy?: ModifierGroupSortField;
  sortDirection?: SortDirection;
}

const MenuItemModifierGroupsContent = async ({
  links: linksResult,
  organizationSlug,
  ...props
}: MenuItemModifierGroupsContentProps) => {
  const { data: links, error: linksError } = await linksResult;
  if (isMissingResource(linksError)) notFound();
  if (linksError) return <ErrorAlert />;

  const { links: rows, total: rowCount } = links;

  return (
    <MenuItemModifierGroups
      {...props}
      key={organizationSlug}
      rowCount={rowCount}
      rows={rows}
    />
  );
};

const MenuItemModifierGroupsPage = async ({
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

  const [{ data: menu, error: menuError }, { error: menuItemError }] =
    await Promise.all([
      settle(getAdminMenu(section.menuId, fetchOptions)),
      settle(getAdminMenuItem(menuItemId, fetchOptions)),
    ]);
  if (isMissingResource(menuError) || isMissingResource(menuItemError))
    notFound();
  if (menuError || menuItemError) return <ErrorAlert />;

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

  const links = settle(
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
  );
  const role = await getMemberRole(selectedOrganization.id);

  const canWrite = hasRolePermission(role, { menu: ["update"] });
  const canViewAuditLog = hasRolePermission(role, {
    auditLog: ["read"],
  });

  return (
    <Suspense fallback={<MenuItemModifierGroups loading />}>
      <MenuItemModifierGroupsContent
        canViewAuditLog={canViewAuditLog}
        canWrite={canWrite}
        filterField={filterField}
        filterOperator={filterOperator}
        filterValue={filterValue}
        links={links}
        menuId={section.menuId}
        menuItemId={menuItemId}
        organizationSlug={selectedOrganization.slug}
        page={page}
        pageSize={pageSize}
        quickFilterValue={quickFilterValue}
        sortBy={sortBy}
        sortDirection={sortDirection}
      />
    </Suspense>
  );
};

export default MenuItemModifierGroupsPage;
