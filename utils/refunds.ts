import type { OrderRefund } from "@/types/orders";

export const getRefundedQuantities = (
  refunds: OrderRefund[] | undefined,
): Map<string, number> => {
  const quantities = new Map<string, number>();

  for (const refund of refunds ?? [])
    for (const item of refund.items ?? [])
      quantities.set(
        item.orderItemId,
        (quantities.get(item.orderItemId) ?? 0) + item.quantity,
      );

  return quantities;
};
