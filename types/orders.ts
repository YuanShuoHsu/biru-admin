import type { components } from "@/types/api";

export type CreateOrderDto = components["schemas"]["CreateOrderDto"];
export type OrderResponse = components["schemas"]["OrderResponseDto"];

export type OrderStatus = "pending" | "completed" | "canceled";

export interface Order {
  id: string;
  status: OrderStatus;
  totalPrice: number;
  storeId: string;
  tableId: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersResponse {
  data: Order[];
  total: number;
  page: number;
  limit: number;
}

export interface OrdersQuery {
  page: number;
  limit: number;
  status: OrderStatus | "";
  search: string;
  sortBy: string;
  sortDir: "asc" | "desc";
}
