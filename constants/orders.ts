import type { ChipProps } from "@mui/material/Chip";

import type { InvoiceStatus, OrderStatus } from "@/types/orders";

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, ChipProps["color"]> =
  {
    issued: "success",
    pending: "warning",
    voided: "default",
  };

export const STATUS_COLORS: Record<OrderStatus, ChipProps["color"]> = {
  OrderCancelled: "default",
  OrderDelivered: "primary",
  OrderPaymentDue: "error",
  OrderPickupAvailable: "info",
  OrderProcessing: "warning",
  OrderProblem: "success",
};

export const STATUS_TEXT_COLORS: Record<OrderStatus, string> = {
  OrderCancelled: "text.primary",
  OrderDelivered: "primary.main",
  OrderPaymentDue: "error.main",
  OrderPickupAvailable: "info.main",
  OrderProcessing: "warning.main",
  OrderProblem: "success.main",
};
