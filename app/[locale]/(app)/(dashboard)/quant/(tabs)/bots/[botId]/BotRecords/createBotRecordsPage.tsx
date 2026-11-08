// https://nextjs.org/docs/app/guides/streaming#status-codes

import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import BotRecords, { type BotRecordListResponse, type BotRecordTab } from ".";

import ErrorAlert from "@/components/ErrorAlert";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  quantBotEventSortFieldValues,
  quantBotFillSortFieldValues,
  quantBotOrderSortFieldValues,
} from "@/types/api";
import type { SortDirection } from "@/types/dataGrid";
import type {
  QuantBot,
  QuantBotEventSortField,
  QuantBotFillSortField,
  QuantBotOrderSortField,
} from "@/types/quant";

import { getGridSearchParams, resolveGridSearchParams } from "@/utils/dataGrid";
import { type FetchResult, fetcher, settle } from "@/utils/fetcher";
import { getQuantBot } from "@/utils/quant";

const SORT_FIELDS = {
  events: quantBotEventSortFieldValues,
  fills: quantBotFillSortFieldValues,
  orders: quantBotOrderSortFieldValues,
};

interface BotRecordsPageProps {
  params: Promise<{ botId: string; locale: Locale }>;
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    sortBy?: string;
    sortDirection?: string;
  }>;
}

interface BotRecordsContentProps {
  bot: QuantBot;
  page: number;
  pageSize: number;
  records: Promise<FetchResult<BotRecordListResponse>>;
  sortBy?:
    | QuantBotEventSortField
    | QuantBotFillSortField
    | QuantBotOrderSortField;
  sortDirection?: SortDirection;
  tab: BotRecordTab;
}

const BotRecordsContent = async ({
  records: recordsResult,
  ...props
}: BotRecordsContentProps) => {
  const { data: records, error } = await recordsResult;

  if (error?.status === 403 || error?.status === 404) notFound();
  if (error) return <ErrorAlert />;

  return <BotRecords {...props} rowCount={records.total} rows={records.data} />;
};

export const createBotRecordsPage = (tab: BotRecordTab) => {
  const BotRecordsPage = async ({
    params,
    searchParams,
  }: BotRecordsPageProps) => {
    const [cookieStore, { botId, locale }, rawSearchParams] = await Promise.all(
      [cookies(), params, searchParams],
    );

    const { page, pageSize, redirectParams, sortBy, sortDirection } =
      resolveGridSearchParams({
        searchParams: rawSearchParams,
        sortFields: SORT_FIELDS[tab],
        filterFields: [],
        filterOperators: [],
      });

    if (redirectParams)
      redirect({
        href: `/quant/bots/${botId}/${tab}?${redirectParams.toString()}`,
        locale,
      });

    const init = { headers: { cookie: cookieStore.toString() } };

    const records = settle(
      fetcher<BotRecordListResponse>(
        `/api/quant/bots/${botId}/${tab}?${getGridSearchParams({
          page,
          pageSize,
          sortBy,
          sortDirection,
        })}`,
        init,
      ),
    );
    const { data: bot, error } = await settle(getQuantBot(botId, init));

    if (error?.status === 403 || error?.status === 404) notFound();
    if (error) return <ErrorAlert />;

    if (bot.executor === "pionex")
      redirect({ href: `/quant/bots/${botId}`, locale });

    return (
      <Suspense fallback={<BotRecords loading tab={tab} />}>
        <BotRecordsContent
          bot={bot}
          page={page}
          pageSize={pageSize}
          records={records}
          sortBy={sortBy}
          sortDirection={sortDirection}
          tab={tab}
        />
      </Suspense>
    );
  };

  return BotRecordsPage;
};
