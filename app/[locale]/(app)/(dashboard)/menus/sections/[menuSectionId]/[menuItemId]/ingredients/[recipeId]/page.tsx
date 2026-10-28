import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import RecipeIngredients from ".";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  filterOperatorValues,
  recipeIngredientFilterFieldValues,
  recipeIngredientSortFieldValues,
} from "@/types/api";

import { resolveGridSearchParams } from "@/utils/dataGrid";
import { getRecipeByMenuItem, getRecipeIngredients } from "@/utils/inventory";
import {
  getAdminMenu,
  getAdminMenuItem,
  getAdminMenuSection,
} from "@/utils/menus";
import { hasRolePermission } from "@/utils/organizations";
import { getAdminOrganization, getMemberRole } from "@/utils/session";

interface RecipeIngredientsPageProps {
  params: Promise<{
    locale: Locale;
    menuSectionId: string;
    menuItemId: string;
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
    { locale, menuSectionId, menuItemId, recipeId },
    rawSearchParams,
  ] = await Promise.all([cookies(), params, searchParams]);

  const fetchOptions = {
    headers: { "Accept-Language": locale, cookie: cookieStore.toString() },
  };
  const section = await getAdminMenuSection(menuSectionId, fetchOptions);

  if (!section?.menuId) notFound();

  const [menu, menuItem] = await Promise.all([
    getAdminMenu(section.menuId, fetchOptions),
    getAdminMenuItem(menuItemId, fetchOptions),
  ]);

  if (!menuItem) notFound();

  const selectedOrganization = await getAdminOrganization(
    menu?.organizationId,
    rawSearchParams.organization,
  );
  if (!selectedOrganization) notFound();

  const [memberRole, recipe] = await Promise.all([
    getMemberRole(selectedOrganization.id),
    getRecipeByMenuItem(menuItemId, fetchOptions),
  ]);

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
      href: `/menus/sections/${menuSectionId}/${menuItemId}/ingredients/${recipeId}?${redirectParams.toString()}`,
      locale,
    });

  const { materials: rows, total: rowCount } = await getRecipeIngredients(
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
  );

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
      menuItem={menuItem}
      organizationSlug={selectedOrganization.slug}
      page={page}
      pageSize={pageSize}
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
