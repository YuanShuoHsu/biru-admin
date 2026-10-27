import type { ChipProps } from "@mui/material/Chip";

import type {
  InvoiceStatus,
  OrderStatus,
  PrintJobStatus,
  RefundInvoiceAction,
  RefundStatus,
} from "@/types/orders";

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, ChipProps["color"]> =
  {
    issued: "success",
    issuing: "info",
    pending: "warning",
    voided: "default",
  };

export const PRINTER_STATUS_REFRESH_MS = 15_000;

export const PRINT_JOB_STATUS_COLORS: Record<
  PrintJobStatus,
  ChipProps["color"]
> = {
  cancelled: "default",
  printed: "success",
  queued: "info",
  sent: "info",
  unknown: "error",
};

export const REFUND_INVOICE_ACTION_COLORS: Record<
  RefundInvoiceAction | "pending",
  ChipProps["color"]
> = {
  allowance: "success",
  failed: "error",
  none: "default",
  pending: "warning",
  voided: "success",
};

export const REFUND_STATUS_COLORS: Record<RefundStatus, ChipProps["color"]> = {
  pending: "warning",
  refunded: "info",
  settling: "info",
  settled: "success",
};

export const STATUS_COLORS: Record<OrderStatus, ChipProps["color"]> = {
  OrderCancelled: "default",
  OrderDelivered: "primary",
  OrderPaymentDue: "error",
  OrderPickupAvailable: "success",
  OrderProcessing: "warning",
  OrderProblem: "error",
  OrderReturned: "info",
};

export const STATUS_TEXT_COLORS: Record<
  OrderStatus,
  "error" | "info" | "primary" | "success" | "text" | "warning"
> = {
  OrderCancelled: "text",
  OrderDelivered: "primary",
  OrderPaymentDue: "error",
  OrderPickupAvailable: "success",
  OrderProcessing: "warning",
  OrderProblem: "error",
  OrderReturned: "info",
};
