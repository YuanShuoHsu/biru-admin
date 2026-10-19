"use client";

import { useState } from "react";

import useSWR from "swr";

import { DEFAULT_PAGE_SIZE, getPageSizeOptions } from "@/constants/pagination";

import type { GridPaginationModel } from "@mui/x-data-grid";

import { fetcher } from "@/utils/fetcher";

export const HISTORY_RANGE_DAYS = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  all: null,
} as const;

export type HistoryRange = keyof typeof HISTORY_RANGE_DAYS;

const DAY_MS = 24 * 60 * 60 * 1000;

interface HistoryPage<Row> {
  data: Row[];
  nextEndTime: number | null;
}

interface Paging {
  cursors: (number | undefined)[];
  model: GridPaginationModel;
  scope: string | null;
}

export const useAccountHistory = <Row>(
  url: string | null,
  onSuccess: () => void,
) => {
  const [range, setRange] = useState<{
    key: HistoryRange;
    startTime?: number;
  }>({ key: "all" });
  const [paging, setPaging] = useState<Paging>({
    cursors: [undefined],
    model: { page: 0, pageSize: DEFAULT_PAGE_SIZE },
    scope: null,
  });

  const scope = url && `${url}|${range.startTime ?? ""}`;
  const { cursors, model } =
    paging.scope === scope
      ? paging
      : {
          cursors: [undefined],
          model: { page: 0, pageSize: paging.model.pageSize },
        };

  const endTime = cursors[model.page];
  const params = new URLSearchParams({
    limit: String(model.pageSize),
    ...(range.startTime !== undefined && {
      startTime: String(range.startTime),
    }),
    ...(endTime !== undefined && { endTime: String(endTime) }),
  });
  const { data, isLoading } = useSWR<HistoryPage<Row>>(
    url && `${url}${url.includes("?") ? "&" : "?"}${params.toString()}`,
    fetcher,
    { onSuccess },
  );

  const rows = data?.data ?? [];
  const hasNextPage = !data || data.nextEndTime !== null;

  const handlePaginationModelChange = (next: GridPaginationModel) => {
    if (next.pageSize !== model.pageSize) {
      setPaging({
        cursors: [undefined],
        model: { page: 0, pageSize: next.pageSize },
        scope,
      });
      return;
    }

    if (next.page > model.page && !data) return;

    const nextCursors = [...cursors];
    if (next.page === model.page + 1)
      nextCursors[next.page] = data?.nextEndTime ?? undefined;

    setPaging({ cursors: nextCursors, model: next, scope });
  };

  const handleRangeChange = (key: HistoryRange) => {
    const days = HISTORY_RANGE_DAYS[key];

    setRange({
      key,
      startTime: days === null ? undefined : Date.now() - days * DAY_MS,
    });
  };

  return {
    gridProps: {
      disableColumnFilter: true,
      disableColumnSorting: true,
      loading: isLoading,
      onPaginationModelChange: handlePaginationModelChange,
      pageSizeOptions: getPageSizeOptions(model.pageSize),
      paginationMeta: { hasNextPage },
      paginationMode: "server" as const,
      paginationModel: model,
      rowCount: hasNextPage
        ? -1
        : model.page * model.pageSize + Math.min(rows.length, model.pageSize),
      rows,
      showToolbar: false,
    },
    onRangeChange: handleRangeChange,
    range: range.key,
  };
};
