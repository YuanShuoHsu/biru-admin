import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import MenuItemRecipe from ".";

import ErrorAlert from "@/components/ErrorAlert";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { isMissingResource, settle } from "@/utils/fetcher";
import { getHref } from "@/utils/href";
import { getRecipeByMenuItem } from "@/utils/inventory";
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

const MenuItemRecipeContent = async ({
  params,
  searchParams,
}: MenuItemRecipePageProps) => {
  const [cookieStore, { locale, menuSectionId, menuItemId }, rawSearchParams] =
    await Promise.all([cookies(), params, searchParams]);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };
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

  const [memberRole, { data: recipe, error: recipeError }] = await Promise.all([
    getMemberRole(selectedOrganization.id),
    settle(getRecipeByMenuItem(menuItemId, fetchOptions)),
  ]);
  if (recipeError) return <ErrorAlert />;

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
      menuItem={menuItem}
      organization={selectedOrganization}
      recipe={recipe}
    />
  );
};

const MenuItemRecipePage = (props: MenuItemRecipePageProps) => (
  <Suspense fallback={<MenuItemRecipe loading />}>
    <MenuItemRecipeContent {...props} />
  </Suspense>
);

export default MenuItemRecipePage;
