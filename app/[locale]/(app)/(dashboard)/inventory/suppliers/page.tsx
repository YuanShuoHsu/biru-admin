import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import Suppliers from ".";

import InventoryTabsLayout from "../InventoryTabsLayout";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { MAX_PAGE_SIZE } from "@/constants/pagination";

import { authClient } from "@/lib/auth-client";

import {
  filterOperatorValues,
  supplierFilterFieldValues,
  supplierSortFieldValues,
} from "@/types/api";

import { resolveGridSearchParams } from "@/utils/dataGrid";
import { getIngredients, getSuppliers } from "@/utils/inventory";
import { getResolvedAdminOrganization } from "@/utils/menus";
import { hasRolePermission } from "@/utils/organizations";

interface SuppliersPageProps {
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
}: SuppliersPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return { title: t("inventory.suppliers.label") };
};

const SuppliersPage = async ({ params, searchParams }: SuppliersPageProps) => {
  const [cookieStore, { locale }, rawSearchParams] = await Promise.all([
    cookies(),
    params,
    searchParams,
  ]);

  setRequestLocale(locale);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const organization = await getResolvedAdminOrganization(
    rawSearchParams.organization,
    cookieStore.toString(),
  );

  if (!organization) notFound();

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
    sortFields: supplierSortFieldValues,
    filterFields: supplierFilterFieldValues,
    filterOperators: filterOperatorValues,
    organizationSlug: organization.slug,
  });

  if (redirectParams)
    redirect({
      href: `/inventory/suppliers?${redirectParams.toString()}`,
      locale,
    });

  const [{ data: memberRole }, { suppliers, total }] = await Promise.all([
    authClient.organization.getActiveMemberRole({
      query: { organizationId: organization.id },
      fetchOptions,
    }),
    getSuppliers(
      organization.slug,
      {
        page,
        pageSize,
        filterField,
        filterOperator,
        filterValue,
        quickFilterValue,
        sortBy,
        sortDirection,
      },
      fetchOptions,
    ),
  ]);

  const canViewAuditLog = hasRolePermission(memberRole?.role, {
    auditLog: ["read"],
  });
  const canViewInventory = hasRolePermission(memberRole?.role, {
    inventory: ["read"],
  });
  const canViewPurchasing = hasRolePermission(memberRole?.role, {
    purchasing: ["read"],
  });
  const canWrite = hasRolePermission(memberRole?.role, {
    purchasing: ["update"],
  });

  if (!canViewPurchasing) notFound();

  const { ingredients } = canWrite
    ? await getIngredients(
        organization.slug,
        { pageSize: MAX_PAGE_SIZE, sortBy: "name", sortDirection: "asc" },
        fetchOptions,
      )
    : { ingredients: [] };

  return (
    <InventoryTabsLayout
      canViewInventory={canViewInventory}
      canViewPurchasing={canViewPurchasing}
    >
      <Suppliers
        canViewAuditLog={canViewAuditLog}
        canWrite={canWrite}
        filterField={filterField}
        filterOperator={filterOperator}
        filterValue={filterValue}
        ingredients={ingredients}
        organizationSlug={organization.slug}
        page={page}
        pageSize={pageSize}
        quickFilterValue={quickFilterValue}
        rowCount={total}
        sortBy={sortBy}
        sortDirection={sortDirection}
        suppliers={suppliers}
      />
    </InventoryTabsLayout>
  );
};

export default SuppliersPage;
