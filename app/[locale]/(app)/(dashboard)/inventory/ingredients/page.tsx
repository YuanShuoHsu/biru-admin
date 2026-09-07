import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import Ingredients from ".";

import InventoryTabsLayout from "../InventoryTabsLayout";

import { MAX_PAGE_SIZE } from "@/constants/pagination";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import {
  filterOperatorValues,
  ingredientFilterFieldValues,
  ingredientSortFieldValues,
} from "@/types/api";

import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getIngredientEnumOptions } from "@/utils/enumOptions";
import { getIngredients, getSuppliers } from "@/utils/inventory";
import { getResolvedAdminOrganization } from "@/utils/menus";
import { hasRolePermission } from "@/utils/organizations";

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
  const t = await getTranslations({ locale });

  return { title: t("inventory.ingredients.label") };
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

  const { data: memberRole } =
    await authClient.organization.getActiveMemberRole({
      query: { organizationId: organization.id },
      fetchOptions,
    });

  const canRecordTransaction = hasRolePermission(memberRole?.role, {
    inventoryTransaction: ["create"],
  });
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

  const [{ ingredients, total }, { suppliers }] = await Promise.all([
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
    <InventoryTabsLayout
      canViewInventory={canViewInventory}
      canViewPurchasing={canViewPurchasing}
    >
      <Ingredients
        canRecordTransaction={canRecordTransaction}
        canViewAuditLog={canViewAuditLog}
        canViewPurchasing={canViewPurchasing}
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

export default IngredientsPage;
