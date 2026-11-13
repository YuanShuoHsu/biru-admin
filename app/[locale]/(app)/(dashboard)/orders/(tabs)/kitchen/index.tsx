"use client";

import { useFormatter, useNow, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";

import { MODE_COLORS } from "@/constants/orderMode";

import { useOrderItemChoiceNames } from "@/hooks/useOrderItemName";
import {
  useOrderActions,
  useOrderTicketPrinterStatuses,
} from "@/hooks/useOrderActions";
import { useOrderModeLabel } from "@/hooks/useOrderModeLabel";
import { useSocketConnection } from "@/hooks/useSocketConnection";

import { usePathname, useRouter } from "@/i18n/navigation";

import { menuSocket } from "@/app/socket";

import { StyledTextField } from "@/components/OrganizationSelect";

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
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import type { KitchenOrderItem, KitchenOrderResponse } from "@/types/orders";
import type { Organization } from "@/types/organizations";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";
import { getHref } from "@/utils/href";

const POLL_INTERVAL_MS = 15_000;
const WARNING_MINUTES = 5;
const ERROR_MINUTES = 10;

const CHIME_SECONDS = 0.4;

const playChime = (audioContext: AudioContext) => {
  const oscillator = new OscillatorNode(audioContext, { frequency: 880 });
  const gain = new GainNode(audioContext);
  const { currentTime } = audioContext;
  const endTime = currentTime + CHIME_SECONDS;

  gain.gain.setValueAtTime(0.3, currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, endTime);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(endTime);
};

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
  orders: KitchenOrderResponse[];
  organization: Organization;
  printerId?: string;
}

const OrdersKitchen = ({
  orders: initialOrders,
  organization: { slug: organizationSlug },
  printerId,
}: OrdersKitchenProps) => {
  const pathname = usePathname();
  const router = useRouter();

  const format = useFormatter();
  const now = useNow({ updateInterval: 30_000 });

  const tCommon = useTranslations("common");
  const tOrders = useTranslations("orders");

  const getOrderModeLabel = useOrderModeLabel();
  const getOrderItemChoiceNames = useOrderItemChoiceNames();

  const { isConnected } = useSocketConnection(menuSocket);

  const ordersUrl = `/api/organizations/${organizationSlug}/orders`;

  const kitchenUrl = getHref(`${ordersUrl}/kitchen`, { printerId });

  const { data: orders = initialOrders, mutate } = useSWR<
    KitchenOrderResponse[]
  >(kitchenUrl, {
    fallbackData: initialOrders,
    refreshInterval: isConnected ? 0 : POLL_INTERVAL_MS,
  });

  const printers = useOrderTicketPrinterStatuses(organizationSlug);

  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  useEffect(() => () => void audioContext?.close(), [audioContext]);

  const seenOrdersRef = useRef({
    kitchenUrl,
    orderIds: new Set(initialOrders.map(({ id }) => id)),
  });

  useEffect(() => {
    const seen = seenOrdersRef.current;

    if (
      audioContext &&
      seen.kitchenUrl === kitchenUrl &&
      orders.some(({ id }) => !seen.orderIds.has(id))
    )
      playChime(audioContext);

    seenOrdersRef.current = {
      kitchenUrl,
      orderIds: new Set(orders.map(({ id }) => id)),
    };
  }, [audioContext, kitchenUrl, orders]);

  // https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices#autoplay_policy
  const handleStart = async () => {
    const context = new AudioContext();
    await context.resume();
    setAudioContext(context);
  };

  const handleStationChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    router.push(
      getHref(pathname, {
        organization: organizationSlug,
        printerId: event.target.value,
      }),
    );

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

    return (
      <ListItemButton
        disabled={refunded || pendingItemIds.has(item.id)}
        key={item.id}
        onClick={() => handleTogglePrepared(order, item)}
      >
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
      </ListItemButton>
    );
  };

  return (
    <Stack spacing={2}>
      <HeaderStack direction="row">
        {printers && printers.length > 1 && (
          <StyledTextField
            label={tOrders("kitchen.station.label")}
            onChange={handleStationChange}
            select
            size="small"
            slotProps={{
              inputLabel: { shrink: true },
              select: { displayEmpty: true },
            }}
            value={printerId ?? ""}
          >
            <MenuItem value="">{tOrders("kitchen.station.all")}</MenuItem>
            {printers.map(({ id, name }) => (
              <MenuItem key={id} value={id}>
                {name}
              </MenuItem>
            ))}
          </StyledTextField>
        )}
        {!audioContext && (
          <Alert
            action={
              <Button color="inherit" onClick={handleStart} size="small">
                {tOrders("kitchen.sound.start")}
              </Button>
            }
            severity="info"
          >
            {tOrders("kitchen.sound.hint")}
          </Alert>
        )}
      </HeaderStack>
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
                      label={format.relativeTime(waitingSince, {
                        now,
                        unit: "minute",
                      })}
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
                {serveTransition && (
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
