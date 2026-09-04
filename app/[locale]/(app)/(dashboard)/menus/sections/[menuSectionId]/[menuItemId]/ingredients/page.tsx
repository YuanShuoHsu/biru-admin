import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import RecipeIngredients from "@/components/RecipeIngredients";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import { MAX_PAGE_SIZE } from "@/constants/pagination";

import { getIngredients, getRecipe } from "@/utils/inventory";
import {
  DEFAULT_MENUS_HREF,
  getAdminMenu,
  getAdminMenuItem,
  getAdminMenuSection,
  getAdminOrganization,
} from "@/utils/menus";
import { hasRolePermission } from "@/utils/organizations";

interface MenuItemIngredientsPageProps {
  params: Promise<{
    locale: Locale;
    menuSectionId: string;
    menuItemId: string;
  }>;
  searchParams: Promise<{ organization?: string }>;
}

export const generateMetadata = async ({
  params,
}: MenuItemIngredientsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return { title: t("inventory.recipes.ingredients.label") };
};

const MenuItemIngredientsPage = async ({
  params,
  searchParams,
}: MenuItemIngredientsPageProps) => {
  const [cookieStore, { locale, menuSectionId, menuItemId }, rawSearchParams] =
    await Promise.all([cookies(), params, searchParams]);

  setRequestLocale(locale);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };
  const section = await getAdminMenuSection(menuSectionId, fetchOptions);

  if (!section?.menuId) notFound();

  const [menu, selectedOrganization, menuItem] = await Promise.all([
    getAdminMenu(section.menuId, fetchOptions),
    getAdminOrganization(rawSearchParams.organization, fetchOptions),
    getAdminMenuItem(menuItemId, fetchOptions),
  ]);

  if (!menuItem) notFound();

  if (!selectedOrganization || selectedOrganization.id !== menu?.organizationId)
    return redirect({ href: DEFAULT_MENUS_HREF, locale });

  const [{ data: memberRole }, { ingredients }, recipe] = await Promise.all([
    authClient.organization.getActiveMemberRole({
      query: { organizationId: menu.organizationId },
      fetchOptions,
    }),
    getIngredients(
      selectedOrganization.slug,
      { pageSize: MAX_PAGE_SIZE },
      fetchOptions,
    ),
    menuItem.recipe ? getRecipe(menuItem.recipe.id, fetchOptions) : null,
  ]);

  if (menuItem.recipe && !recipe) notFound();

  return (
    <RecipeIngredients
      canCreate={hasRolePermission(memberRole?.role, { inventory: ["create"] })}
      canWrite={hasRolePermission(memberRole?.role, { inventory: ["update"] })}
      ingredients={ingredients}
      menuItem={menuItem}
      organizationSlug={selectedOrganization.slug}
      recipe={recipe}
    />
  );
};

export default MenuItemIngredientsPage;
