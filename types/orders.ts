import {
  type components,
  orderFilterFieldValues,
  orderSortFieldValues,
} from "@/types/api";

export type CreateOrderDto = components["schemas"]["CreateOrderDto"];
export type OrderResponse = components["schemas"]["OrderResponseDto"];
export type UserOrderListResponse =
  components["schemas"]["UserOrderListResponseDto"];
export type UserOrderResponse = components["schemas"]["UserOrderResponseDto"];
export type OrderItemResponse = components["schemas"]["OrderItemResponseDto"];
export type MenuItemSalesResponse =
  components["schemas"]["MenuItemSalesResponseDto"];
export type AdminOrderBoardColumn =
  components["schemas"]["AdminOrderBoardColumnDto"];
export type AdminOrderResponse = components["schemas"]["AdminOrderResponseDto"];
export type OrderInvoice = components["schemas"]["OrderInvoiceDto"];

export type OrderInvoicePrint = components["schemas"]["OrderInvoicePrintDto"];
export type OrderInvoiceVerification =
  components["schemas"]["OrderInvoiceVerificationDto"];
export type OrderPaymentNotification =
  components["schemas"]["OrderPaymentNotificationDto"];
export type OrderRefund = components["schemas"]["OrderRefundDto"];
export type CreateOrderRefundDto =
  components["schemas"]["CreateOrderRefundDto"];
export type OrderTransition = components["schemas"]["OrderTransitionDto"];

export type OrderMode = OrderResponse["mode"];
export type OrderPaymentMethod = OrderResponse["paymentMethod"];
export type OrderStatus = OrderResponse["orderStatus"];
export type OrderFlowStatus = components["schemas"]["OrderFlowStatus"];
export type InvoiceStatus = components["schemas"]["InvoiceStatus"];

export type OrderFilterField = (typeof orderFilterFieldValues)[number];
export type OrderSortField = (typeof orderSortFieldValues)[number];
