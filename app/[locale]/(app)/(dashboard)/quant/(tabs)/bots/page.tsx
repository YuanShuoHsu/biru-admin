// https://nextjs.org/docs/app/guides/streaming#status-codes

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
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type {
  QuantBot,
  QuantBotFilterField,
  QuantBotSortField,
} from "@/types/quant";

import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getQuantBotEnumOptions } from "@/utils/enumOptions";
import { type FetchResult, settle } from "@/utils/fetcher";
import { getQuantBots } from "@/utils/quant";
import { getSession } from "@/utils/session";

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

interface QuantBotsContentProps {
  bots: Promise<FetchResult<{ bots: QuantBot[]; total: number }>>;
  filterField?: QuantBotFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  sortBy?: QuantBotSortField;
  sortDirection?: SortDirection;
}

const QuantBotsContent = async ({
  bots: botsResult,
  ...props
}: QuantBotsContentProps) => {
  const { data: bots, error } = await botsResult;
  if (error?.status === 403) notFound();
  if (error) return <ErrorAlert />;

  const { bots: rows, total: rowCount } = bots;

  return <BotList {...props} rowCount={rowCount} rows={rows} />;
};

const QuantBotsPage = async ({ params, searchParams }: QuantBotsPageProps) => {
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

  const bots = settle(
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

  return (
    <Suspense fallback={<BotList loading />}>
      <QuantBotsContent
        bots={bots}
        filterField={filterField}
        filterOperator={filterOperator}
        filterValue={filterValue}
        page={page}
        pageSize={pageSize}
        quickFilterValue={quickFilterValue}
        sortBy={sortBy}
        sortDirection={sortDirection}
      />
    </Suspense>
  );
};

export default QuantBotsPage;
