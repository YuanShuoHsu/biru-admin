import type { AdminOrderResponse, OrderRefund } from "@/types/orders";

export interface RefundPreview {
  allocatedDiscount: number;
  amount: number;
  isFull: boolean;
}

const allocate = (discount: number, part: number, total: number): number =>
  total ? Math.round((discount * part) / total) : 0;

const sumItemAmounts = (refund: OrderRefund): number =>
  (refund.items ?? []).reduce((sum, item) => sum + Number(item.amount), 0);

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

export const getRefundPreview = (
  order: AdminOrderResponse,
  refunds: OrderRefund[] | undefined,
  selected: Map<string, number>,
): RefundPreview => {
  const refundedQuantities = getRefundedQuantities(refunds);

  const itemTotal = order.items.reduce(
    (sum, item) =>
      sum + Math.round(Number(item.unitPrice) * item.orderQuantity),
    0,
  );
  const salesAmount = Math.round(Number(order.total));
  const discount = itemTotal - salesAmount;

  const refundItemTotal = order.items.reduce(
    (sum, item) =>
      sum + Math.round(Number(item.unitPrice) * (selected.get(item.id) ?? 0)),
    0,
  );

  const isFull = order.items.every(
    (item) =>
      (refundedQuantities.get(item.id) ?? 0) + (selected.get(item.id) ?? 0) >=
      item.orderQuantity,
  );

  const previouslyAllocated = (refunds ?? []).reduce(
    (sum, refund) =>
      sum + allocate(discount, sumItemAmounts(refund), itemTotal),
    0,
  );
  const allocatedDiscount = isFull
    ? discount - previouslyAllocated
    : allocate(discount, refundItemTotal, itemTotal);

  return {
    allocatedDiscount,
    amount: refundItemTotal - allocatedDiscount,
    isFull,
  };
};
