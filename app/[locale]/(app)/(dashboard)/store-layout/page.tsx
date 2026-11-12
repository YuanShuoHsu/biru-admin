// https://nextjs.org/docs/app/guides/streaming#status-codes

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import StoreLayout from ".";

import ErrorAlert from "@/components/ErrorAlert";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import type { AdminOrderBoardColumn } from "@/types/orders";
import type { Organization } from "@/types/organizations";
import type { StoreLayoutData } from "@/types/storeLayout";

import { type FetchResult, settle } from "@/utils/fetcher";
import { getAdminOrderBoard } from "@/utils/orders";
import { getResolvedAdminOrganization, getSession } from "@/utils/session";
import { getStoreLayout } from "@/utils/storeLayout";

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

interface StoreLayoutContentProps {
  columns: Promise<FetchResult<AdminOrderBoardColumn[]>>;
  layout: Promise<FetchResult<StoreLayoutData | null>>;
  organization: Organization;
}

const StoreLayoutContent = async ({
  columns: columnsResult,
  layout: layoutResult,
  organization,
}: StoreLayoutContentProps) => {
  const [{ data: layout, error: layoutError }, { data: columns, error }] =
    await Promise.all([layoutResult, columnsResult]);
  if (layoutError) return <ErrorAlert />;
  if (!layout) return <StoreLayout layout={null} organization={organization} />;
  if (error) return <ErrorAlert />;

  return (
    <StoreLayout
      columns={columns}
      layout={layout}
      organization={organization}
    />
  );
};

const StoreLayoutPage = async ({
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

  const init = { headers: { cookie: cookieStore.toString() } };

  const layout = settle(getStoreLayout(organization.slug, init));
  const columns = settle(getAdminOrderBoard(organization.slug, init));

  return (
    <Suspense fallback={<StoreLayout loading />} key={organization.id}>
      <StoreLayoutContent
        columns={columns}
        layout={layout}
        organization={organization}
      />
    </Suspense>
  );
};

export default StoreLayoutPage;
