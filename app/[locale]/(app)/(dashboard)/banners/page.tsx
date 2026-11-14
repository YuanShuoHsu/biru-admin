// https://nextjs.org/docs/app/guides/streaming#status-codes

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import Banners from ".";

import ErrorAlert from "@/components/ErrorAlert";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  bannerFilterFieldValues,
  bannerSortFieldValues,
  filterOperatorValues,
} from "@/types/api";
import type {
  Banner,
  BannerFilterField,
  BannerSortField,
} from "@/types/banners";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";

import { getBanners } from "@/utils/banners";
import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getBannerEnumOptions } from "@/utils/enumOptions";
import { type FetchResult, settle } from "@/utils/fetcher";
import { getSession } from "@/utils/session";

interface BannersPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    filterField?: string;
    filterOperator?: string;
    filterValue?: string;
    page?: string;
    pageSize?: string;
    quickFilterEnums?: string | string[];
    quickFilterValue?: string;
    sortBy?: string;
    sortDirection?: string;
  }>;
}

export const generateMetadata = async ({
  params,
}: BannersPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tBanners = await getTranslations({ locale, namespace: "banners" });

  return { title: tBanners("label") };
};

interface BannersContentProps {
  banners: Promise<FetchResult<{ banners: Banner[]; total: number }>>;
  filterField?: BannerFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  sortBy?: BannerSortField;
  sortDirection?: SortDirection;
}

const BannersContent = async ({ banners, ...props }: BannersContentProps) => {
  const { data, error } = await banners;
  if (error?.status === 403) notFound();
  if (error) return <ErrorAlert />;

  const { banners: rows, total: rowCount } = data;

  return <Banners {...props} rowCount={rowCount} rows={rows} />;
};

const BannersPage = async ({ params, searchParams }: BannersPageProps) => {
  const [session, cookieStore, { locale }, rawSearchParams] = await Promise.all(
    [getSession(), cookies(), params, searchParams],
  );

  if (session?.user?.role !== "admin") notFound();

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
    sortFields: bannerSortFieldValues,
    filterFields: bannerFilterFieldValues,
    filterOperators: filterOperatorValues,
  });

  if (redirectParams)
    redirect({ href: `/banners?${redirectParams.toString()}`, locale });

  const tBanners = await getTranslations({ locale, namespace: "banners" });

  const quickFilterEnums = quickFilterValue
    ? getQuickFilterEnums(quickFilterValue, getBannerEnumOptions(tBanners))
    : [];

  const banners = settle(
    getBanners(
      {
        page,
        pageSize,
        filterField,
        filterOperator,
        filterValue,
        quickFilterEnums,
        quickFilterValue,
        sortBy,
        sortDirection,
      },
      {
        headers: { "Accept-Language": locale, cookie: cookieStore.toString() },
      },
    ),
  );

  const bannersProps = {
    filterField,
    filterOperator,
    filterValue,
    page,
    pageSize,
    quickFilterValue,
    sortBy,
    sortDirection,
  };

  return (
    <Suspense fallback={<Banners {...bannersProps} loading />}>
      <BannersContent {...bannersProps} banners={banners} />
    </Suspense>
  );
};

export default BannersPage;
