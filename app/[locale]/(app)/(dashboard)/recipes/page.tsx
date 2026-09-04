import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import Recipes from ".";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import { MAX_PAGE_SIZE } from "@/constants/pagination";

import {
  filterOperatorValues,
  recipeFilterFieldValues,
  recipeSortFieldValues,
} from "@/types/api";

import { resolveGridSearchParams } from "@/utils/dataGrid";
import { getRecipes } from "@/utils/inventory";
import {
  getAdminMenuSectionItems,
  getAdminMenuSections,
  getResolvedAdminOrganizationMenu,
} from "@/utils/menus";
import { hasRolePermission } from "@/utils/organizations";

interface RecipesPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    filterField?: string;
    filterOperator?: string;
    filterValue?: string;
    menuItemId?: string;
    organization?: string;
    page?: string;
    pageSize?: string;
    quickFilterValue?: string;
    sortBy?: string;
    sortDirection?: string;
  }>;
}

export const generateMetadata = async ({
  params,
}: RecipesPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return { title: t("inventory.recipes.label") };
};

const RecipesPage = async ({ params, searchParams }: RecipesPageProps) => {
  const [cookieStore, { locale }, rawSearchParams] = await Promise.all([
    cookies(),
    params,
    searchParams,
  ]);

  setRequestLocale(locale);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const { organization, menu } = await getResolvedAdminOrganizationMenu(
    rawSearchParams.organization,
    fetchOptions,
  );

  if (!organization) notFound();

  const {
    filterField,
    filterOperator,
    filterValue,
    page,
    pageSize,
    quickFilterValue,
    redirectParams,
    sortBy,
    sortDirection,
  } = resolveGridSearchParams({
    searchParams: rawSearchParams,
    sortFields: recipeSortFieldValues,
    filterFields: recipeFilterFieldValues,
    filterOperators: filterOperatorValues,
    organizationSlug: organization.slug,
  });

  if (redirectParams)
    redirect({ href: `/recipes?${redirectParams.toString()}`, locale });

  const [{ data: memberRole }, { recipes, total }, { sections }] =
    await Promise.all([
      authClient.organization.getActiveMemberRole({
        query: { organizationId: organization.id },
        fetchOptions,
      }),
      getRecipes(
        organization.slug,
        {
          page,
          pageSize,
          filterField,
          filterOperator,
          filterValue,
          quickFilterValue,
          sortBy,
          sortDirection,
        },
        fetchOptions,
      ),
      menu
        ? getAdminMenuSections(
            menu.id,
            1,
            MAX_PAGE_SIZE,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            fetchOptions,
          )
        : { sections: [] },
    ]);

  const sectionItems = await Promise.all(
    sections.map(({ id }) =>
      getAdminMenuSectionItems(
        id,
        1,
        MAX_PAGE_SIZE,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        fetchOptions,
      ),
    ),
  );

  return (
    <Recipes
      canCreate={hasRolePermission(memberRole?.role, { inventory: ["create"] })}
      canViewAuditLog={hasRolePermission(memberRole?.role, {
        auditLog: ["read"],
      })}
      canWrite={hasRolePermission(memberRole?.role, { inventory: ["update"] })}
      filterField={filterField}
      filterOperator={filterOperator}
      filterValue={filterValue}
      menuItems={sectionItems.flatMap(({ items }) => items)}
      organizationSlug={organization.slug}
      page={page}
      pageSize={pageSize}
      quickFilterValue={quickFilterValue}
      recipes={recipes}
      rowCount={total}
      sortBy={sortBy}
      sortDirection={sortDirection}
    />
  );
};

export default RecipesPage;
