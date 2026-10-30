import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import MenusMenuIdSectionId from ".";

import ErrorAlert from "@/components/ErrorAlert";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  filterOperatorValues,
  menuItemFilterFieldValues,
  menuItemSortFieldValues,
} from "@/types/api";

import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getMenuEnumOptions } from "@/utils/enumOptions";
import { isMissingResource, settle } from "@/utils/fetcher";
import {
  getAdminMenu,
  getAdminMenuSection,
  getAdminMenuSectionItems,
} from "@/utils/menus";
import { getAdminPrepTimes } from "@/utils/orders";
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

  const [{ data: items, error: itemsError }, role] = await Promise.all([
    settle(
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
    ),
    getMemberRole(selectedOrganization.id),
  ]);
  if (itemsError) return <ErrorAlert />;

  const { items: rows, total: rowCount } = items;

  const canWrite = hasRolePermission(role, { menu: ["update"] });
  const canViewAuditLog = hasRolePermission(role, {
    auditLog: ["read"],
  });
  const canUpdateAvailability = hasRolePermission(role, {
    itemAvailability: ["update"],
  });
  const prepTimes = hasRolePermission(role, { order: ["read"] })
    ? await getAdminPrepTimes(selectedOrganization.slug, fetchOptions)
    : undefined;

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
      prepTimes={prepTimes}
      quickFilterValue={quickFilterValue}
      rowCount={rowCount}
      rows={rows}
      menuId={section.menuId}
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
