"use client";

import { useFormatter, useNow, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useState } from "react";
import useSWR from "swr";

import { MODE_COLORS } from "@/constants/orderMode";

import { useOrderItemChoiceNames } from "@/hooks/useOrderItemName";
import { useOrderActions } from "@/hooks/useOrderActions";
import { useOrderModeLabel } from "@/hooks/useOrderModeLabel";
import { useSocketConnection } from "@/hooks/useSocketConnection";

import { menuSocket } from "@/app/socket";

import { CheckCircle, RadioButtonUnchecked } from "@mui/icons-material";
import {
  Alert,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import type { KitchenOrderItem, KitchenOrderResponse } from "@/types/orders";
import type { Organization } from "@/types/organizations";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

const POLL_INTERVAL_MS = 15_000;
const WARNING_MINUTES = 5;
const ERROR_MINUTES = 10;

type WaitColor = "error" | "warning";

const WaitCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== "waitColor",
})<{ waitColor?: WaitColor }>(({ theme, waitColor }) => ({
  borderColor: waitColor
    ? theme.vars.palette[waitColor].main
    : theme.vars.palette.divider,
  borderWidth: 3,
  height: "100%",
}));

const HeaderStack = styled(Stack)(({ theme }) => ({
  alignItems: "center",
  flexWrap: "wrap",
  gap: theme.spacing(1),
  justifyContent: "space-between",
}));

const ItemText = styled(ListItemText, {
  shouldForwardProp: (prop) => prop !== "done",
})<{ done: boolean }>(({ done }) => ({
  textDecoration: done ? "line-through" : "none",
}));

interface OrdersKitchenProps {
  canUpdateOrders: boolean;
  orders: KitchenOrderResponse[];
  organization: Organization;
}

const OrdersKitchen = ({
  canUpdateOrders,
  orders: initialOrders,
  organization: { slug: organizationSlug },
}: OrdersKitchenProps) => {
  const format = useFormatter();
  const now = useNow({ updateInterval: 30_000 });

  const tCommon = useTranslations("common");
  const tOrders = useTranslations("orders");

  const getOrderModeLabel = useOrderModeLabel();
  const getOrderItemChoiceNames = useOrderItemChoiceNames();

  const { isConnected } = useSocketConnection(menuSocket);

  const ordersUrl = `/api/organizations/${organizationSlug}/orders`;

  const { data: orders = initialOrders, mutate } = useSWR<
    KitchenOrderResponse[]
  >(`${ordersUrl}/kitchen`, {
    fallbackData: initialOrders,
    refreshInterval: isConnected ? 0 : POLL_INTERVAL_MS,
  });

  const { handleConfirmStatusAction } = useOrderActions(
    organizationSlug,
    mutate,
  );

  const [pendingItemIds, setPendingItemIds] = useState<ReadonlySet<string>>(
    new Set(),
  );

  const setItemPending = (itemId: string, pending: boolean) =>
    setPendingItemIds((current) => {
      const next = new Set(current);

      if (pending) next.add(itemId);
      else next.delete(itemId);

      return next;
    });

  const handleTogglePrepared = async (
    order: KitchenOrderResponse,
    item: KitchenOrderItem,
  ) => {
    setItemPending(item.id, true);

    try {
      await fetcher(`${ordersUrl}/${order.id}/items/${item.id}/prepared`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prepared: !item.preparedAt }),
      });
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
    } finally {
      await mutate();
      setItemPending(item.id, false);
    }
  };

  const getWaitColor = (waitingSince: Date): WaitColor | undefined => {
    const waitedMinutes = (now.getTime() - waitingSince.getTime()) / 60_000;

    if (waitedMinutes >= ERROR_MINUTES) return "error";
    if (waitedMinutes >= WARNING_MINUTES) return "warning";
  };

  const renderItem = (order: KitchenOrderResponse, item: KitchenOrderItem) => {
    const refunded = item.refundedQuantity >= item.orderQuantity;
    const choiceNames = getOrderItemChoiceNames(item);

    const content = (
      <>
        <ListItemIcon>
          {item.preparedAt ? (
            <CheckCircle color="success" fontSize="large" />
          ) : (
            <RadioButtonUnchecked fontSize="large" />
          )}
        </ListItemIcon>
        <ItemText
          done={!!item.preparedAt || refunded}
          primary={`${item.menuItemName} ${tCommon("multiply")} ${item.orderQuantity - item.refundedQuantity}`}
          secondary={
            refunded ? tOrders("kitchen.refunded") : choiceNames || undefined
          }
          slotProps={{ primary: { variant: "h6" } }}
        />
      </>
    );

    return canUpdateOrders ? (
      <ListItemButton
        disabled={refunded || pendingItemIds.has(item.id)}
        key={item.id}
        onClick={() => handleTogglePrepared(order, item)}
      >
        {content}
      </ListItemButton>
    ) : (
      <ListItem key={item.id}>{content}</ListItem>
    );
  };

  return (
    <Stack spacing={2}>
      {!isConnected && (
        <Alert severity="warning">
          {tOrders("kitchen.disconnected", {
            seconds: POLL_INTERVAL_MS / 1000,
          })}
        </Alert>
      )}
      {!orders.length && (
        <Typography color="textSecondary">
          {tOrders("kitchen.empty")}
        </Typography>
      )}
      <Grid container spacing={2}>
        {orders.map((order) => {
          const waitingSince = new Date(
            order.pickupTime ?? order.paymentDate ?? order.orderDate,
          );
          const waitColor = getWaitColor(waitingSince);
          const serveTransition = order.availableTransitions.find(
            ({ direction }) => direction === "advance",
          );

          return (
            <Grid key={order.id} size={{ xs: 12, sm: 6, lg: 4, xl: 3 }}>
              <WaitCard variant="outlined" waitColor={waitColor}>
                <CardContent>
                  <HeaderStack direction="row">
                    <Typography variant="h4">{order.orderNumber}</Typography>
                    <Chip
                      color={MODE_COLORS[order.mode]}
                      label={getOrderModeLabel(order.mode, order.tableNumber)}
                      variant="outlined"
                    />
                    <Chip
                      color={waitColor ?? "default"}
                      label={format.relativeTime(waitingSince, now)}
                    />
                  </HeaderStack>
                  {order.customer.remark && (
                    <Alert icon={false} severity="info">
                      {order.customer.remark}
                    </Alert>
                  )}
                  <List>
                    {order.items.map((item) => renderItem(order, item))}
                  </List>
                </CardContent>
                {canUpdateOrders && serveTransition && (
                  <CardActions>
                    <Button
                      fullWidth
                      onClick={() =>
                        handleConfirmStatusAction(order, serveTransition)
                      }
                      size="large"
                      variant="contained"
                    >
                      {tOrders("kitchen.serve")}
                    </Button>
                  </CardActions>
                )}
              </WaitCard>
            </Grid>
          );
        })}
      </Grid>
    </Stack>
  );
};

export default OrdersKitchen;
