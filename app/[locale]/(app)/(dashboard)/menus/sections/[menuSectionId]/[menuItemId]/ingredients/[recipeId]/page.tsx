// https://nextjs.org/docs/app/guides/streaming#status-codes

import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import ErrorAlert from "@/components/ErrorAlert";
import RecipeIngredientsPage, {
  generateRecipeIngredientsMetadata,
  type RecipeIngredientsSearchParams,
} from "@/components/RecipeIngredientsPage";

import type { Locale } from "@/i18n/routing";

import { isMissingResource, settle } from "@/utils/fetcher";
import { getRecipeByMenuItem } from "@/utils/inventory";
import {
  getAdminMenu,
  getAdminMenuItem,
  getAdminMenuSection,
} from "@/utils/menus";
import { getAdminOrganization, getMemberRole } from "@/utils/session";

interface MenuItemRecipeIngredientsPageProps {
  params: Promise<{
    locale: Locale;
    menuSectionId: string;
    menuItemId: string;
    recipeId: string;
  }>;
  searchParams: Promise<RecipeIngredientsSearchParams>;
}

export const generateMetadata = generateRecipeIngredientsMetadata;

const MenuItemRecipeIngredientsPage = async ({
  params,
  searchParams,
}: MenuItemRecipeIngredientsPageProps) => {
  const [
    cookieStore,
    { locale, menuSectionId, menuItemId, recipeId },
    rawSearchParams,
  ] = await Promise.all([cookies(), params, searchParams]);

  const fetchOptions = {
    headers: { "Accept-Language": locale, cookie: cookieStore.toString() },
  };
  const { data: section, error: sectionError } = await settle(
    getAdminMenuSection(menuSectionId, fetchOptions),
  );
  if (isMissingResource(sectionError)) notFound();
  if (sectionError) return <ErrorAlert />;

  const [
    { data: menu, error: menuError },
    { data: menuItem, error: menuItemError },
  ] = await Promise.all([
    settle(getAdminMenu(section.menuId, fetchOptions)),
    settle(getAdminMenuItem(menuItemId, fetchOptions)),
  ]);
  if (isMissingResource(menuError) || isMissingResource(menuItemError))
    notFound();
  if (menuError || menuItemError) return <ErrorAlert />;

  const selectedOrganization = await getAdminOrganization(
    menu.organizationId,
    rawSearchParams.organization,
  );
  if (!selectedOrganization) notFound();

  const [, { data: recipe, error: recipeError }] = await Promise.all([
    getMemberRole(selectedOrganization.id),
    settle(getRecipeByMenuItem(menuItemId, fetchOptions)),
  ]);
  if (recipeError) return <ErrorAlert />;

  if (recipe?.id !== recipeId) notFound();

  return (
    <RecipeIngredientsPage
      fetchOptions={fetchOptions}
      href={`/menus/sections/${menuSectionId}/${menuItemId}/ingredients/${recipeId}`}
      locale={locale}
      organization={selectedOrganization}
      priceCurrency={menuItem.offer?.priceCurrency}
      recipe={recipe}
      searchParams={rawSearchParams}
    />
  );
};

export default MenuItemRecipeIngredientsPage;
