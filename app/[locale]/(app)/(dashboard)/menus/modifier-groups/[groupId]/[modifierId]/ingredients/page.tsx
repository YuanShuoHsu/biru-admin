// https://nextjs.org/docs/app/guides/streaming#status-codes

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import BoundRecipe from "@/components/BoundRecipe";

import ErrorAlert from "@/components/ErrorAlert";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import type { Recipe } from "@/types/inventory";
import type { Modifier } from "@/types/menus";
import type { Organization } from "@/types/organizations";

import { type FetchResult, isMissingResource, settle } from "@/utils/fetcher";
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

interface ModifierRecipeContentProps {
  canCreate: boolean;
  canViewAuditLog: boolean;
  canViewPurchasing: boolean;
  modifier: Modifier;
  organization: Organization;
  recipe: Promise<FetchResult<Recipe | null>>;
}

const ModifierRecipeContent = async ({
  recipe: recipeResult,
  ...props
}: ModifierRecipeContentProps) => {
  const { data: recipe, error: recipeError } = await recipeResult;
  if (recipeError) return <ErrorAlert />;

  return <BoundRecipe {...props} recipe={recipe} />;
};

const ModifierRecipePage = async ({
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

  const recipe = settle(getRecipeByModifier(modifierId, fetchOptions));
  const memberRole = await getMemberRole(selectedOrganization.id);

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
    <Suspense fallback={<BoundRecipe loading />}>
      <ModifierRecipeContent
        canCreate={canCreate}
        canViewAuditLog={canViewAuditLog}
        canViewPurchasing={canViewPurchasing}
        modifier={modifier}
        organization={selectedOrganization}
        recipe={recipe}
      />
    </Suspense>
  );
};

export default ModifierRecipePage;
