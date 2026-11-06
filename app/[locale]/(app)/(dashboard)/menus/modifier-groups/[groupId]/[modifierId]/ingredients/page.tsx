import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import MenuItemRecipe from "@/app/[locale]/(app)/(dashboard)/menus/sections/[menuSectionId]/[menuItemId]/ingredients";

import ErrorAlert from "@/components/ErrorAlert";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { isMissingResource, settle } from "@/utils/fetcher";
import { getHref } from "@/utils/href";
import { getRecipeByModifier } from "@/utils/inventory";
import {
  getAdminMenu,
  getAdminModifier,
  getAdminModifierGroup,
} from "@/utils/menus";
import { hasRolePermission } from "@/utils/organizations";
import { getAdminOrganization, getMemberRole } from "@/utils/session";

interface ModifierRecipePageProps {
  params: Promise<{
    locale: Locale;
    groupId: string;
    modifierId: string;
  }>;
  searchParams: Promise<{ organization?: string }>;
}

export const generateMetadata = async ({
  params,
}: ModifierRecipePageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tInventory = await getTranslations({ locale, namespace: "inventory" });

  return { title: tInventory("recipes.label") };
};

const ModifierRecipeContent = async ({
  params,
  searchParams,
}: ModifierRecipePageProps) => {
  const [cookieStore, { locale, groupId, modifierId }, rawSearchParams] =
    await Promise.all([cookies(), params, searchParams]);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };
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

  if (rawSearchParams.organization !== selectedOrganization.slug)
    redirect({
      href: getHref(
        `/menus/modifier-groups/${groupId}/${modifierId}/ingredients`,
        {
          organization: selectedOrganization.slug,
        },
      ),
      locale,
    });

  const [memberRole, { data: recipe, error: recipeError }] = await Promise.all([
    getMemberRole(selectedOrganization.id),
    settle(getRecipeByModifier(modifierId, fetchOptions)),
  ]);
  if (recipeError) return <ErrorAlert />;

  const canCreate = hasRolePermission(memberRole, {
    inventory: ["create"],
  });
  const canViewAuditLog = hasRolePermission(memberRole, {
    auditLog: ["read"],
  });
  const canViewPurchasing = hasRolePermission(memberRole, {
    purchasing: ["read"],
  });

  return (
    <MenuItemRecipe
      canCreate={canCreate}
      canViewAuditLog={canViewAuditLog}
      canViewPurchasing={canViewPurchasing}
      modifier={modifier}
      organization={selectedOrganization}
      recipe={recipe}
    />
  );
};

const ModifierRecipePage = (props: ModifierRecipePageProps) => (
  <Suspense fallback={<MenuItemRecipe loading />}>
    <ModifierRecipeContent {...props} />
  </Suspense>
);

export default ModifierRecipePage;
