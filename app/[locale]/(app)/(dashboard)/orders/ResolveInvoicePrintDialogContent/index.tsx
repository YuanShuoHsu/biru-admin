"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent, useEffect, useState } from "react";

import { usePrintJobErrorText } from "@/components/InvoicePrintJobChip";
import StyledFormControlLabel from "@/components/StyledFormControlLabel";

import {
  Alert,
  DialogContentText,
  Radio,
  RadioGroup,
  Stack,
  type StackProps,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  AdminOrderResponse,
  InvoicePrintJob,
  ResolveInvoicePrintJobDto,
} from "@/types/orders";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

const StyledStack = styled(Stack)<StackProps>(({ theme }) => ({
  gap: theme.spacing(2),
}));

export const RESOLVE_INVOICE_PRINT_FORM_ID = "resolve-invoice-print-form";

interface ResolveInvoicePrintDialogContentProps {
  mutate: () => void;
  order: AdminOrderResponse;
  organizationSlug: string;
  printJob: InvoicePrintJob;
}

const ResolveInvoicePrintDialogContent = ({
  mutate,
  order,
  organizationSlug,
  printJob,
}: ResolveInvoicePrintDialogContentProps) => {
  const { closeDialog, confirmLoading, setDialog } = useDialogStore(
    (state) => state,
  );

  const tCommon = useTranslations("common");
  const tOrders = useTranslations("orders");

  const printJobErrorText = usePrintJobErrorText();

  const [printed, setPrinted] = useState<boolean | null>(null);

  useEffect(() => {
    setDialog({ confirmDisabled: printed === null });
  }, [printed, setDialog]);

  const onSubmit = async (event: BaseSyntheticEvent) => {
    event.preventDefault();

    if (confirmLoading || printed === null) return;

    setDialog({ confirmLoading: true });

    try {
      await fetcher(
        `/api/organizations/${organizationSlug}/orders/${order.id}/invoice/print-jobs/${printJob.id}/resolution`,
        {
          body: JSON.stringify({
            printed,
          } satisfies ResolveInvoicePrintJobDto),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        },
      );

      enqueueSnackbar(
        tOrders(
          printed
            ? "actions.resolveInvoicePrint.printedSuccess"
            : "actions.resolveInvoicePrint.reprintSuccess",
          { orderNumber: order.orderNumber },
        ),
        { variant: "success" },
      );

      closeDialog();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
    } finally {
      setDialog({ confirmLoading: false });
      mutate();
    }
  };

  const reason = printJobErrorText(printJob.errorCode);

  return (
    <StyledStack
      component="form"
      id={RESOLVE_INVOICE_PRINT_FORM_ID}
      onSubmit={onSubmit}
    >
      <DialogContentText>
        {tOrders.rich("actions.resolveInvoicePrint.description", {
          bold: (chunks) => <strong>{chunks}</strong>,
          orderNumber: order.orderNumber,
          reason: reason
            ? `${tCommon("parenthesisOpen")}${reason}${tCommon("parenthesisClose")}`
            : "",
        })}
      </DialogContentText>
      <Alert severity="warning">
        {tOrders("actions.resolveInvoicePrint.warning")}
      </Alert>
      <RadioGroup
        onChange={(_, value) => setPrinted(value === "true")}
        value={printed === null ? "" : String(printed)}
      >
        <StyledFormControlLabel
          checked={printed === true}
          control={<Radio disabled={confirmLoading} />}
          label={tOrders("actions.resolveInvoicePrint.printed")}
          value="true"
        />
        <StyledFormControlLabel
          checked={printed === false}
          control={<Radio disabled={confirmLoading} />}
          label={tOrders("actions.resolveInvoicePrint.notPrinted")}
          value="false"
        />
      </RadioGroup>
    </StyledStack>
  );
};

export default ResolveInvoicePrintDialogContent;
