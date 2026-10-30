"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent, useEffect, useState } from "react";

import StyledFormControlLabel from "@/components/StyledFormControlLabel";

import {
  Checkbox,
  DialogContentText,
  FormControl,
  FormGroup,
  FormLabel,
  Stack,
  type StackProps,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  AdminOrderResponse,
  OrderTicketPrinterStatus,
  ReprintOrderTicketDto,
} from "@/types/orders";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

const StyledStack = styled(Stack)<StackProps>(({ theme }) => ({
  gap: theme.spacing(2),
}));

export const REPRINT_ORDER_TICKET_FORM_ID = "reprint-order-ticket-form";

interface ReprintOrderTicketDialogContentProps {
  mutate: () => void;
  order: AdminOrderResponse;
  organizationSlug: string;
  printers: OrderTicketPrinterStatus[];
}

const ReprintOrderTicketDialogContent = ({
  mutate,
  order,
  organizationSlug,
  printers,
}: ReprintOrderTicketDialogContentProps) => {
  const { closeDialog, confirmLoading, setDialog } = useDialogStore(
    (state) => state,
  );

  const tOrders = useTranslations("orders");

  const [onlyPrinter] = printers.length === 1 ? printers : [];

  // 多台時不預設全選，避免一台卡紙卻讓每個工作站都多做一份
  const [printerIds, setPrinterIds] = useState<string[]>(
    onlyPrinter ? [onlyPrinter.id] : [],
  );

  useEffect(() => {
    setDialog({ confirmDisabled: !printerIds.length });
  }, [printerIds, setDialog]);

  const handleToggle = (printerId: string, checked: boolean) =>
    setPrinterIds((current) =>
      checked
        ? [...current, printerId]
        : current.filter((id) => id !== printerId),
    );

  const onSubmit = async (event: BaseSyntheticEvent) => {
    event.preventDefault();

    if (confirmLoading || !printerIds.length) return;

    setDialog({ confirmLoading: true });

    try {
      await fetcher(
        `/api/organizations/${organizationSlug}/orders/${order.id}/order-tickets/reprint`,
        {
          body: JSON.stringify({ printerIds } satisfies ReprintOrderTicketDto),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        },
      );

      closeDialog();

      enqueueSnackbar(
        tOrders("actions.reprintOrderTicket.success", {
          orderNumber: order.orderNumber,
        }),
        { variant: "success" },
      );
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
    } finally {
      setDialog({ confirmLoading: false });
      mutate();
    }
  };

  return (
    <StyledStack
      component="form"
      id={REPRINT_ORDER_TICKET_FORM_ID}
      onSubmit={onSubmit}
    >
      <DialogContentText>
        {onlyPrinter
          ? tOrders.rich("actions.reprintOrderTicket.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              orderNumber: order.orderNumber,
              printer: onlyPrinter.name ?? "",
            })
          : tOrders.rich("actions.reprintOrderTicket.confirmMultiple", {
              bold: (chunks) => <strong>{chunks}</strong>,
              orderNumber: order.orderNumber,
            })}
      </DialogContentText>
      {!onlyPrinter && (
        <FormControl>
          <FormLabel>
            {tOrders("actions.reprintOrderTicket.printers")}
          </FormLabel>
          <FormGroup>
            {printers.map(({ id, name }) => (
              <StyledFormControlLabel
                checked={printerIds.includes(id)}
                control={
                  <Checkbox
                    checked={printerIds.includes(id)}
                    disabled={confirmLoading}
                    onChange={(_, checked) => handleToggle(id, checked)}
                  />
                }
                key={id}
                label={name ?? ""}
              />
            ))}
          </FormGroup>
        </FormControl>
      )}
    </StyledStack>
  );
};

export default ReprintOrderTicketDialogContent;
