import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import StoreLayout from ".";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { STORE_LAYOUT_ORGANIZATION_SLUG } from "@/constants/storeLayout";

import { getAdminOrderBoard } from "@/utils/orders";
import { getResolvedAdminOrganization, getSession } from "@/utils/session";

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

const StoreLayoutContent = async ({
  params,
  searchParams,
}: StoreLayoutPageProps) => {
  const [session, cookieStore, { locale }, { organization: organizationSlug }] =
    await Promise.all([getSession(), cookies(), params, searchParams]);

  if (session?.user?.role !== "admin") notFound();

  const organization = await getResolvedAdminOrganization(organizationSlug);

  if (!organization) notFound();

  if (organizationSlug !== organization.slug) {
    const params = new URLSearchParams({ organization: organization.slug });

    redirect({ href: `/store-layout?${params.toString()}`, locale });
  }

  const empty = organization.slug !== STORE_LAYOUT_ORGANIZATION_SLUG;

  const columns = empty
    ? []
    : await getAdminOrderBoard(organization.slug, {
        headers: { cookie: cookieStore.toString() },
      });

  return (
    <StoreLayout columns={columns} empty={empty} organization={organization} />
  );
};

const StoreLayoutPage = (props: StoreLayoutPageProps) => (
  <Suspense fallback={<StoreLayout loading />}>
    <StoreLayoutContent {...props} />
  </Suspense>
);

export default StoreLayoutPage;
