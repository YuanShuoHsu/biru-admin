import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";

import Banners from ".";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  bannerFilterFieldValues,
  bannerSortFieldValues,
  filterOperatorValues,
} from "@/types/api";

import { getBanners } from "@/utils/banners";
import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getBannerEnumOptions } from "@/utils/enumOptions";

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
  const t = await getTranslations({ locale });

  return { title: t("banners.label") };
};

const BannersPage = async ({ params, searchParams }: BannersPageProps) => {
  const [cookieStore, { locale }, rawSearchParams] = await Promise.all([
    cookies(),
    params,
    searchParams,
  ]);

  setRequestLocale(locale);

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

  const { banners, total } = await getBanners(
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
  );

  return (
    <Banners
      banners={banners}
      filterField={filterField}
      filterOperator={filterOperator}
      filterValue={filterValue}
      page={page}
      pageSize={pageSize}
      quickFilterValue={quickFilterValue}
      rowCount={total}
      sortBy={sortBy}
      sortDirection={sortDirection}
    />
  );
};

export default BannersPage;
