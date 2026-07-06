import {
  type components,
  orderFilterFieldValues,
  orderSortFieldValues,
} from "@/types/api";

export type CreateOrderDto = components["schemas"]["CreateOrderDto"];
export type OrderResponse = components["schemas"]["OrderResponseDto"];
export type OrderItemResponse = components["schemas"]["OrderItemResponseDto"];

export type OrderMode = OrderResponse["mode"];
export type OrderPaymentMethod = OrderResponse["paymentMethod"];
export type OrderStatus = OrderResponse["orderStatus"];

export type OrderFilterField = (typeof orderFilterFieldValues)[number];
export type OrderSortField = (typeof orderSortFieldValues)[number];
