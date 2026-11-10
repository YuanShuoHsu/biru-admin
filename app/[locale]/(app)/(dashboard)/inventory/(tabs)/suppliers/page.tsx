// https://nextjs.org/docs/app/guides/streaming#status-codes

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import Suppliers from ".";

import ErrorAlert from "@/components/ErrorAlert";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  filterOperatorValues,
  supplierFilterFieldValues,
  supplierSortFieldValues,
} from "@/types/api";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type {
  Supplier,
  SupplierFilterField,
  SupplierSortField,
} from "@/types/inventory";
import type { Organization } from "@/types/organizations";

import { resolveGridSearchParams } from "@/utils/dataGrid";
import { type FetchResult, settle } from "@/utils/fetcher";
import { getSuppliers } from "@/utils/inventory";
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

interface SuppliersContentProps {
  canViewAuditLog: boolean;
  canWrite: boolean;
  filterField?: SupplierFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  organization: Organization;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  sortBy?: SupplierSortField;
  sortDirection?: SortDirection;
  suppliers: Promise<FetchResult<{ suppliers: Supplier[]; total: number }>>;
}

const SuppliersContent = async ({
  suppliers: suppliersResult,
  ...props
}: SuppliersContentProps) => {
  const { data: suppliers, error: suppliersError } = await suppliersResult;
  if (suppliersError) return <ErrorAlert />;

  const { suppliers: rows, total: rowCount } = suppliers;

  return (
    <Suppliers
      {...props}
      key={props.organization.slug}
      rowCount={rowCount}
      rows={rows}
    />
  );
};

const SuppliersPage = async ({ params, searchParams }: SuppliersPageProps) => {
  const [cookieStore, { locale }, rawSearchParams] = await Promise.all([
    cookies(),
    params,
    searchParams,
  ]);

  const fetchOptions = {
    headers: { "Accept-Language": locale, cookie: cookieStore.toString() },
  };

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

  const memberRole = await getMemberRole(organization.id);

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

  const suppliers = settle(
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
  );

  return (
    <Suspense fallback={<Suppliers loading />}>
      <SuppliersContent
        canViewAuditLog={canViewAuditLog}
        canWrite={canWrite}
        filterField={filterField}
        filterOperator={filterOperator}
        filterValue={filterValue}
        organization={organization}
        page={page}
        pageSize={pageSize}
        quickFilterValue={quickFilterValue}
        sortBy={sortBy}
        sortDirection={sortDirection}
        suppliers={suppliers}
      />
    </Suspense>
  );
};

export default SuppliersPage;
