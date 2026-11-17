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
import { getRecipeByModifier } from "@/utils/inventory";
import {
  getAdminMenu,
  getAdminModifier,
  getAdminModifierGroup,
} from "@/utils/menus";
import { getAdminOrganization, getMemberRole } from "@/utils/session";

interface ModifierRecipeIngredientsPageProps {
  params: Promise<{
    locale: Locale;
    groupId: string;
    modifierId: string;
    recipeId: string;
  }>;
  searchParams: Promise<RecipeIngredientsSearchParams>;
}

export const generateMetadata = generateRecipeIngredientsMetadata;

const ModifierRecipeIngredientsPage = async ({
  params,
  searchParams,
}: ModifierRecipeIngredientsPageProps) => {
  const [
    cookieStore,
    { locale, groupId, modifierId, recipeId },
    rawSearchParams,
  ] = await Promise.all([cookies(), params, searchParams]);

  const fetchOptions = {
    headers: { "Accept-Language": locale, cookie: cookieStore.toString() },
  };
  const [
    { data: group, error: groupError },
    { data: modifier, error: modifierError },
  ] = await Promise.all([
    settle(getAdminModifierGroup(groupId, fetchOptions)),
    settle(getAdminModifier(modifierId, fetchOptions)),
  ]);
  if (isMissingResource(groupError) || isMissingResource(modifierError))
    notFound();
  if (groupError || modifierError) return <ErrorAlert />;

  if (modifier.modifierGroupId !== groupId) notFound();

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

  const [, { data: recipe, error: recipeError }] = await Promise.all([
    getMemberRole(selectedOrganization.id),
    settle(getRecipeByModifier(modifierId, fetchOptions)),
  ]);
  if (recipeError) return <ErrorAlert />;

  if (recipe?.id !== recipeId) notFound();

  return (
    <RecipeIngredientsPage
      fetchOptions={fetchOptions}
      href={`/menus/modifier-groups/${groupId}/${modifierId}/ingredients/${recipeId}`}
      locale={locale}
      organization={selectedOrganization}
      priceCurrency={modifier.priceCurrency}
      recipe={recipe}
      searchParams={rawSearchParams}
    />
  );
};

export default ModifierRecipeIngredientsPage;
