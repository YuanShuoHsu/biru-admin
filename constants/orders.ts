import type { ChipProps } from "@mui/material/Chip";

import type { OrderStatus } from "@/types/orders";

export const STATUS_COLORS: Record<OrderStatus, ChipProps["color"]> = {
  OrderCancelled: "default",
  OrderDelivered: "primary",
  OrderPaymentDue: "error",
  OrderPickupAvailable: "info",
  OrderProcessing: "warning",
  OrderProblem: "success",
};
