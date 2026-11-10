// https://nextjs.org/docs/app/guides/streaming#status-codes

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
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

import { resolveGridSearchParams } from "@/utils/dataGrid";
import { type FetchResult, isMissingResource, settle } from "@/utils/fetcher";
import { getRecipe, getRecipeIngredients } from "@/utils/inventory";
import { hasRolePermission } from "@/utils/organizations";
import { getAdminOrganization, getMemberRole } from "@/utils/session";

interface RecipeIngredientsPageProps {
  params: Promise<{ locale: Locale; recipeId: string }>;
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
}: RecipeIngredientsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tInventory = await getTranslations({ locale, namespace: "inventory" });

  return { title: tInventory("recipes.ingredients.label") };
};

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
  params,
  searchParams,
}: RecipeIngredientsPageProps) => {
  const [cookieStore, { locale, recipeId }, rawSearchParams] =
    await Promise.all([cookies(), params, searchParams]);

  const fetchOptions = {
    headers: { "Accept-Language": locale, cookie: cookieStore.toString() },
  };
  const { data: recipe, error: recipeError } = await settle(
    getRecipe(recipeId, fetchOptions),
  );
  if (isMissingResource(recipeError)) notFound();
  if (recipeError) return <ErrorAlert />;

  if (recipe.menuItemId || recipe.modifierId) notFound();

  const selectedOrganization = await getAdminOrganization(
    recipe.organizationId,
    rawSearchParams.organization,
  );
  if (!selectedOrganization) notFound();

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
    sortFields: recipeIngredientSortFieldValues,
    filterFields: recipeIngredientFilterFieldValues,
    filterOperators: filterOperatorValues,
    organizationSlug: selectedOrganization.slug,
  });

  if (redirectParams)
    redirect({
      href: `/inventory/recipes/${recipeId}?${redirectParams.toString()}`,
      locale,
    });

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
  const memberRole = await getMemberRole(selectedOrganization.id);

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
        organizationSlug={selectedOrganization.slug}
        page={page}
        pageSize={pageSize}
        priceCurrency={selectedOrganization.currency}
        quickFilterValue={quickFilterValue}
        recipe={recipe}
        sortBy={sortBy}
        sortDirection={sortDirection}
      />
    </Suspense>
  );
};

export default RecipeIngredientsPage;
