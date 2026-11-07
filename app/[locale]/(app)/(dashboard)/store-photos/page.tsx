// https://nextjs.org/docs/app/guides/streaming#status-codes

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { type ComponentProps, Suspense } from "react";

import StorePhotos from ".";

import ErrorAlert from "@/components/ErrorAlert";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  storePhotoFilterFieldValues,
  storePhotoSortFieldValues,
  filterOperatorValues,
} from "@/types/api";

import { getStorePhotos } from "@/utils/storePhotos";
import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getStorePhotoEnumOptions } from "@/utils/enumOptions";
import { type FetchResult, settle } from "@/utils/fetcher";
import { getSession } from "@/utils/session";

interface StorePhotosPageProps {
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
}: StorePhotosPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tStorePhotos = await getTranslations({
    locale,
    namespace: "storePhotos",
  });

  return { title: tStorePhotos("label") };
};

interface StorePhotosContentProps
  extends Omit<
    ComponentProps<typeof StorePhotos>,
    "loading" | "rowCount" | "rows"
  > {
  storePhotos: Promise<FetchResult<Awaited<ReturnType<typeof getStorePhotos>>>>;
}

const StorePhotosContent = async ({
  storePhotos,
  ...props
}: StorePhotosContentProps) => {
  const { data, error } = await storePhotos;
  if (error?.status === 403) notFound();
  if (error) return <ErrorAlert />;

  const { storePhotos: rows, total: rowCount } = data;

  return <StorePhotos {...props} rowCount={rowCount} rows={rows} />;
};

const StorePhotosPage = async ({
  params,
  searchParams,
}: StorePhotosPageProps) => {
  const [session, cookieStore, { locale }, rawSearchParams] = await Promise.all(
    [getSession(), cookies(), params, searchParams],
  );

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
    sortFields: storePhotoSortFieldValues,
    filterFields: storePhotoFilterFieldValues,
    filterOperators: filterOperatorValues,
  });

  if (redirectParams)
    redirect({ href: `/store-photos?${redirectParams.toString()}`, locale });

  if (session?.user?.role !== "admin") notFound();

  const tStorePhotos = await getTranslations({
    locale,
    namespace: "storePhotos",
  });

  const quickFilterEnums = quickFilterValue
    ? getQuickFilterEnums(
        quickFilterValue,
        getStorePhotoEnumOptions(tStorePhotos),
      )
    : [];

  const storePhotos = settle(
    getStorePhotos(
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

  const storePhotosProps = {
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
    <Suspense fallback={<StorePhotos {...storePhotosProps} loading />}>
      <StorePhotosContent {...storePhotosProps} storePhotos={storePhotos} />
    </Suspense>
  );
};

export default StorePhotosPage;
