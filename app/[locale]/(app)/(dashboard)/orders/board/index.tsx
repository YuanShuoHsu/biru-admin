"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useEffect, useMemo } from "react";
import useSWR from "swr";

import { useSocketConnection } from "@/hooks/useSocketConnection";

import { menuSocket } from "@/app/socket";

import { ReceiptLong } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";

import SelectAllTransferList from "@/components/SelectAllTransferList";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { OrderResponse, OrderStatus } from "@/types/orders";
import type { Organization } from "@/types/organizations";

import { fetcher } from "@/utils/fetcher";

import OrderDetailDialog from "../OrderDetailDialog";

const COLUMN_STATUSES = [
  "OrderProcessing",
  "OrderPickupAvailable",
  "OrderDelivered",
] as const satisfies OrderStatus[];

type BoardStatus = (typeof COLUMN_STATUSES)[number];

interface BoardListItem {
  primary: string;
  secondary: string;
}

interface OrdersBoardProps {
  organization: Organization;
  orders: OrderResponse[];
}

const fetchOrdersByStatus = (
  organizationSlug: string,
  filterValue: string,
  limit: string,
) =>
  fetcher<{ data: OrderResponse[]; total: number }>(
    `/api/organizations/${organizationSlug}/orders?${new URLSearchParams({
      filterField: "orderStatus",
      filterOperator: "isAnyOf",
      filterValue,
      limit,
      sortBy: "createdAt",
      sortDirection: "desc",
    })}`,
  ).then((result) => result.data);

const OrdersBoard = ({
  organization: { id: organizationId, slug: organizationSlug },
  orders: initialOrders,
}: OrdersBoardProps) => {
  const { setDialog } = useDialogStore((state) => state);

  const tOrders = useTranslations("orders");

  const { data: orders = initialOrders, mutate } = useSWR(
    [`/api/organizations/${organizationSlug}/orders`, "board"],
    async () => {
      const [activeOrders, deliveredOrders] = await Promise.all([
        fetchOrdersByStatus(
          organizationSlug,
          "OrderProcessing,OrderPickupAvailable",
          "1000",
        ),
        fetchOrdersByStatus(organizationSlug, "OrderDelivered", "100"),
      ]);

      return [...activeOrders, ...deliveredOrders];
    },
    { fallbackData: initialOrders },
  );

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
      Object.fromEntries(
        COLUMN_STATUSES.map((status) => [
          status,
          orders
            .filter((order) => order.orderStatus === status)
            .sort(
              (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime(),
            )
            .map((order) => ({
              ...order,
              primary: order.orderNumber,
              secondary: order.customer.name,
            })),
        ]),
      ) as Record<BoardStatus, Array<OrderResponse & BoardListItem>>,
    [orders],
  );

  const handleTransfer = async (ids: string[], endpoint: string) => {
    const orderNumbers = ids
      .map((id) => orders.find((order) => order.id === id)?.orderNumber)
      .join("、");

    await Promise.all(
      ids.map((id) =>
        fetcher(
          `/api/organizations/${organizationSlug}/orders/${id}/${endpoint}`,
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

  const renderAction = (order: OrderResponse) => (
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
      columns={[
        {
          emptyLabel: tOrders("board.empty"),
          items: columns.OrderProcessing,
          size: { xs: 12, md: 4 },
          title: tOrders("status.OrderProcessing"),
        },
        {
          emptyLabel: tOrders("board.empty"),
          items: columns.OrderPickupAvailable,
          size: { xs: 12, md: 4 },
          title: tOrders("status.OrderPickupAvailable"),
        },
        {
          emptyLabel: tOrders("board.empty"),
          items: columns.OrderDelivered,
          size: { xs: 12, md: 4 },
          title: tOrders("status.OrderDelivered"),
        },
      ]}
      renderAction={renderAction}
      transferActions={[
        [
          {
            ariaLabel: tOrders("actions.confirmPickupAvailable.title"),
            onClick: (ids) => handleTransfer(ids, "ready"),
          },
          {
            ariaLabel: tOrders("actions.revertToProcessing.title"),
            onClick: (ids) => handleTransfer(ids, "processing"),
          },
        ],
        [
          {
            ariaLabel: tOrders("actions.confirmDelivered.title"),
            onClick: (ids) => handleTransfer(ids, "picked-up"),
          },
          {
            ariaLabel: tOrders("actions.revertToPickupAvailable.title"),
            onClick: (ids) => handleTransfer(ids, "processing"),
          },
        ],
      ]}
    />
  );
};

export default OrdersBoard;
