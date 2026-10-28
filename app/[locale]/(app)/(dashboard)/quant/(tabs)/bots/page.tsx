import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import BotList from "./BotList";

import ErrorAlert from "@/components/ErrorAlert";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  filterOperatorValues,
  quantBotFilterFieldValues,
  quantBotSortFieldValues,
} from "@/types/api";

import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getQuantBotEnumOptions } from "@/utils/enumOptions";
import { settle } from "@/utils/fetcher";
import { getQuantBots } from "@/utils/quant";

interface QuantBotsPageProps {
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
}: QuantBotsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tBots = await getTranslations({ locale, namespace: "quant.bots" });

  return { title: tBots("label") };
};

const QuantBotsContent = async ({
  params,
  searchParams,
}: QuantBotsPageProps) => {
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
    sortFields: quantBotSortFieldValues,
    filterFields: quantBotFilterFieldValues,
    filterOperators: filterOperatorValues,
  });

  if (redirectParams)
    redirect({ href: `/quant/bots?${redirectParams.toString()}`, locale });

  const tBots = await getTranslations({ locale, namespace: "quant.bots" });

  const quickFilterEnums = quickFilterValue
    ? getQuickFilterEnums(quickFilterValue, getQuantBotEnumOptions(tBots))
    : [];

  const { data: bots, error } = await settle(
    getQuantBots(
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

  const { bots: rows, total: rowCount } = bots;

  return (
    <BotList
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

const QuantBotsPage = (props: QuantBotsPageProps) => (
  <Suspense fallback={<BotList loading />}>
    <QuantBotsContent {...props} />
  </Suspense>
);

export default QuantBotsPage;
