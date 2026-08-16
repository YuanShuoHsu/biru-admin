import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import MenusSections from ".";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import {
  filterOperatorValues,
  menuSectionFilterFieldValues,
  menuSectionSortFieldValues,
} from "@/types/api";

import { resolveGridSearchParams } from "@/utils/dataGrid";
import {
  getAdminMenuSections,
  getResolvedAdminOrganizationMenu,
} from "@/utils/menus";
import { hasRolePermission } from "@/utils/organizations";
import { getSession } from "@/utils/session";

import MenusTabsLayout from "../MenusTabsLayout";

interface MenusSectionsPageProps {
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
}: MenusSectionsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return { title: t("menus.sections.label") };
};

const MenusSectionsPage = async ({
  params,
  searchParams,
}: MenusSectionsPageProps) => {
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
    sortFields: menuSectionSortFieldValues,
    filterFields: menuSectionFilterFieldValues,
    filterOperators: filterOperatorValues,
    organizationSlug: selectedOrganization.slug,
  });

  if (redirectParams)
    redirect({ href: `/menus/sections?${redirectParams.toString()}`, locale });

  const [{ sections, total }, session, fullOrgData] = await Promise.all([
    getAdminMenuSections(
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
      <MenusSections
        canViewAuditLog={canViewAuditLog}
        canWrite={canWrite}
        filterField={filterField}
        filterOperator={filterOperator}
        filterValue={filterValue}
        menu={menu}
        page={page}
        pageSize={pageSize}
        quickFilterValue={quickFilterValue}
        rowCount={total}
        sections={sections}
        sortBy={sortBy}
        sortDirection={sortDirection}
      />
    </MenusTabsLayout>
  );
};

export default MenusSectionsPage;
