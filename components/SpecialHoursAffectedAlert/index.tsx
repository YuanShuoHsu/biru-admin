"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Fragment, useState } from "react";
import useSWR from "swr";

import { useMemberRole } from "@/hooks/organizations";
import { useSession } from "@/hooks/useSession";

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
  SpecialHoursProcessStatus,
} from "@/types/organizations";

import { fetcher } from "@/utils/fetcher";
import { hasRolePermission } from "@/utils/organizations";

const REFRESH_INTERVAL_MS = 60_000;

interface ProcessResult {
  id: string;
  label: string;
  message?: string;
  status: SpecialHoursProcessStatus;
}

interface SpecialHoursAffectedAlertProps {
  onProcessed?: () => void;
  organizationSlug: string;
}

const SpecialHoursAffectedAlert = ({
  onProcessed,
  organizationSlug,
}: SpecialHoursAffectedAlertProps) => {
  const { setDialog } = useDialogStore((state) => state);

  const [results, setResults] = useState<ProcessResult[] | null>(null);

  const format = useFormatter();

  const tCommon = useTranslations("common");
  const tAffected = useTranslations("organizations.specialHours.affected");

  const memberRole = useMemberRole(organizationSlug);
  const canRefund =
    useSession()?.user.role === "admin" ||
    hasRolePermission(memberRole, { refund: ["create"] });

  const affectedUrl = `/api/organizations/${organizationSlug}/special-hours/affected`;

  const { data, mutate } = useSWR<SpecialHoursAffected>(affectedUrl, {
    refreshInterval: REFRESH_INTERVAL_MS,
  });

  const {
    manualRefundOrders = [],
    refundOrders = [],
    unpaidOrders = [],
    waitlistTickets = [],
  } = data ?? {};

  const toOrderItem = ({
    customer,
    id,
    orderNumber,
    pickupTime,
  }: SpecialHoursAffectedOrder) => ({
    id,
    label: orderNumber,
    text: [
      orderNumber,
      customer.name,
      pickupTime && format.dateTime(new Date(pickupTime), "compact"),
    ]
      .filter(Boolean)
      .join(tCommon("delimiter")),
  });

  const sections = (
    [
      ["refundOrders", refundOrders.map(toOrderItem)],
      ["manualRefundOrders", manualRefundOrders.map(toOrderItem)],
      ["unpaidOrders", unpaidOrders.map(toOrderItem)],
      [
        "waitlistTickets",
        waitlistTickets.map(({ id, name, ticketNumber }) => ({
          id,
          label: ticketNumber,
          text: [ticketNumber, name].filter(Boolean).join(tCommon("delimiter")),
        })),
      ],
    ] as const
  ).filter(([, items]) => items.length);

  const processedOrders = canRefund ? [...refundOrders, ...unpaidOrders] : [];

  const handleProcess = () => {
    const idempotencyKey = crypto.randomUUID();
    const labels = new Map(
      sections.flatMap(([, items]) =>
        items.map(({ id, label }) => [id, label] as const),
      ),
    );
    const counts = {
      manualRefund: manualRefundOrders.length,
      refund: canRefund ? refundOrders.length : 0,
      tickets: waitlistTickets.length,
      unpaid: canRefund ? unpaidOrders.length : 0,
    };

    setDialog({
      content: (
        <>
          <DialogContentText>{tAffected("process.confirm")}</DialogContentText>
          {Object.entries(counts)
            .filter(([, count]) => count)
            .map(([key, count]) => (
              <DialogContentText key={key}>
                {tAffected(`process.${key as keyof typeof counts}`, { count })}
              </DialogContentText>
            ))}
        </>
      ),
      onConfirm: async () => {
        const response = await fetcher<SpecialHoursProcessResponse>(
          `${affectedUrl}/process`,
          {
            body: JSON.stringify({
              orderIds: processedOrders.map(({ id }) => id),
              ticketIds: waitlistTickets.map(({ id }) => id),
            } satisfies ProcessSpecialHoursAffectedDto),
            headers: {
              "Content-Type": "application/json",
              "Idempotency-Key": idempotencyKey,
            },
            method: "POST",
          },
        );

        setResults(
          [...response.orders, ...response.waitlistTickets].map(
            ({ id, message, status }) => ({
              id,
              label: labels.get(id) ?? id,
              message,
              status,
            }),
          ),
        );

        await mutate();
        onProcessed?.();
      },
      open: true,
      title: tAffected("process.title"),
    });
  };

  const hasFailure = results?.some(({ status }) => status === "failed");

  return (
    <>
      {results && (
        <Alert
          onClose={() => setResults(null)}
          severity={
            hasFailure
              ? "error"
              : results.some(({ status }) => status === "manualRefundRequired")
                ? "warning"
                : "success"
          }
        >
          <AlertTitle>{tAffected("results.title")}</AlertTitle>
          {results.map(({ id, label, message, status }) => (
            <Typography key={id} variant="body2">
              {label}
              {tCommon("colon")}
              {tAffected(`results.status.${status}`)}
              {message && `${tCommon("delimiter")}${message}`}
            </Typography>
          ))}
          {hasFailure && (
            <Typography variant="body2">
              {tAffected("results.retry")}
            </Typography>
          )}
        </Alert>
      )}
      {!!sections.length && (
        <Alert
          action={
            (!!processedOrders.length || !!waitlistTickets.length) && (
              <Button color="inherit" onClick={handleProcess} size="small">
                {tAffected("process.title")}
              </Button>
            )
          }
          severity="warning"
        >
          <AlertTitle>{tAffected("title")}</AlertTitle>
          {sections.map(([key, items]) => (
            <Fragment key={key}>
              <Typography variant="subtitle2">
                {tAffected(`${key}.label`, { count: items.length })}
              </Typography>
              {key === "manualRefundOrders" && (
                <Typography variant="body2">
                  {tAffected("manualRefundOrders.hint")}
                </Typography>
              )}
              {items.map(({ id, text }) => (
                <Typography key={id} variant="body2">
                  {text}
                </Typography>
              ))}
            </Fragment>
          ))}
        </Alert>
      )}
    </>
  );
};

export default SpecialHoursAffectedAlert;
