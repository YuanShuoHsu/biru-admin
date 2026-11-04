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

import { getGridSearchParams, resolveGridSearchParams } from "@/utils/dataGrid";
import { fetcher, settle } from "@/utils/fetcher";
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

export const createBotRecordsPage = (tab: BotRecordTab) => {
  const BotRecordsContent = async ({
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

    const [{ data: bot, error }, { data: records, error: recordsError }] =
      await Promise.all([
        settle(getQuantBot(botId, init)),
        settle(
          fetcher<BotRecordListResponse>(
            `/api/quant/bots/${botId}/${tab}?${getGridSearchParams({
              page,
              pageSize,
              sortBy,
              sortDirection,
            })}`,
            init,
          ),
        ),
      ]);

    if (
      [error?.status, recordsError?.status].some(
        (status) => status === 403 || status === 404,
      )
    )
      notFound();
    if (error || recordsError) return <ErrorAlert />;

    if (bot.executor === "pionex")
      redirect({ href: `/quant/bots/${botId}`, locale });

    return (
      <BotRecords
        bot={bot}
        page={page}
        pageSize={pageSize}
        rowCount={records.total}
        rows={records.data}
        sortBy={sortBy}
        sortDirection={sortDirection}
        tab={tab}
      />
    );
  };

  const BotRecordsPage = (props: BotRecordsPageProps) => (
    <Suspense fallback={<BotRecords loading tab={tab} />}>
      <BotRecordsContent {...props} />
    </Suspense>
  );

  return BotRecordsPage;
};
