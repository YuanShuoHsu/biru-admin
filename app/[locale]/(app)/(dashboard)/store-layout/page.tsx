import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import StoreLayout from ".";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { STORE_LAYOUT_ORGANIZATION_SLUG } from "@/constants/storeLayout";

import { getResolvedAdminOrganization } from "@/utils/menus";

interface StoreLayoutPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ organization?: string }>;
}

export const generateMetadata = async ({
  params,
}: StoreLayoutPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tStoreLayout = await getTranslations({
    locale,
    namespace: "storeLayout",
  });

  return { title: tStoreLayout("label") };
};

const StoreLayoutPage = async ({
  params,
  searchParams,
}: StoreLayoutPageProps) => {
  const [cookieStore, { locale }, { organization: organizationSlug }] =
    await Promise.all([cookies(), params, searchParams]);

  setRequestLocale(locale);

  const organization = await getResolvedAdminOrganization(
    organizationSlug,
    cookieStore.toString(),
  );

  if (!organization) notFound();

  if (organizationSlug !== organization.slug) {
    const params = new URLSearchParams({ organization: organization.slug });

    redirect({ href: `/store-layout?${params.toString()}`, locale });
  }

  return (
    <StoreLayout empty={organization.slug !== STORE_LAYOUT_ORGANIZATION_SLUG} />
  );
};

export default StoreLayoutPage;
