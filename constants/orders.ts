import type { OrderStatus } from "@/types/orders";

export const STATUS_COLORS: Record<
  OrderStatus,
  "default" | "error" | "info" | "success" | "warning"
> = {
  OrderCancelled: "default",
  OrderDelivered: "success",
  OrderPaymentDue: "warning",
  OrderPickupAvailable: "success",
  OrderProcessing: "info",
  OrderProblem: "error",
};
