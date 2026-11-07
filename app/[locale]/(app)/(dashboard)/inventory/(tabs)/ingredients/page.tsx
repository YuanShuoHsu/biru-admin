// https://nextjs.org/docs/app/guides/streaming#status-codes

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import Ingredients from ".";

import ErrorAlert from "@/components/ErrorAlert";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  filterOperatorValues,
  ingredientFilterFieldValues,
  ingredientSortFieldValues,
} from "@/types/api";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type {
  Ingredient,
  IngredientFilterField,
  IngredientSortField,
} from "@/types/inventory";
import type { Organization } from "@/types/organizations";

import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getIngredientEnumOptions } from "@/utils/enumOptions";
import { type FetchResult, settle } from "@/utils/fetcher";
import { getIngredients } from "@/utils/inventory";
import { hasRolePermission } from "@/utils/organizations";
import { getMemberRole, getResolvedAdminOrganization } from "@/utils/session";

interface IngredientsPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    filterField?: string;
    filterOperator?: string;
    filterValue?: string;
    lowStock?: string;
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

interface IngredientsContentProps {
  canRecordTransaction: boolean;
  canViewAuditLog: boolean;
  canViewPurchasing: boolean;
  canWrite: boolean;
  filterField?: IngredientFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  ingredients: Promise<
    FetchResult<{ ingredients: Ingredient[]; total: number }>
  >;
  lowStock: boolean;
  organization: Organization;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  sortBy?: IngredientSortField;
  sortDirection?: SortDirection;
}

const IngredientsContent = async ({
  ingredients: ingredientsResult,
  ...props
}: IngredientsContentProps) => {
  const { data: ingredients, error } = await ingredientsResult;
  if (error) return <ErrorAlert />;

  const { ingredients: rows, total: rowCount } = ingredients;

  return (
    <Ingredients
      {...props}
      key={props.organization.slug}
      rowCount={rowCount}
      rows={rows}
    />
  );
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

  const lowStock = rawSearchParams.lowStock === "true";

  const ingredients = settle(
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
      lowStock,
    ),
  );

  return (
    <Suspense fallback={<Ingredients loading />}>
      <IngredientsContent
        canRecordTransaction={canRecordTransaction}
        canViewAuditLog={canViewAuditLog}
        canViewPurchasing={canViewPurchasing}
        canWrite={canWrite}
        filterField={filterField}
        filterOperator={filterOperator}
        filterValue={filterValue}
        ingredients={ingredients}
        lowStock={lowStock}
        organization={organization}
        page={page}
        pageSize={pageSize}
        quickFilterValue={quickFilterValue}
        sortBy={sortBy}
        sortDirection={sortDirection}
      />
    </Suspense>
  );
};

export default IngredientsPage;
