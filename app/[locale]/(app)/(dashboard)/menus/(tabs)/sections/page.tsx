import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import MenusSections from ".";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  filterOperatorValues,
  menuSectionFilterFieldValues,
  menuSectionSortFieldValues,
} from "@/types/api";

import { resolveGridSearchParams } from "@/utils/dataGrid";
import { getAdminMenuSections } from "@/utils/menus";
import { hasRolePermission } from "@/utils/organizations";
import {
  getMemberRole,
  getResolvedAdminOrganizationMenu,
} from "@/utils/session";

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
  const tMenus = await getTranslations({ locale, namespace: "menus" });

  return { title: tMenus("sections.label") };
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

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const { organization: selectedOrganization, menu } =
    await getResolvedAdminOrganizationMenu(rawSearchParams.organization);

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

  const [{ sections: rows, total: rowCount }, role] = await Promise.all([
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
    getMemberRole(menu.organizationId),
  ]);

  const canWrite = hasRolePermission(role, { menu: ["update"] });
  const canViewAuditLog = hasRolePermission(role, {
    auditLog: ["read"],
  });

  return (
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
      rowCount={rowCount}
      rows={rows}
      sortBy={sortBy}
      sortDirection={sortDirection}
    />
  );
};

export default MenusSectionsPage;
