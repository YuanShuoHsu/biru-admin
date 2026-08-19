"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useEffect, useMemo } from "react";
import useSWR from "swr";

import { MODE_COLORS } from "@/constants/orderMode";
import { STATUS_COLORS, STATUS_TEXT_COLORS } from "@/constants/orders";

import useInvoiceAutoPrint from "@/hooks/useInvoiceAutoPrint";
import { useSocketConnection } from "@/hooks/useSocketConnection";

import { menuSocket } from "@/app/socket";

import { ReceiptLong } from "@mui/icons-material";
import {
  Box,
  Chip,
  DialogContentText,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

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

import { getErrorMessage } from "@/utils/errors";
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

  useInvoiceAutoPrint(isConnected, organizationSlug);

  useEffect(() => {
    if (!isConnected) return;

    menuSocket
      .timeout(5000)
      .emitWithAck("joinOrdersBoard", { organizationId })
      .catch((error) =>
        enqueueSnackbar(getErrorMessage(error), { variant: "error" }),
      );

    menuSocket.on("orderUpdated", mutate);

    return () => {
      menuSocket.off("orderUpdated", mutate);
    };
  }, [isConnected, mutate, organizationId]);

  const columns = useMemo(
    () =>
      orderFlowStatusValues.map((status) => ({
        color: STATUS_COLORS[status],
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
              primary: (
                <Stack
                  flexWrap="wrap"
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  columnGap={1}
                >
                  <Typography variant="body1">{order.orderNumber}</Typography>
                  <Chip
                    color={MODE_COLORS[order.mode]}
                    label={modeLabel}
                    size="small"
                    variant="outlined"
                  />
                </Stack>
              ),
              secondary: (
                <Typography
                  color="text.secondary"
                  sx={{ overflowWrap: "anywhere" }}
                  variant="caption"
                >
                  {order.customer.name}
                </Typography>
              ),
            };
          }),
        size: { xs: 12, md: 3 },
        title: tOrders(`status.${status}`),
      })),
    [boardColumns, tOrder, tOrders],
  );

  const orders = useMemo(
    () => boardColumns.flatMap(({ orders }) => orders),
    [boardColumns],
  );

  const getOrderNumbers = (ids: string[]) =>
    ids
      .map((id) => orders.find((order) => order.id === id)?.orderNumber)
      .join(tCommon("delimiter"));

  const handleTransfer = async (ids: string[], toStatus: OrderStatus) => {
    const orderNumbers = getOrderNumbers(ids);

    try {
      await fetcher(
        `/api/organizations/${organizationSlug}/orders/transitions/${toStatus}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderIds: ids }),
        },
      );

      enqueueSnackbar(
        tOrders("actions.updateStatus.success", {
          count: ids.length,
          orderNumbers,
          status: tOrders(`status.${toStatus}`),
        }),
        { variant: "success" },
      );
    } finally {
      mutate();
    }
  };

  const isTransferable = (id: string, toStatus: OrderStatus) =>
    orders
      .find((order) => order.id === id)
      ?.availableTransitions.some(
        (transition) => transition.toStatus === toStatus,
      ) || false;

  const confirmTransfer = (
    ids: string[],
    toStatus: OrderStatus,
    title: React.ReactNode,
  ) =>
    new Promise<boolean>((resolve) => {
      setDialog({
        content: (
          <DialogContentText>
            {tOrders.rich("actions.updateStatus.confirm.default", {
              bold: (chunks) => <strong>{chunks}</strong>,
              count: ids.length,
              orderNumbers: getOrderNumbers(ids),
              status: tOrders(`status.${toStatus}`),
              statusText: (chunks) => (
                <Box color={STATUS_TEXT_COLORS[toStatus]} component="strong">
                  {chunks}
                </Box>
              ),
            })}
          </DialogContentText>
        ),
        onCancel: async () => resolve(false),
        onConfirm: async () => {
          await handleTransfer(ids, toStatus);

          resolve(true);
        },
        open: true,
        title,
      });
    });

  const toTransferAction = (
    direction: "advance" | "revert",
    toStatus: OrderStatus,
  ): SelectAllTransferListAction => {
    const key = `actions.updateStatus.title.${direction}` as const;
    const status = tOrders(`status.${toStatus}`);

    return {
      disabled: (ids) => ids.some((id) => !isTransferable(id, toStatus)),
      onTransfer: (ids) =>
        confirmTransfer(
          ids,
          toStatus,
          tOrders.rich(key, {
            status,
            statusText: (chunks) => (
              <Box color={STATUS_TEXT_COLORS[toStatus]} component="span">
                {chunks}
              </Box>
            ),
          }),
        ),
      title: tOrders.markup(key, { status, statusText: (chunks) => chunks }),
    };
  };

  const transferActions = orderFlowStatusValues
    .slice(0, -1)
    .map(
      (
        fromStatus,
        index,
      ): [SelectAllTransferListAction, SelectAllTransferListAction] => [
        toTransferAction("advance", orderFlowStatusValues[index + 1]),
        toTransferAction("revert", fromStatus),
      ],
    );

  const renderAction = (order: AdminOrderResponse) => (
    <Tooltip title={tOrders("actions.viewOrder.title")}>
      <IconButton
        edge="end"
        onClick={(event) => {
          event.stopPropagation();

          setDialog({
            content: (
              <OrderDetailDialog
                order={order}
                organizationSlug={organizationSlug}
              />
            ),
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
