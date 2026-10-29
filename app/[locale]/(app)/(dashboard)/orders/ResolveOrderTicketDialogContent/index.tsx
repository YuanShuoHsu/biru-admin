"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent, useState } from "react";

import CustomizedDialogActions from "@/components/CustomizedDialogs/Actions";
import CustomizedDialogContent from "@/components/CustomizedDialogs/Content";
import { usePrintJobErrorText } from "@/components/PrintJobChip";
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
  OrderTicketJob,
  ResolvePrintJobDto,
} from "@/types/orders";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

const StyledStack = styled(Stack)<StackProps>(({ theme }) => ({
  gap: theme.spacing(2),
}));

export const RESOLVE_ORDER_TICKET_FORM_ID = "resolve-order-ticket-form";

interface ResolveOrderTicketDialogContentProps {
  job: OrderTicketJob;
  mutate: () => void;
  order: AdminOrderResponse;
  organizationSlug: string;
}

const ResolveOrderTicketDialogContent = ({
  job,
  mutate,
  order,
  organizationSlug,
}: ResolveOrderTicketDialogContentProps) => {
  const { closeDialog, confirmLoading, setDialog } = useDialogStore(
    (state) => state,
  );

  const tCommon = useTranslations("common");
  const tOrders = useTranslations("orders");

  const printJobErrorText = usePrintJobErrorText();

  const [printed, setPrinted] = useState<boolean | null>(null);

  const onSubmit = async (event: BaseSyntheticEvent) => {
    event.preventDefault();

    if (confirmLoading || printed === null) return;

    setDialog({ confirmLoading: true });

    try {
      await fetcher<OrderTicketJob>(
        `/api/organizations/${organizationSlug}/orders/${order.id}/order-tickets/${job.id}/resolution`,
        {
          body: JSON.stringify({ printed } satisfies ResolvePrintJobDto),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        },
      );

      closeDialog();

      enqueueSnackbar(
        tOrders(
          printed
            ? "actions.resolveOrderTicket.printedSuccess"
            : "actions.resolveOrderTicket.reprintSuccess",
          { orderNumber: order.orderNumber },
        ),
        { variant: "success" },
      );
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
    } finally {
      setDialog({ confirmLoading: false });
      mutate();
    }
  };

  const reason = printJobErrorText(job.errorCode);

  return (
    <>
      <CustomizedDialogContent>
        <StyledStack
          component="form"
          id={RESOLVE_ORDER_TICKET_FORM_ID}
          onSubmit={onSubmit}
        >
          <DialogContentText>
            {tOrders.rich("actions.resolveOrderTicket.description", {
              bold: (chunks) => <strong>{chunks}</strong>,
              kind: job.kind,
              orderNumber: order.orderNumber,
              printer: job.printerName ?? tOrders("orderTicket.removedPrinter"),
              reason: reason
                ? `${tCommon("parenthesisOpen")}${reason}${tCommon("parenthesisClose")}`
                : "",
            })}
          </DialogContentText>
          <Alert severity="warning">
            {tOrders("actions.resolveOrderTicket.warning")}
          </Alert>
          <RadioGroup
            onChange={(_, value) => setPrinted(value === "true")}
            value={printed === null ? "" : String(printed)}
          >
            <StyledFormControlLabel
              checked={printed === true}
              control={<Radio disabled={confirmLoading} />}
              label={tOrders("actions.resolveOrderTicket.printed")}
              value="true"
            />
            <StyledFormControlLabel
              checked={printed === false}
              control={<Radio disabled={confirmLoading} />}
              label={tOrders("actions.resolveOrderTicket.notPrinted")}
              value="false"
            />
          </RadioGroup>
        </StyledStack>
      </CustomizedDialogContent>
      <CustomizedDialogActions confirmDisabled={printed === null} />
    </>
  );
};

export default ResolveOrderTicketDialogContent;
