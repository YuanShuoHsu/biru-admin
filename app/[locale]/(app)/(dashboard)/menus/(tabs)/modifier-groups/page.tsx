// https://nextjs.org/docs/app/guides/streaming#status-codes

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import ModifierGroups from ".";

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
  Menu,
  ModifierGroup,
  ModifierGroupFilterField,
  ModifierGroupSortField,
} from "@/types/menus";

import { resolveGridSearchParams } from "@/utils/dataGrid";
import { type FetchResult, settle } from "@/utils/fetcher";
import { getAdminModifierGroups } from "@/utils/menus";
import { hasRolePermission } from "@/utils/organizations";
import {
  getMemberRole,
  getResolvedAdminOrganizationMenu,
} from "@/utils/session";

interface ModifierGroupsPageProps {
  params: Promise<{ locale: Locale }>;
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
}: ModifierGroupsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tMenus = await getTranslations({ locale, namespace: "menus" });

  return { title: tMenus("modifierGroups.label") };
};

interface ModifierGroupsContentProps {
  canViewAuditLog: boolean;
  canWrite: boolean;
  filterField?: ModifierGroupFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  groups: Promise<FetchResult<{ groups: ModifierGroup[]; total: number }>>;
  menu: Menu;
  organizationSlug: string;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  sortBy?: ModifierGroupSortField;
  sortDirection?: SortDirection;
}

const ModifierGroupsContent = async ({
  groups: groupsResult,
  organizationSlug,
  ...props
}: ModifierGroupsContentProps) => {
  const { data: groups, error: groupsError } = await groupsResult;
  if (groupsError) return <ErrorAlert />;

  const { groups: rows, total: rowCount } = groups;

  return (
    <ModifierGroups
      {...props}
      key={organizationSlug}
      rowCount={rowCount}
      rows={rows}
    />
  );
};

const ModifierGroupsPage = async ({
  params,
  searchParams,
}: ModifierGroupsPageProps) => {
  const [cookieStore, { locale }, rawSearchParams] = await Promise.all([
    cookies(),
    params,
    searchParams,
  ]);

  const fetchOptions = {
    headers: { "Accept-Language": locale, cookie: cookieStore.toString() },
  };

  const { data: resolved, error: resolvedError } = await settle(
    getResolvedAdminOrganizationMenu(rawSearchParams.organization),
  );
  if (resolvedError) return <ErrorAlert />;

  const { organization: selectedOrganization, menu } = resolved;
  if (!selectedOrganization || !menu) notFound();

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
      href: `/menus/modifier-groups?${redirectParams.toString()}`,
      locale,
    });

  const groups = settle(
    getAdminModifierGroups(
      menu.id,
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
  const role = await getMemberRole(menu.organizationId);

  const canWrite = hasRolePermission(role, { menu: ["update"] });
  const canViewAuditLog = hasRolePermission(role, {
    auditLog: ["read"],
  });

  return (
    <Suspense fallback={<ModifierGroups loading />}>
      <ModifierGroupsContent
        canViewAuditLog={canViewAuditLog}
        canWrite={canWrite}
        filterField={filterField}
        filterOperator={filterOperator}
        filterValue={filterValue}
        groups={groups}
        menu={menu}
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

export default ModifierGroupsPage;
