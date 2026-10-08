import { cache } from "react";

import { fetcher } from "./fetcher";

import { waitlistErrorCodeValues } from "@/types/api";
import type {
  WaitlistErrorCode,
  WaitlistTicketFilterField,
  WaitlistTicketListItem,
  WaitlistTicketSortField,
} from "@/types/waitlist";

import { type GridQuery, getGridSearchParams } from "@/utils/dataGrid";
import type { FetchError } from "@/utils/fetcher";

export const getWaitlistErrorCode = (
  error: unknown,
): WaitlistErrorCode | undefined => {
  const code = (error as FetchError)?.info?.message;

  return waitlistErrorCodeValues.find((value) => value === code);
};

export const getWaitlistTickets = cache(
  async (
    organizationSlug: string,
    query: GridQuery<WaitlistTicketFilterField, WaitlistTicketSortField> = {},
    init?: RequestInit,
  ) => {
    try {
      const result = await fetcher<{
        data: WaitlistTicketListItem[];
        total: number;
      }>(
        `/api/organizations/${organizationSlug}/waitlist/tickets/list?${getGridSearchParams(query).toString()}`,
        init,
      );

      return {
        tickets: Array.isArray(result.data) ? result.data : [],
        total: result.total || 0,
      };
    } catch {
      return { tickets: [], total: 0 };
    }
  },
);
