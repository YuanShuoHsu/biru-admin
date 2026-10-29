import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

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
import { settle } from "@/utils/fetcher";

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

const StorePhotosContent = async ({
  params,
  searchParams,
}: StorePhotosPageProps) => {
  const [cookieStore, { locale }, rawSearchParams] = await Promise.all([
    cookies(),
    params,
    searchParams,
  ]);

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

  const { data: storePhotos, error } = await settle(
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
      { headers: { cookie: cookieStore.toString() } },
    ),
  );
  if (error?.status === 403) notFound();
  if (error) return <ErrorAlert />;

  const { storePhotos: rows, total: rowCount } = storePhotos;

  return (
    <StorePhotos
      filterField={filterField}
      filterOperator={filterOperator}
      filterValue={filterValue}
      page={page}
      pageSize={pageSize}
      quickFilterValue={quickFilterValue}
      rowCount={rowCount}
      rows={rows}
      sortBy={sortBy}
      sortDirection={sortDirection}
    />
  );
};

const StorePhotosPage = (props: StorePhotosPageProps) => (
  <Suspense fallback={<StorePhotos loading />}>
    <StorePhotosContent {...props} />
  </Suspense>
);

export default StorePhotosPage;
