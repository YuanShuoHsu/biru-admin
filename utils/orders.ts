import { cache } from "react";

import { fetcher } from "./fetcher";
import { getHref } from "./href";

import type {
  AdminOrderBoardColumn,
  AdminOrderListResponse,
  KitchenOrderResponse,
  OrderFilterField,
  OrderSortField,
  PrepTimeResponse,
} from "@/types/orders";

import { type GridQuery, getGridSearchParams } from "@/utils/dataGrid";

export const getAdminOrders = cache(
  async (
    organizationSlug: string,
    query: GridQuery<OrderFilterField, OrderSortField> = {},
    init?: RequestInit,
  ) => {
    const result = await fetcher<AdminOrderListResponse>(
      `/api/organizations/${organizationSlug}/orders?${getGridSearchParams(query).toString()}`,
      init,
    );

    return {
      orders: Array.isArray(result.data) ? result.data : [],
      total: result.total || 0,
    };
  },
);

export const getAdminOrderBoard = cache(
  async (
    organizationSlug: string,
    init?: RequestInit,
  ): Promise<AdminOrderBoardColumn[]> => {
    const columns = await fetcher<AdminOrderBoardColumn[]>(
      `/api/organizations/${organizationSlug}/orders/board/admin`,
      init,
    );

    return Array.isArray(columns) ? columns : [];
  },
);

export const getAdminKitchenOrders = cache(
  async (
    organizationSlug: string,
    printerId: string | undefined,
    init?: RequestInit,
  ): Promise<KitchenOrderResponse[]> => {
    const orders = await fetcher<KitchenOrderResponse[]>(
      getHref(`/api/organizations/${organizationSlug}/orders/kitchen`, {
        printerId,
      }),
      init,
    );

    return Array.isArray(orders) ? orders : [];
  },
);

export const getAdminPrepTimes = cache(
  async (
    organizationSlug: string,
    init?: RequestInit,
  ): Promise<PrepTimeResponse[]> => {
    try {
      const prepTimes = await fetcher<PrepTimeResponse[]>(
        `/api/organizations/${organizationSlug}/orders/prep-times`,
        init,
      );

      return Array.isArray(prepTimes) ? prepTimes : [];
    } catch {
      return [];
    }
  },
);
