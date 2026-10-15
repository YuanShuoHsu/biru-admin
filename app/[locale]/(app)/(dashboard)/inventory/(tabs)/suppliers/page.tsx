import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import Suppliers from ".";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { MAX_PAGE_SIZE } from "@/constants/pagination";

import {
  filterOperatorValues,
  supplierFilterFieldValues,
  supplierSortFieldValues,
} from "@/types/api";

import { resolveGridSearchParams } from "@/utils/dataGrid";
import { getIngredients, getSuppliers } from "@/utils/inventory";
import { hasRolePermission } from "@/utils/organizations";
import { getMemberRole, getResolvedAdminOrganization } from "@/utils/session";

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
  const tInventory = await getTranslations({ locale, namespace: "inventory" });

  return { title: tInventory("suppliers.label") };
};

const SuppliersPage = async ({ params, searchParams }: SuppliersPageProps) => {
  const [cookieStore, { locale }, rawSearchParams] = await Promise.all([
    cookies(),
    params,
    searchParams,
  ]);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const organization = await getResolvedAdminOrganization(
    rawSearchParams.organization,
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

  const [memberRole, { suppliers: rows, total: rowCount }] = await Promise.all([
    getMemberRole(organization.id),
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

  const canViewAuditLog = hasRolePermission(memberRole, {
    auditLog: ["read"],
  });
  const canViewPurchasing = hasRolePermission(memberRole, {
    purchasing: ["read"],
  });
  const canWrite = hasRolePermission(memberRole, {
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
    <Suppliers
      canViewAuditLog={canViewAuditLog}
      canWrite={canWrite}
      filterField={filterField}
      filterOperator={filterOperator}
      filterValue={filterValue}
      ingredients={ingredients}
      organization={organization}
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

export default SuppliersPage;
