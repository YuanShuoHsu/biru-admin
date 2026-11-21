"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Fragment } from "react";
import useSWR from "swr";

import {
  Alert,
  AlertTitle,
  Button,
  DialogContentText,
  Typography,
} from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  ProcessSpecialHoursAffectedDto,
  SpecialHoursAffected,
  SpecialHoursAffectedOrder,
  SpecialHoursProcessResponse,
} from "@/types/organizations";

import { fetcher } from "@/utils/fetcher";

const REFRESH_INTERVAL_MS = 60_000;
const PROCESS_LIMIT = 100;

const getSections = ({
  manualRefundOrders = [],
  refundOrders = [],
  unpaidOrders = [],
  waitlistTickets = [],
}: SpecialHoursAffected) =>
  (
    [
      ["refundOrders", refundOrders],
      ["manualRefundOrders", manualRefundOrders],
      ["unpaidOrders", unpaidOrders],
      ["waitlistTickets", waitlistTickets],
    ] as const
  ).filter(([, items]) => items.length);

export const useSpecialHoursAffectedPreview = (organizationSlug: string) => {
  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const tCommon = useTranslations("common");
  const tAffected = useTranslations("organizations.specialHours.affected");

  const affectedUrl = `/api/organizations/${organizationSlug}/special-hours/affected`;

  const formatOrder = ({
    customer,
    orderNumber,
    pickupTime,
  }: SpecialHoursAffectedOrder) =>
    [
      orderNumber,
      customer.name,
      pickupTime && format.dateTime(new Date(pickupTime), "compact"),
    ]
      .filter(Boolean)
      .join(tCommon("delimiter"));

  const openPreview = (
    affected: SpecialHoursAffected,
    onProcessed?: () => void,
  ) => {
    const sections = getSections(affected);
    if (!sections.length) return false;

    const {
      manualRefundOrders = [],
      refundOrders = [],
      unpaidOrders = [],
      waitlistTickets = [],
    } = affected;
    const orderIds = [...refundOrders, ...unpaidOrders].map(({ id }) => id);
    const ticketIds = waitlistTickets.map(({ id }) => id);
    const processable = !!orderIds.length || !!ticketIds.length;
    const labels = new Map([
      ...[...refundOrders, ...unpaidOrders].map(
        ({ id, orderNumber }) => [id, orderNumber] as const,
      ),
      ...waitlistTickets.map(
        ({ id, ticketNumber }) => [id, ticketNumber] as const,
      ),
    ]);
    const counts = {
      refund: refundOrders.length,
      unpaid: unpaidOrders.length,
      tickets: waitlistTickets.length,
      manualRefund: manualRefundOrders.length,
    };
    const idempotencyKey = crypto.randomUUID();

    const process = async () => {
      const results: SpecialHoursProcessResponse = {
        orders: [],
        waitlistTickets: [],
      };

      for (
        let start = 0;
        start < Math.max(orderIds.length, ticketIds.length);
        start += PROCESS_LIMIT
      ) {
        const response = await fetcher<SpecialHoursProcessResponse>(
          `${affectedUrl}/process`,
          {
            body: JSON.stringify({
              orderIds: orderIds.slice(start, start + PROCESS_LIMIT),
              ticketIds: ticketIds.slice(start, start + PROCESS_LIMIT),
            } satisfies ProcessSpecialHoursAffectedDto),
            headers: {
              "Content-Type": "application/json",
              "Idempotency-Key": idempotencyKey,
            },
            method: "POST",
          },
        );

        results.orders.push(...response.orders);
        results.waitlistTickets.push(...response.waitlistTickets);
      }

      const items = [...results.orders, ...results.waitlistTickets];

      setDialog({
        onExited: () =>
          setDialog({
            content: (
              <>
                {items.map(({ id, message, status }) => (
                  <DialogContentText key={id}>
                    {labels.get(id) ?? id}
                    {tCommon("colon")}
                    {tAffected(`results.status.${status}`)}
                    {message && `${tCommon("delimiter")}${message}`}
                  </DialogContentText>
                ))}
                {items.some(({ status }) => status === "failed") && (
                  <Typography color="error" variant="body2">
                    {tAffected("results.retry")}
                  </Typography>
                )}
              </>
            ),
            open: true,
            showConfirm: false,
            title: tAffected("results.title"),
          }),
      });

      onProcessed?.();
    };

    setDialog({
      confirmLoading: false,
      confirmText: processable ? tAffected("process.title") : undefined,
      content: (
        <>
          {sections.map(([key, items]) => (
            <Fragment key={key}>
              <Typography variant="subtitle2">
                {tAffected(`${key}.label`, { count: items.length })}
              </Typography>
              {key === "manualRefundOrders" && (
                <Typography color="warning" variant="body2">
                  {tAffected("manualRefundOrders.hint")}
                </Typography>
              )}
              {items.map((item) => (
                <Typography key={item.id} variant="body2">
                  {"orderNumber" in item
                    ? formatOrder(item)
                    : [item.ticketNumber, item.name]
                        .filter(Boolean)
                        .join(tCommon("delimiter"))}
                </Typography>
              ))}
            </Fragment>
          ))}
          {processable && (
            <>
              <DialogContentText>
                {tAffected("process.confirm")}
              </DialogContentText>
              {Object.entries(counts)
                .filter(([, count]) => count)
                .map(([key, count]) => (
                  <DialogContentText key={key}>
                    {tAffected(`process.${key as keyof typeof counts}`, {
                      count,
                    })}
                  </DialogContentText>
                ))}
            </>
          )}
        </>
      ),
      formId: undefined,
      onConfirm: processable ? process : undefined,
      open: true,
      showConfirm: processable,
      title: tAffected("title"),
    });

    return true;
  };

  return { affectedUrl, openPreview };
};

interface SpecialHoursAffectedAlertProps {
  onProcessed?: () => void;
  organizationSlug: string;
}

const SpecialHoursAffectedAlert = ({
  onProcessed,
  organizationSlug,
}: SpecialHoursAffectedAlertProps) => {
  const tAffected = useTranslations("organizations.specialHours.affected");

  const { affectedUrl, openPreview } =
    useSpecialHoursAffectedPreview(organizationSlug);

  const { data, mutate } = useSWR<SpecialHoursAffected>(affectedUrl, {
    refreshInterval: REFRESH_INTERVAL_MS,
  });

  const sections = data ? getSections(data) : [];

  if (!data || !sections.length) return null;

  return (
    <Alert
      action={
        <Button
          color="inherit"
          onClick={() =>
            openPreview(data, () => {
              void mutate();
              onProcessed?.();
            })
          }
          size="small"
        >
          {tAffected(
            sections.some(([key]) => key !== "manualRefundOrders")
              ? "process.title"
              : "details",
          )}
        </Button>
      }
      severity="warning"
    >
      <AlertTitle>{tAffected("title")}</AlertTitle>
      {sections.map(([key, items]) => (
        <Typography key={key} variant="body2">
          {tAffected(`${key}.label`, { count: items.length })}
        </Typography>
      ))}
    </Alert>
  );
};

export default SpecialHoursAffectedAlert;
