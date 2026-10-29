import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import Modifiers from ".";

import ErrorAlert from "@/components/ErrorAlert";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  filterOperatorValues,
  modifierFilterFieldValues,
  modifierSortFieldValues,
} from "@/types/api";

import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getMenuEnumOptions } from "@/utils/enumOptions";
import { isMissingResource, settle } from "@/utils/fetcher";
import {
  getAdminMenu,
  getAdminModifierGroup,
  getAdminModifiers,
} from "@/utils/menus";
import { hasRolePermission } from "@/utils/organizations";
import { getAdminOrganization, getMemberRole } from "@/utils/session";

interface ModifiersPageProps {
  params: Promise<{ locale: Locale; groupId: string }>;
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
}: ModifiersPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tMenus = await getTranslations({ locale, namespace: "menus" });

  return { title: tMenus("modifierGroups.label") };
};

const ModifiersContent = async ({
  params,
  searchParams,
}: ModifiersPageProps) => {
  const [cookieStore, { locale, groupId }, rawSearchParams] = await Promise.all(
    [cookies(), params, searchParams],
  );

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };
  const { data: group, error: groupError } = await settle(
    getAdminModifierGroup(groupId, fetchOptions),
  );
  if (isMissingResource(groupError)) notFound();
  if (groupError) return <ErrorAlert />;

  const { data: menu, error: menuError } = await settle(
    getAdminMenu(group.menuId, fetchOptions),
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
    sortFields: modifierSortFieldValues,
    filterFields: modifierFilterFieldValues,
    filterOperators: filterOperatorValues,
    organizationSlug: selectedOrganization.slug,
  });

  if (redirectParams)
    redirect({
      href: `/menus/modifier-groups/${groupId}?${redirectParams.toString()}`,
      locale,
    });

  const [tMenus, tOrder] = await Promise.all([
    getTranslations({ locale, namespace: "menus" }),
    getTranslations({ locale, namespace: "order" }),
  ]);

  const quickFilterEnums = quickFilterValue
    ? getQuickFilterEnums(quickFilterValue, getMenuEnumOptions(tMenus, tOrder))
    : [];

  const [{ data: modifiers, error: modifiersError }, role] = await Promise.all([
    settle(
      getAdminModifiers(
        groupId,
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
  if (modifiersError) return <ErrorAlert />;

  const { modifiers: rows, total: rowCount } = modifiers;

  const canWrite = hasRolePermission(role, { menu: ["update"] });
  const canViewAuditLog = hasRolePermission(role, {
    auditLog: ["read"],
  });
  const canUpdateAvailability = hasRolePermission(role, {
    itemAvailability: ["update"],
  });

  return (
    <Modifiers
      canUpdateAvailability={canUpdateAvailability}
      canViewAuditLog={canViewAuditLog}
      canWrite={canWrite}
      filterField={filterField}
      filterOperator={filterOperator}
      filterValue={filterValue}
      group={group}
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

const ModifiersPage = (props: ModifiersPageProps) => (
  <Suspense fallback={<Modifiers loading />}>
    <ModifiersContent {...props} />
  </Suspense>
);

export default ModifiersPage;
