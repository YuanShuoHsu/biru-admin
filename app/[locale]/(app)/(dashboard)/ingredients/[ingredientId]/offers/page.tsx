import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import IngredientOffers from ".";

import type { Locale } from "@/i18n/routing";

import { MAX_PAGE_SIZE } from "@/constants/pagination";

import {
  getIngredient,
  getIngredientOffers,
  getSuppliers,
} from "@/utils/inventory";
import { getResolvedAdminOrganization } from "@/utils/menus";
import { hasRolePermission } from "@/utils/organizations";

import { authClient } from "@/lib/auth-client";

interface IngredientOffersPageProps {
  params: Promise<{ ingredientId: string; locale: Locale }>;
}

export const generateMetadata = async ({
  params,
}: IngredientOffersPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return { title: t("inventory.offers.label") };
};

const IngredientOffersPage = async ({ params }: IngredientOffersPageProps) => {
  const [cookieStore, { ingredientId, locale }] = await Promise.all([
    cookies(),
    params,
  ]);

  setRequestLocale(locale);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const [ingredient, offers] = await Promise.all([
    getIngredient(ingredientId, fetchOptions),
    getIngredientOffers(ingredientId, fetchOptions),
  ]);

  if (!ingredient) notFound();

  const organization = await getResolvedAdminOrganization(
    undefined,
    cookieStore.toString(),
  );

  const [{ data: memberRole }, { suppliers }] = await Promise.all([
    authClient.organization.getActiveMemberRole({
      query: { organizationId: ingredient.organizationId },
      fetchOptions,
    }),
    organization
      ? getSuppliers(
          organization.slug,
          { pageSize: MAX_PAGE_SIZE, sortBy: "name", sortDirection: "asc" },
          fetchOptions,
        )
      : { suppliers: [] },
  ]);

  return (
    <IngredientOffers
      canWrite={hasRolePermission(memberRole?.role, { inventory: ["update"] })}
      ingredient={ingredient}
      offers={offers}
      suppliers={suppliers}
    />
  );
};

export default IngredientOffersPage;
