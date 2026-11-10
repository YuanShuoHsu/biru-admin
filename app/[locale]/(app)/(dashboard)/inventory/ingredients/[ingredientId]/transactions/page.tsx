// https://nextjs.org/docs/app/guides/streaming#status-codes

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import IngredientTransactions from ".";

import ErrorAlert from "@/components/ErrorAlert";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  filterOperatorValues,
  inventoryTransactionFilterFieldValues,
  inventoryTransactionSortFieldValues,
} from "@/types/api";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type {
  Ingredient,
  InventoryTransaction,
  InventoryTransactionFilterField,
  InventoryTransactionSortField,
} from "@/types/inventory";

import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getInventoryTransactionEnumOptions } from "@/utils/enumOptions";
import { type FetchResult, isMissingResource, settle } from "@/utils/fetcher";
import { getIngredient, getInventoryTransactions } from "@/utils/inventory";
import { hasRolePermission } from "@/utils/organizations";
import { getAdminOrganization, getMemberRole } from "@/utils/session";

interface IngredientTransactionsPageProps {
  params: Promise<{ ingredientId: string; locale: Locale }>;
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
}: IngredientTransactionsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tInventory = await getTranslations({ locale, namespace: "inventory" });

  return { title: tInventory("transactions.label") };
};

interface IngredientTransactionsContentProps {
  canViewPurchasing: boolean;
  filterField?: InventoryTransactionFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  ingredient: Ingredient;
  organizationSlug: string;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  sortBy?: InventoryTransactionSortField;
  sortDirection?: SortDirection;
  transactions: Promise<
    FetchResult<{ transactions: InventoryTransaction[]; total: number }>
  >;
}

const IngredientTransactionsContent = async ({
  organizationSlug,
  transactions: transactionsResult,
  ...props
}: IngredientTransactionsContentProps) => {
  const { data: transactions, error: transactionsError } =
    await transactionsResult;
  if (transactionsError) return <ErrorAlert />;

  const { transactions: rows, total: rowCount } = transactions;

  return (
    <IngredientTransactions
      {...props}
      key={organizationSlug}
      rowCount={rowCount}
      rows={rows}
    />
  );
};

const IngredientTransactionsPage = async ({
  params,
  searchParams,
}: IngredientTransactionsPageProps) => {
  const [cookieStore, { ingredientId, locale }, rawSearchParams] =
    await Promise.all([cookies(), params, searchParams]);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const { data: ingredient, error: ingredientError } = await settle(
    getIngredient(ingredientId, fetchOptions),
  );
  if (isMissingResource(ingredientError)) notFound();
  if (ingredientError) return <ErrorAlert />;

  const organization = await getAdminOrganization(
    ingredient.organizationId,
    rawSearchParams.organization,
  );
  if (!organization) notFound();

  const memberRole = await getMemberRole(organization.id);

  const canViewPurchasing = hasRolePermission(memberRole, {
    purchasing: ["read"],
  });

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
    sortFields: inventoryTransactionSortFieldValues,
    filterFields: inventoryTransactionFilterFieldValues,
    filterOperators: filterOperatorValues,
    organizationSlug: organization.slug,
  });

  if (redirectParams)
    redirect({
      href: `/inventory/ingredients/${ingredientId}/transactions?${redirectParams.toString()}`,
      locale,
    });

  const quickFilterEnums = quickFilterValue
    ? getQuickFilterEnums(
        quickFilterValue,
        getInventoryTransactionEnumOptions(
          await getTranslations({ locale, namespace: "inventory" }),
        ),
      )
    : [];

  const transactions = settle(
    getInventoryTransactions(
      ingredientId,
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
  );

  return (
    <Suspense fallback={<IngredientTransactions loading />}>
      <IngredientTransactionsContent
        canViewPurchasing={canViewPurchasing}
        filterField={filterField}
        filterOperator={filterOperator}
        filterValue={filterValue}
        ingredient={ingredient}
        organizationSlug={organization.slug}
        page={page}
        pageSize={pageSize}
        quickFilterValue={quickFilterValue}
        sortBy={sortBy}
        sortDirection={sortDirection}
        transactions={transactions}
      />
    </Suspense>
  );
};

export default IngredientTransactionsPage;
