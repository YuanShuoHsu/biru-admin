import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import ModifierGroups from ".";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import {
  filterOperatorValues,
  modifierGroupFilterFieldValues,
  modifierGroupSortFieldValues,
} from "@/types/api";

import { resolveGridSearchParams } from "@/utils/dataGrid";
import {
  getAdminModifierGroups,
  getResolvedAdminOrganizationMenu,
} from "@/utils/menus";
import { hasRolePermission } from "@/utils/organizations";
import { getSession } from "@/utils/session";

import MenusTabsLayout from "../MenusTabsLayout";

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
  const t = await getTranslations({ locale });

  return { title: t("menus.modifierGroups.label") };
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

  setRequestLocale(locale);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const { organization: selectedOrganization, menu } =
    await getResolvedAdminOrganizationMenu(
      rawSearchParams.organization,
      fetchOptions,
    );

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

  const [{ groups, total }, session, fullOrgData] = await Promise.all([
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
    <MenusTabsLayout
      canViewAuditLog={canViewAuditLog}
      canWrite={canWrite}
      menu={menu}
    >
      <ModifierGroups
        canViewAuditLog={canViewAuditLog}
        canWrite={canWrite}
        filterField={filterField}
        filterOperator={filterOperator}
        filterValue={filterValue}
        groups={groups}
        menu={menu}
        page={page}
        pageSize={pageSize}
        quickFilterValue={quickFilterValue}
        rowCount={total}
        sortBy={sortBy}
        sortDirection={sortDirection}
      />
    </MenusTabsLayout>
  );
};

export default ModifierGroupsPage;
