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

import { resolveGridSearchParams } from "@/utils/dataGrid";
import { isMissingResource, settle } from "@/utils/fetcher";
import { getRecipeByModifier, getRecipeIngredients } from "@/utils/inventory";
import { getAdminMenu, getAdminModifierGroup } from "@/utils/menus";
import { hasRolePermission } from "@/utils/organizations";
import { getAdminOrganization, getMemberRole } from "@/utils/session";

interface RecipeIngredientsPageProps {
  params: Promise<{
    locale: Locale;
    groupId: string;
    modifierId: string;
    recipeId: string;
  }>;
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

const RecipeIngredientsContent = async ({
  params,
  searchParams,
}: RecipeIngredientsPageProps) => {
  const [
    cookieStore,
    { locale, groupId, modifierId, recipeId },
    rawSearchParams,
  ] = await Promise.all([cookies(), params, searchParams]);

  const fetchOptions = {
    headers: { "Accept-Language": locale, cookie: cookieStore.toString() },
  };
  const { data: group, error: groupError } = await settle(
    getAdminModifierGroup(groupId, fetchOptions),
  );
  if (isMissingResource(groupError)) notFound();
  if (groupError) return <ErrorAlert />;

  const { data: menu, error: menuError } = await settle(
    getAdminMenu(group.menuId, fetchOptions),
  );
  if (isMissingResource(menuError)) notFound();
  if (menuError) return <ErrorAlert />;

  const selectedOrganization = await getAdminOrganization(
    menu.organizationId,
    rawSearchParams.organization,
  );
  if (!selectedOrganization) notFound();

  const [memberRole, { data: recipe, error: recipeError }] = await Promise.all([
    getMemberRole(selectedOrganization.id),
    settle(getRecipeByModifier(modifierId, fetchOptions)),
  ]);
  if (isMissingResource(recipeError)) notFound();
  if (recipeError) return <ErrorAlert />;

  if (recipe?.id !== recipeId) notFound();

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
      href: `/menus/modifier-groups/${groupId}/${modifierId}/ingredients/${recipeId}?${redirectParams.toString()}`,
      locale,
    });

  const { data: materials, error: materialsError } = await settle(
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
  if (materialsError) return <ErrorAlert />;

  const { materials: rows, total: rowCount } = materials;

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
    <RecipeIngredients
      canCreate={canCreate}
      canDelete={canDelete}
      canViewPurchasing={canViewPurchasing}
      canWrite={canWrite}
      filterField={filterField}
      filterOperator={filterOperator}
      filterValue={filterValue}
      key={selectedOrganization.slug}
      organizationSlug={selectedOrganization.slug}
      page={page}
      pageSize={pageSize}
      priceCurrency={selectedOrganization.currency}
      quickFilterValue={quickFilterValue}
      recipe={recipe}
      rowCount={rowCount}
      rows={rows}
      sortBy={sortBy}
      sortDirection={sortDirection}
    />
  );
};

const RecipeIngredientsPage = (props: RecipeIngredientsPageProps) => (
  <Suspense fallback={<RecipeIngredients loading />}>
    <RecipeIngredientsContent {...props} />
  </Suspense>
);

export default RecipeIngredientsPage;
