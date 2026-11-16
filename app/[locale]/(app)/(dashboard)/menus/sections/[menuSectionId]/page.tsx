// https://nextjs.org/docs/app/guides/streaming#status-codes

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
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type {
  MenuItem,
  MenuItemFilterField,
  MenuItemSortField,
} from "@/types/menus";
import type { PrepTimeResponse } from "@/types/orders";
import type { Organization } from "@/types/organizations";

import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getMenuEnumOptions } from "@/utils/enumOptions";
import { type FetchResult, isMissingResource, settle } from "@/utils/fetcher";
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

interface MenusMenuIdSectionIdContentProps {
  canUpdateAvailability: boolean;
  canViewAuditLog: boolean;
  canWrite: boolean;
  filterField?: MenuItemFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  items: Promise<FetchResult<{ items: MenuItem[]; total: number }>>;
  menuId: string;
  menuSectionId: string;
  organization: Organization;
  page: number;
  pageSize: number;
  prepTimes: Promise<PrepTimeResponse[] | undefined>;
  quickFilterValue?: string;
  sortBy?: MenuItemSortField;
  sortDirection?: SortDirection;
}

const MenusMenuIdSectionIdContent = async ({
  items: itemsResult,
  prepTimes: prepTimesResult,
  ...props
}: MenusMenuIdSectionIdContentProps) => {
  const { data: items, error: itemsError } = await itemsResult;
  if (itemsError) return <ErrorAlert />;

  const { items: rows, total: rowCount } = items;

  const prepTimes = await prepTimesResult;

  return (
    <MenusMenuIdSectionId
      {...props}
      key={props.organization.slug}
      prepTimes={prepTimes}
      rowCount={rowCount}
      rows={rows}
    />
  );
};

const MenusMenuIdSectionIdPage = async ({
  params,
  searchParams,
}: MenusMenuIdSectionIdPageProps) => {
  const [cookieStore, { locale, menuSectionId }, rawSearchParams] =
    await Promise.all([cookies(), params, searchParams]);

  const fetchOptions = {
    headers: { "Accept-Language": locale, cookie: cookieStore.toString() },
  };
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

  const items = settle(
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
  );
  const role = await getMemberRole(selectedOrganization.id);

  const canWrite = hasRolePermission(role, { menu: ["update"] });
  const canViewAuditLog = hasRolePermission(role, {
    auditLog: ["read"],
  });
  const canUpdateAvailability = hasRolePermission(role, {
    itemAvailability: ["update"],
  });
  const canReadOrders = hasRolePermission(role, { order: ["read"] });
  const prepTimes = items.then(({ error }) =>
    !error && canReadOrders
      ? getAdminPrepTimes(selectedOrganization.slug, fetchOptions)
      : undefined,
  );

  return (
    <Suspense fallback={<MenusMenuIdSectionId loading />}>
      <MenusMenuIdSectionIdContent
        canUpdateAvailability={canUpdateAvailability}
        canViewAuditLog={canViewAuditLog}
        canWrite={canWrite}
        filterField={filterField}
        filterOperator={filterOperator}
        filterValue={filterValue}
        items={items}
        menuId={section.menuId}
        menuSectionId={menuSectionId}
        organization={selectedOrganization}
        page={page}
        pageSize={pageSize}
        prepTimes={prepTimes}
        quickFilterValue={quickFilterValue}
        sortBy={sortBy}
        sortDirection={sortDirection}
      />
    </Suspense>
  );
};

export default MenusMenuIdSectionIdPage;
