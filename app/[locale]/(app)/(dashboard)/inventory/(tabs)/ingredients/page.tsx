import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import Ingredients from ".";

import { MAX_PAGE_SIZE } from "@/constants/pagination";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  filterOperatorValues,
  ingredientFilterFieldValues,
  ingredientSortFieldValues,
} from "@/types/api";

import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getIngredientEnumOptions } from "@/utils/enumOptions";
import { getIngredients, getSuppliers } from "@/utils/inventory";
import { hasRolePermission } from "@/utils/organizations";
import { getMemberRole, getResolvedAdminOrganization } from "@/utils/session";

interface IngredientsPageProps {
  params: Promise<{ locale: Locale }>;
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
}: IngredientsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tInventory = await getTranslations({ locale, namespace: "inventory" });

  return { title: tInventory("ingredients.label") };
};

const IngredientsPage = async ({
  params,
  searchParams,
}: IngredientsPageProps) => {
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
    sortFields: ingredientSortFieldValues,
    filterFields: ingredientFilterFieldValues,
    filterOperators: filterOperatorValues,
    organizationSlug: organization.slug,
  });

  if (redirectParams)
    redirect({
      href: `/inventory/ingredients?${redirectParams.toString()}`,
      locale,
    });

  const memberRole = await getMemberRole(organization.id);

  const canRecordTransaction = hasRolePermission(memberRole, {
    inventoryTransaction: ["create"],
  });
  const canViewAuditLog = hasRolePermission(memberRole, {
    auditLog: ["read"],
  });
  const canViewInventory = hasRolePermission(memberRole, {
    inventory: ["read"],
  });
  const canViewPurchasing = hasRolePermission(memberRole, {
    purchasing: ["read"],
  });
  const canWrite = hasRolePermission(memberRole, {
    inventory: ["update"],
  });

  if (!canViewInventory) notFound();

  const quickFilterEnums = quickFilterValue
    ? getQuickFilterEnums(
        quickFilterValue,
        getIngredientEnumOptions(
          await getTranslations({ locale, namespace: "inventory" }),
        ),
      )
    : [];

  const [{ ingredients: rows, total: rowCount }, { suppliers }] =
    await Promise.all([
      getIngredients(
        organization.slug,
        {
          page,
          pageSize,
          filterField,
          filterOperator,
          filterValue,
          quickFilterEnums,
          quickFilterValue,
          sortBy,
          sortDirection,
        },
        fetchOptions,
      ),
      canViewPurchasing
        ? getSuppliers(
            organization.slug,
            { pageSize: MAX_PAGE_SIZE, sortBy: "name", sortDirection: "asc" },
            fetchOptions,
          )
        : { suppliers: [] },
    ]);

  return (
    <Ingredients
      canRecordTransaction={canRecordTransaction}
      canViewAuditLog={canViewAuditLog}
      canViewPurchasing={canViewPurchasing}
      canWrite={canWrite}
      filterField={filterField}
      filterOperator={filterOperator}
      filterValue={filterValue}
      organization={organization}
      page={page}
      pageSize={pageSize}
      quickFilterValue={quickFilterValue}
      rowCount={rowCount}
      rows={rows}
      sortBy={sortBy}
      sortDirection={sortDirection}
      suppliers={suppliers}
    />
  );
};

export default IngredientsPage;
