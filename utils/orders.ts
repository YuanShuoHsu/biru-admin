import { cache } from "react";

import type {
  Order,
  OrderStatus,
  OrdersQuery,
  OrdersResponse,
} from "@/types/orders";

// TODO: Replace with real API call when ready
// import { fetcher } from "./fetcher";
// export const getOrders = cache(async (query: OrdersQuery): Promise<OrdersResponse> => {
//   const params = new URLSearchParams({
//     page: String(query.page),
//     limit: String(query.limit),
//     sortBy: query.sortBy,
//     sortDir: query.sortDir,
//     ...(query.status && { status: query.status }),
//     ...(query.search && { search: query.search }),
//   });
//   return fetcher<OrdersResponse>(`/admin/orders?${params}`);
// });

const STATUSES: OrderStatus[] = ["pending", "completed", "canceled"];
const STORE_IDS = ["store-001", "store-002", "store-003"];
const TABLE_IDS = ["T01", "T02", "T03", "T04", "T05", null];

const MOCK_ORDERS: Order[] = Array.from({ length: 50 }, (_, i) => ({
  id: `order-${String(i + 1).padStart(4, "0")}`,
  status: STATUSES[i % 3],
  totalPrice: (i + 1) * 120 + (i % 7) * 50,
  storeId: STORE_IDS[i % 3],
  tableId: TABLE_IDS[i % 6],
  userId: `user-${(i % 10) + 1}`,
  createdAt: new Date(
    Date.UTC(2026, 0, 1) - i * 24 * 60 * 60 * 1000,
  ).toISOString(),
  updatedAt: new Date(
    Date.UTC(2026, 0, 1) - i * 24 * 60 * 60 * 1000,
  ).toISOString(),
}));

export const getOrders = cache(
  async (query: OrdersQuery): Promise<OrdersResponse> => {
    let data = [...MOCK_ORDERS];

    if (query.status) {
      data = data.filter((o) => o.status === query.status);
    }

    if (query.search) {
      const q = query.search.toLowerCase();
      data = data.filter(
        (o) =>
          o.id.toLowerCase().includes(q) || o.storeId.toLowerCase().includes(q),
      );
    }

    data.sort((a, b) => {
      const field = query.sortBy as keyof Order;
      const aVal = a[field];
      const bVal = b[field];
      if (aVal === bVal) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = aVal < bVal ? -1 : 1;
      return query.sortDir === "asc" ? cmp : -cmp;
    });

    const total = data.length;
    const start = (query.page - 1) * query.limit;
    data = data.slice(start, start + query.limit);

    return { data, total, page: query.page, limit: query.limit };
  },
);
