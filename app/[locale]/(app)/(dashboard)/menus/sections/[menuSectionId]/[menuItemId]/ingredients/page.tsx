import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import MenuItemRecipe from ".";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { MAX_PAGE_SIZE } from "@/constants/pagination";

import { getHref } from "@/utils/href";
import { getIngredients, getRecipeByMenuItem } from "@/utils/inventory";
import {
  getAdminMenu,
  getAdminMenuItem,
  getAdminMenuSection,
} from "@/utils/menus";
import { hasRolePermission } from "@/utils/organizations";
import { getAdminOrganization, getMemberRole } from "@/utils/session";

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
  const tInventory = await getTranslations({ locale, namespace: "inventory" });

  return { title: tInventory("recipes.label") };
};

const MenuItemRecipePage = async ({
  params,
  searchParams,
}: MenuItemRecipePageProps) => {
  const [cookieStore, { locale, menuSectionId, menuItemId }, rawSearchParams] =
    await Promise.all([cookies(), params, searchParams]);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };
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

  if (rawSearchParams.organization !== selectedOrganization.slug)
    redirect({
      href: getHref(
        `/menus/sections/${menuSectionId}/${menuItemId}/ingredients`,
        {
          organization: selectedOrganization.slug,
        },
      ),
      locale,
    });

  const [memberRole, { ingredients }, recipe] = await Promise.all([
    getMemberRole(selectedOrganization.id),
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

  const canCreate = hasRolePermission(memberRole, {
    inventory: ["create"],
  });
  const canViewAuditLog = hasRolePermission(memberRole, {
    auditLog: ["read"],
  });
  const canViewPurchasing = hasRolePermission(memberRole, {
    purchasing: ["read"],
  });
  const canWrite = hasRolePermission(memberRole, {
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
      organization={selectedOrganization}
      recipe={recipe}
    />
  );
};

export default MenuItemRecipePage;
