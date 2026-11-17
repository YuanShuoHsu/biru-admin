// https://nextjs.org/docs/app/guides/streaming#status-codes

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import ErrorAlert from "@/components/ErrorAlert";
import RecipeIngredients from "@/components/RecipeIngredients";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  filterOperatorValues,
  recipeIngredientFilterFieldValues,
  recipeIngredientSortFieldValues,
} from "@/types/api";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type {
  Recipe,
  RecipeIngredient,
  RecipeIngredientFilterField,
  RecipeIngredientSortField,
} from "@/types/inventory";
import type { Organization } from "@/types/organizations";

import { resolveGridSearchParams } from "@/utils/dataGrid";
import { type FetchResult, settle } from "@/utils/fetcher";
import { getRecipeIngredients } from "@/utils/inventory";
import { hasRolePermission } from "@/utils/organizations";
import { getMemberRole } from "@/utils/session";

export interface RecipeIngredientsSearchParams {
  filterField?: string;
  filterOperator?: string;
  filterValue?: string;
  organization?: string;
  page?: string;
  pageSize?: string;
  quickFilterValue?: string;
  sortBy?: string;
  sortDirection?: string;
}

interface RecipeIngredientsPageProps {
  fetchOptions: RequestInit;
  href: string;
  locale: Locale;
  organization: Organization;
  priceCurrency?: string;
  recipe: Recipe;
  searchParams: RecipeIngredientsSearchParams;
}

interface RecipeIngredientsContentProps {
  canCreate: boolean;
  canDelete: boolean;
  canViewPurchasing: boolean;
  canWrite: boolean;
  filterField?: RecipeIngredientFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  materials: Promise<
    FetchResult<{ materials: RecipeIngredient[]; total: number }>
  >;
  organizationSlug: string;
  page: number;
  pageSize: number;
  priceCurrency?: string;
  quickFilterValue?: string;
  recipe: Recipe;
  sortBy?: RecipeIngredientSortField;
  sortDirection?: SortDirection;
}

const RecipeIngredientsContent = async ({
  materials: materialsResult,
  ...props
}: RecipeIngredientsContentProps) => {
  const { data: materials, error: materialsError } = await materialsResult;
  if (materialsError) return <ErrorAlert />;

  const { materials: rows, total: rowCount } = materials;

  return (
    <RecipeIngredients
      {...props}
      key={props.organizationSlug}
      rowCount={rowCount}
      rows={rows}
    />
  );
};

const RecipeIngredientsPage = async ({
  fetchOptions,
  href,
  locale,
  organization,
  priceCurrency,
  recipe,
  searchParams,
}: RecipeIngredientsPageProps) => {
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
    searchParams,
    sortFields: recipeIngredientSortFieldValues,
    filterFields: recipeIngredientFilterFieldValues,
    filterOperators: filterOperatorValues,
    organizationSlug: organization.slug,
  });

  if (redirectParams)
    redirect({ href: `${href}?${redirectParams.toString()}`, locale });

  const materials = settle(
    getRecipeIngredients(
      recipe.id,
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
  const memberRole = await getMemberRole(organization.id);

  const canCreate = hasRolePermission(memberRole, {
    inventory: ["create"],
  });
  const canDelete = hasRolePermission(memberRole, {
    inventory: ["delete"],
  });
  const canViewPurchasing = hasRolePermission(memberRole, {
    purchasing: ["read"],
  });
  const canWrite = hasRolePermission(memberRole, {
    inventory: ["update"],
  });

  return (
    <Suspense fallback={<RecipeIngredients loading />}>
      <RecipeIngredientsContent
        canCreate={canCreate}
        canDelete={canDelete}
        canViewPurchasing={canViewPurchasing}
        canWrite={canWrite}
        filterField={filterField}
        filterOperator={filterOperator}
        filterValue={filterValue}
        materials={materials}
        organizationSlug={organization.slug}
        page={page}
        pageSize={pageSize}
        priceCurrency={priceCurrency}
        quickFilterValue={quickFilterValue}
        recipe={recipe}
        sortBy={sortBy}
        sortDirection={sortDirection}
      />
    </Suspense>
  );
};

export const generateRecipeIngredientsMetadata = async ({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> => {
  const { locale } = await params;
  const tInventory = await getTranslations({ locale, namespace: "inventory" });

  return { title: tInventory("recipes.ingredients.label") };
};

export default RecipeIngredientsPage;
