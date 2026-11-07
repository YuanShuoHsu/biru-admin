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

import { STORE_LAYOUT_ORGANIZATION_SLUG } from "@/constants/storeLayout";

import type { AdminOrderBoardColumn } from "@/types/orders";
import type { Organization } from "@/types/organizations";

import { type FetchResult, settle } from "@/utils/fetcher";
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

interface StoreLayoutContentProps {
  columns: Promise<FetchResult<AdminOrderBoardColumn[]>>;
  empty: boolean;
  organization: Organization;
}

const StoreLayoutContent = async ({
  columns: columnsResult,
  ...props
}: StoreLayoutContentProps) => {
  const { data: columns, error } = await columnsResult;
  if (error) return <ErrorAlert />;

  return <StoreLayout {...props} columns={columns} />;
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

  const empty = organization.slug !== STORE_LAYOUT_ORGANIZATION_SLUG;

  const columns = settle(
    empty
      ? Promise.resolve([])
      : getAdminOrderBoard(organization.slug, {
          headers: { cookie: cookieStore.toString() },
        }),
  );

  return (
    <Suspense fallback={<StoreLayout loading />}>
      <StoreLayoutContent
        columns={columns}
        empty={empty}
        organization={organization}
      />
    </Suspense>
  );
};

export default StoreLayoutPage;
