import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import Modifiers from ".";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import {
  filterOperatorValues,
  modifierFilterFieldValues,
  modifierSortFieldValues,
} from "@/types/api";

import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getMenuEnumOptions } from "@/utils/enumOptions";
import {
  DEFAULT_MENUS_HREF,
  getAdminMenu,
  getAdminModifierGroup,
  getAdminModifiers,
  getAdminOrganization,
} from "@/utils/menus";
import { hasRolePermission } from "@/utils/organizations";
import { getSession } from "@/utils/session";

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
  const t = await getTranslations({ locale });

  return { title: t("menus.modifierGroups.label") };
};

const ModifiersPage = async ({ params, searchParams }: ModifiersPageProps) => {
  const [cookieStore, { locale, groupId }, rawSearchParams] = await Promise.all(
    [cookies(), params, searchParams],
  );

  setRequestLocale(locale);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };
  const group = await getAdminModifierGroup(groupId, fetchOptions);

  if (!group?.menuId) notFound();

  const [menu, selectedOrganization] = await Promise.all([
    getAdminMenu(group.menuId, fetchOptions),
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

  const [{ modifiers, total }, session, fullOrgData] = await Promise.all([
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
    <Modifiers
      canViewAuditLog={canViewAuditLog}
      canWrite={canWrite}
      filterField={filterField}
      filterOperator={filterOperator}
      filterValue={filterValue}
      group={group}
      modifiers={modifiers}
      page={page}
      pageSize={pageSize}
      quickFilterValue={quickFilterValue}
      rowCount={total}
      sortBy={sortBy}
      sortDirection={sortDirection}
    />
  );
};

export default ModifiersPage;
