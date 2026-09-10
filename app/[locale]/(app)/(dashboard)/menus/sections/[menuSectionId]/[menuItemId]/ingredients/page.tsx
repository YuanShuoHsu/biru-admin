import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import MenuItemRecipe from ".";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import { MAX_PAGE_SIZE } from "@/constants/pagination";

import { getIngredients, getRecipeByMenuItem } from "@/utils/inventory";
import {
  DEFAULT_MENUS_HREF,
  getAdminMenu,
  getAdminMenuItem,
  getAdminMenuSection,
  getAdminOrganization,
} from "@/utils/menus";
import { hasRolePermission } from "@/utils/organizations";

interface MenuItemRecipePageProps {
  params: Promise<{
    locale: Locale;
    menuSectionId: string;
    menuItemId: string;
  }>;
  searchParams: Promise<{ organization?: string }>;
}

export const generateMetadata = async ({
  params,
}: MenuItemRecipePageProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return { title: t("inventory.recipes.label") };
};

const MenuItemRecipePage = async ({
  params,
  searchParams,
}: MenuItemRecipePageProps) => {
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
    menuItem.recipe
      ? { ingredients: [], total: 0 }
      : getIngredients(
          selectedOrganization.slug,
          { pageSize: MAX_PAGE_SIZE },
          fetchOptions,
        ),
    getRecipeByMenuItem(menuItemId, fetchOptions),
  ]);

  if (menuItem.recipe && !recipe) notFound();

  const canCreate = hasRolePermission(memberRole?.role, {
    inventory: ["create"],
  });
  const canViewAuditLog = hasRolePermission(memberRole?.role, {
    auditLog: ["read"],
  });
  const canViewPurchasing = hasRolePermission(memberRole?.role, {
    purchasing: ["read"],
  });
  const canWrite = hasRolePermission(memberRole?.role, {
    inventory: ["update"],
  });

  return (
    <MenuItemRecipe
      canCreate={canCreate}
      canViewAuditLog={canViewAuditLog}
      canViewPurchasing={canViewPurchasing}
      canWrite={canWrite}
      ingredients={ingredients}
      menuItem={menuItem}
      organizationSlug={selectedOrganization.slug}
      recipe={recipe}
    />
  );
};

export default MenuItemRecipePage;
