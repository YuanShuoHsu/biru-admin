"use client";

import { useFormatter, useTranslations } from "next-intl";
import useSWR from "swr";

import CloseCashDrawerDialog from "./CloseCashDrawerDialog";
import CashDrawerMovementDialog from "./CashDrawerMovementDialog";
import OpenCashDrawerDialog from "./OpenCashDrawerDialog";

import DetailsCard from "@/components/DetailsCard";

import { useFormatMoney } from "@/hooks/useFormatMoney";

import {
  Button,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { CurrentCashDrawer } from "@/types/orders";
import type { Organization } from "@/types/organizations";

import { cashDrawerPath } from "@/utils/orders";

const ContentStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
}));

const ActionStack = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  gap: theme.spacing(1),
}));

interface OrdersCashDrawerProps {
  current: CurrentCashDrawer | null;
  organization: Organization;
}

const OrdersCashDrawer = ({
  current: initialCurrent,
  organization: { currency, slug: organizationSlug },
}: OrdersCashDrawerProps) => {
  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();
  const formatMoney = useFormatMoney();

  const tOrders = useTranslations("orders");

  const { data: current, mutate } = useSWR<CurrentCashDrawer>(
    `${cashDrawerPath(organizationSlug)}/current`,
    { fallbackData: initialCurrent ?? undefined },
  );

  const money = (amount: string) => formatMoney(Number(amount), currency);

  if (!current) return null;

  const { session, suggestedOpeningFloat, varianceTolerance } = current;

  const handleOpen = () =>
    setDialog({
      content: (
        <OpenCashDrawerDialog
          mutate={mutate}
          organizationSlug={organizationSlug}
          suggestedOpeningFloat={suggestedOpeningFloat}
        />
      ),
      formId: "open-cash-drawer-form",
      open: true,
      title: tOrders("cashDrawer.actions.open.title"),
    });

  if (!session)
    return (
      <ContentStack>
        <ActionStack direction="row">
          <Button onClick={handleOpen} size="small" variant="contained">
            {tOrders("cashDrawer.actions.open.title")}
          </Button>
        </ActionStack>
        <DetailsCard
          items={[
            {
              key: "suggestedOpeningFloat",
              label: tOrders("cashDrawer.suggestedOpeningFloat"),
              value: money(suggestedOpeningFloat),
            },
          ]}
        >
          <Typography color="textSecondary" variant="body2">
            {tOrders("cashDrawer.empty")}
          </Typography>
        </DetailsCard>
      </ContentStack>
    );

  const { summary } = session;

  const handleMovement = () =>
    setDialog({
      content: (
        <CashDrawerMovementDialog
          currency={currency}
          mutate={mutate}
          organizationSlug={organizationSlug}
          sessionId={session.id}
        />
      ),
      formId: "cash-drawer-movement-form",
      open: true,
      title: tOrders("cashDrawer.actions.movement.title"),
    });

  const handleClose = () =>
    setDialog({
      content: (
        <CloseCashDrawerDialog
          currency={currency}
          mutate={mutate}
          organizationSlug={organizationSlug}
          session={session}
          varianceTolerance={varianceTolerance}
        />
      ),
      formId: "close-cash-drawer-form",
      open: true,
      title: tOrders("cashDrawer.actions.close.title"),
    });

  const withBeforeOpen = (amount: string, beforeOpen: string) =>
    Number(beforeOpen)
      ? tOrders("cashDrawer.withBeforeOpen", {
          amount: money(amount),
          beforeOpen: money(beforeOpen),
        })
      : money(amount);

  return (
    <ContentStack>
      <ActionStack direction="row">
        <Button onClick={handleMovement} size="small" variant="outlined">
          {tOrders("cashDrawer.actions.movement.title")}
        </Button>
        <Button onClick={handleClose} size="small" variant="contained">
          {tOrders("cashDrawer.actions.close.title")}
        </Button>
      </ActionStack>
      <DetailsCard
        items={[
          {
            key: "businessDate",
            label: tOrders("cashDrawer.businessDate"),
            value: session.businessDate,
          },
          {
            key: "countedSince",
            label: tOrders("cashDrawer.countedSince"),
            value: format.dateTime(new Date(summary.countedSince), "dateTime"),
          },
          {
            key: "openingFloat",
            label: tOrders("cashDrawer.openingFloat"),
            value: money(session.openingFloat),
          },
          {
            key: "cashSales",
            label: tOrders("cashDrawer.cashSales"),
            value: withBeforeOpen(
              summary.cashSales,
              summary.cashSalesBeforeOpen,
            ),
          },
          {
            key: "cashRefunds",
            label: tOrders("cashDrawer.cashRefunds"),
            value: withBeforeOpen(
              summary.cashRefunds,
              summary.cashRefundsBeforeOpen,
            ),
          },
          {
            key: "payIns",
            label: tOrders("cashDrawer.movementType.payIn"),
            value: money(summary.payIns),
          },
          {
            key: "payOuts",
            label: tOrders("cashDrawer.movementType.payOut"),
            value: money(summary.payOuts),
          },
          {
            key: "expectedCash",
            label: tOrders("cashDrawer.expectedCash"),
            value: money(summary.expectedCash),
          },
        ]}
      />
      <Typography variant="subtitle1">
        {tOrders("cashDrawer.movements.label")}
      </Typography>
      <DetailsCard
        empty={
          session.movements.length
            ? undefined
            : tOrders("cashDrawer.movements.empty")
        }
      >
        {session.movements.length > 0 && (
          <List dense disablePadding>
            {session.movements.map(
              ({ amount, createdAt, id, reason, type }) => (
                <ListItem disableGutters key={id}>
                  <ListItemText
                    primary={tOrders("cashDrawer.movements.item", {
                      amount: money(amount),
                      type: tOrders(`cashDrawer.movementType.${type}`),
                    })}
                    secondary={`${format.dateTime(new Date(createdAt), "dateTime")}・${reason}`}
                  />
                </ListItem>
              ),
            )}
          </List>
        )}
      </DetailsCard>
    </ContentStack>
  );
};

export default OrdersCashDrawer;
