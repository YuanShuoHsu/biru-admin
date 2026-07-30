import { cache } from "react";

import { fetcher } from "./fetcher";

import { STORE_TIMEZONE } from "@/constants/timezone";

import type { OrderResponse, OrderStatus } from "@/types/orders";

const PAID_ORDER_STATUSES: OrderStatus[] = [
  "OrderDelivered",
  "OrderPickupAvailable",
  "OrderProcessing",
];

interface GetAdminOrdersQuery {
  page?: number;
  pageSize?: number;
  filterField?: string;
  filterOperator?: string;
  filterValue?: string;
  quickFilterValue?: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

export const getAdminOrders = cache(
  async (
    organizationSlug: string,
    {
      page = 1,
      pageSize = 10,
      filterField,
      filterOperator,
      filterValue,
      quickFilterValue,
      sortBy,
      sortDirection,
    }: GetAdminOrdersQuery = {},
    init?: RequestInit,
  ) => {
    try {
      const offset = (page - 1) * pageSize;
      const params = new URLSearchParams({
        limit: String(pageSize),
        offset: String(offset),
        ...(sortBy && { sortBy }),
        ...(sortDirection && { sortDirection }),
        ...(filterField &&
          filterOperator &&
          filterValue && { filterField, filterOperator, filterValue }),
        ...(quickFilterValue && { quickFilterValue, timezone: STORE_TIMEZONE }),
      });
      const result = await fetcher<{ data: OrderResponse[]; total: number }>(
        `/api/organizations/${organizationSlug}/orders?${params.toString()}`,
        init,
      );

      return {
        orders: Array.isArray(result.data) ? result.data : [],
        total: result.total || 0,
      };
    } catch {
      return { orders: [], total: 0 };
    }
  },
);

export const isCountedOrder = ({
  orderStatus,
  paymentMethod,
}: OrderResponse): boolean =>
  orderStatus !== "OrderCancelled" &&
  orderStatus !== "OrderProblem" &&
  (paymentMethod === "Cash" || PAID_ORDER_STATUSES.includes(orderStatus));

export const getOrderTotalAmount = (order: OrderResponse): number => {
  const subtotal = order.items.reduce(
    (sum, { orderQuantity, unitPrice }) =>
      sum + Number(unitPrice) * orderQuantity,
    0,
  );

  return subtotal - Number(order.discount || 0);
};
