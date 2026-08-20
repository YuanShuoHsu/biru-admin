import type { AdminOrderResponse, OrderRefund } from "@/types/orders";

// 與後端 src/ecpay/utils/refund-plan.ts 對應；金額仍以後端計算結果為準
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

  // 單價允許小數，逐項取整後再加總才與後端同基準
  const itemTotal = order.items.reduce(
    (sum, item) => sum + Math.round(Number(item.unitPrice) * item.orderQuantity),
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

  // 原發票把折扣開成一筆負數品項，部分退款要按原價比例把它分攤回去；
  // 退到最後一筆時改為補齊剩下的餘數，總和才會剛好等於實收金額
  const previouslyAllocated = (refunds ?? []).reduce(
    (sum, refund) => sum + allocate(discount, sumItemAmounts(refund), itemTotal),
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
