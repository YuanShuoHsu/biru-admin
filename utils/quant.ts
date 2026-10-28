import { cache } from "react";

import { fetcher } from "./fetcher";

import type {
  QuantBot,
  QuantBotFilterField,
  QuantBotSortField,
} from "@/types/quant";

import { type GridQuery, getGridSearchParams } from "@/utils/dataGrid";

export const getQuantBots = cache(
  async (
    query: GridQuery<QuantBotFilterField, QuantBotSortField> = {},
    init?: RequestInit,
  ) => {
    const result = await fetcher<{ data: QuantBot[]; total: number }>(
      `/api/quant/bots?${getGridSearchParams(query).toString()}`,
      init,
    );

    return {
      bots: Array.isArray(result.data) ? result.data : [],
      total: result.total || 0,
    };
  },
);
