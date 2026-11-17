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
import { getRecipe } from "@/utils/inventory";
import { getAdminOrganization } from "@/utils/session";

interface InventoryRecipeIngredientsPageProps {
  params: Promise<{ locale: Locale; recipeId: string }>;
  searchParams: Promise<RecipeIngredientsSearchParams>;
}

export const generateMetadata = generateRecipeIngredientsMetadata;

const InventoryRecipeIngredientsPage = async ({
  params,
  searchParams,
}: InventoryRecipeIngredientsPageProps) => {
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

  return (
    <RecipeIngredientsPage
      fetchOptions={fetchOptions}
      href={`/inventory/recipes/${recipeId}`}
      locale={locale}
      organization={selectedOrganization}
      priceCurrency={selectedOrganization.currency}
      recipe={recipe}
      searchParams={rawSearchParams}
    />
  );
};

export default InventoryRecipeIngredientsPage;
