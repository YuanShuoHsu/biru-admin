"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useEffect, useMemo } from "react";
import useSWR from "swr";

import { useSocketConnection } from "@/hooks/useSocketConnection";

import { menuSocket } from "@/app/socket";

import { ReceiptLong } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";

import SelectAllTransferList, {
  type SelectAllTransferListAction,
} from "@/components/SelectAllTransferList";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { orderFlowStatusValues } from "@/types/api";
import type {
  AdminOrderBoardColumn,
  AdminOrderResponse,
  OrderStatus,
} from "@/types/orders";
import type { Organization } from "@/types/organizations";

import { fetcher } from "@/utils/fetcher";

import OrderDetailDialog from "../OrderDetailDialog";

interface OrdersBoardProps {
  columns: AdminOrderBoardColumn[];
  organization: Organization;
}

const OrdersBoard = ({
  columns: initialColumns,
  organization: { id: organizationId, slug: organizationSlug },
}: OrdersBoardProps) => {
  const { setDialog } = useDialogStore((state) => state);

  const tCommon = useTranslations("common");
  const tOrder = useTranslations("order");
  const tOrders = useTranslations("orders");

  const { data: boardColumns = initialColumns, mutate } = useSWR<
    AdminOrderBoardColumn[]
  >(`/api/organizations/${organizationSlug}/orders/board/admin`, {
    fallbackData: initialColumns,
  });

  const { isConnected } = useSocketConnection(menuSocket);

  useEffect(() => {
    if (!isConnected) return;

    menuSocket
      .timeout(5000)
      .emitWithAck("joinOrdersBoard", { organizationId })
      .catch(() => {});

    menuSocket.on("orderUpdated", mutate);

    return () => {
      menuSocket.off("orderUpdated", mutate);
    };
  }, [isConnected, mutate, organizationId]);

  const columns = useMemo(
    () =>
      orderFlowStatusValues.map((status) => ({
        emptyLabel: tOrders("board.empty"),
        items: [
          ...(boardColumns.find(({ orderStatus }) => orderStatus === status)
            ?.orders || []),
        ]
          .sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          )
          .map((order) => {
            const modeLabel = order.tableNumber
              ? tOrder("mode.dineIn.storeSlug.tableNumber.value", {
                  tableNumber: order.tableNumber,
                })
              : tOrder(`mode.${order.mode}.label`);

            return {
              ...order,
              primary: order.orderNumber,
              secondary: [modeLabel, order.customer.name].join(
                tCommon("delimiter"),
              ),
            };
          }),
        size: { xs: 12, md: 3 },
        title: tOrders(`status.${status}`),
      })),
    [boardColumns, tCommon, tOrder, tOrders],
  );

  const orders = useMemo(
    () => boardColumns.flatMap(({ orders }) => orders),
    [boardColumns],
  );

  const handleTransfer = async (ids: string[], toStatus: OrderStatus) => {
    const orderNumbers = ids
      .map((id) => orders.find((order) => order.id === id)?.orderNumber)
      .join("、");

    await Promise.all(
      ids.map((id) =>
        fetcher(
          `/api/organizations/${organizationSlug}/orders/${id}/transitions/${toStatus}`,
          { method: "PATCH" },
        ),
      ),
    );

    enqueueSnackbar(
      tOrders("board.success", { count: ids.length, orderNumbers }),
      { variant: "success" },
    );

    mutate();
  };

  const isTransferable = (id: string, toStatus: OrderStatus) =>
    orders
      .find((order) => order.id === id)
      ?.availableTransitions.some(
        (transition) => transition.toStatus === toStatus,
      ) || false;

  const toTransferAction = (
    ariaLabel: string,
    toStatus: OrderStatus,
  ): SelectAllTransferListAction => ({
    ariaLabel,
    disabled: (ids) => ids.some((id) => !isTransferable(id, toStatus)),
    onClick: (ids) => handleTransfer(ids, toStatus),
  });

  const transferActions = orderFlowStatusValues
    .slice(0, -1)
    .map(
      (
        fromStatus,
        index,
      ): [SelectAllTransferListAction, SelectAllTransferListAction] => {
        const nextStatus = orderFlowStatusValues[index + 1];

        return [
          toTransferAction(
            tOrders("actions.advance", {
              status: tOrders(`status.${nextStatus}`),
            }),
            nextStatus,
          ),
          toTransferAction(
            tOrders("actions.revert", {
              status: tOrders(`status.${fromStatus}`),
            }),
            fromStatus,
          ),
        ];
      },
    );

  const renderAction = (order: AdminOrderResponse) => (
    <Tooltip title={tOrders("actions.viewOrder.title")}>
      <IconButton
        edge="end"
        onClick={(event) => {
          event.stopPropagation();

          setDialog({
            content: <OrderDetailDialog order={order} />,
            open: true,
            title: tOrders("actions.viewOrder.title"),
          });
        }}
        size="small"
      >
        <ReceiptLong fontSize="small" />
      </IconButton>
    </Tooltip>
  );

  return (
    <SelectAllTransferList
      columns={columns}
      renderAction={renderAction}
      transferActions={transferActions}
    />
  );
};

export default OrdersBoard;
