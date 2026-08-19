import type { AdminOrderResponse, OrderRefund } from "@/types/orders";

// 與後端 src/ecpay/utils/refund-plan.ts 對應；金額仍以後端計算結果為準
export interface RefundPreview {
  allocatedDiscount: number;
  amount: number;
  isFull: boolean;
}

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
  refundedQuantities: Map<string, number>,
  selected: Map<string, number>,
): RefundPreview => {
  const itemTotal = Math.round(
    order.items.reduce(
      (sum, item) => sum + Number(item.unitPrice) * item.orderQuantity,
      0,
    ),
  );
  const salesAmount = Math.round(Number(order.total));
  const discount = itemTotal - salesAmount;

  const refundItemTotal = order.items.reduce(
    (sum, item) => sum + Number(item.unitPrice) * (selected.get(item.id) ?? 0),
    0,
  );

  const isFull = order.items.every(
    (item) =>
      (refundedQuantities.get(item.id) ?? 0) + (selected.get(item.id) ?? 0) >=
      item.orderQuantity,
  );

  // 原發票把折扣開成一筆負數品項，部分退款要按原價比例把它分攤回去
  const allocatedDiscount = itemTotal
    ? Math.round((discount * refundItemTotal) / itemTotal)
    : 0;

  return {
    allocatedDiscount,
    amount: Math.round(refundItemTotal) - allocatedDiscount,
    isFull,
  };
};
