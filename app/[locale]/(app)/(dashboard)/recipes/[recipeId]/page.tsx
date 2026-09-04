import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import RecipeIngredients from "@/components/RecipeIngredients";

import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import { MAX_PAGE_SIZE } from "@/constants/pagination";

import { getIngredients, getRecipe } from "@/utils/inventory";
import { hasRolePermission } from "@/utils/organizations";

interface RecipeIngredientsPageProps {
  params: Promise<{ locale: Locale; recipeId: string }>;
}

export const generateMetadata = async ({
  params,
}: RecipeIngredientsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return { title: t("inventory.recipes.ingredients.label") };
};

const RecipeIngredientsPage = async ({
  params,
}: RecipeIngredientsPageProps) => {
  const [cookieStore, { locale, recipeId }] = await Promise.all([
    cookies(),
    params,
  ]);

  setRequestLocale(locale);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const recipe = await getRecipe(recipeId, fetchOptions);

  if (!recipe) notFound();

  const { data: organizations } = await authClient.organization.list({
    fetchOptions,
  });

  const organization = organizations?.find(
    ({ id }) => id === recipe.organizationId,
  );

  const [{ data: memberRole }, { ingredients }] = await Promise.all([
    authClient.organization.getActiveMemberRole({
      query: { organizationId: recipe.organizationId },
      fetchOptions,
    }),
    organization
      ? getIngredients(
          organization.slug,
          { pageSize: MAX_PAGE_SIZE },
          fetchOptions,
        )
      : { ingredients: [] },
  ]);

  return (
    <RecipeIngredients
      canCreate={hasRolePermission(memberRole?.role, { inventory: ["create"] })}
      canWrite={hasRolePermission(memberRole?.role, { inventory: ["update"] })}
      ingredients={ingredients}
      menuItem={null}
      organizationSlug={organization?.slug || null}
      recipe={recipe}
    />
  );
};

export default RecipeIngredientsPage;
