"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import type { BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  type ResolveOrderTicketForm,
  useResolveOrderTicketFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";
import { usePrintJobErrorText } from "@/components/PrintJobChip";
import StyledFormControlLabel from "@/components/StyledFormControlLabel";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  Alert,
  DialogContentText,
  FormControl,
  FormHelperText,
  Radio,
  RadioGroup,
} from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  AdminOrderResponse,
  OrderTicketJob,
  ResolvePrintJobDto,
} from "@/types/orders";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

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

  const resolveOrderTicketFormSchema = useResolveOrderTicketFormSchema();

  const {
    control,
    formState: { errors },
    handleSubmit,
    setValue,
  } = useForm<ResolveOrderTicketForm>({
    resolver: zodResolver(resolveOrderTicketFormSchema),
  });

  const printed = useWatch({ control, name: "printed" });

  const onSubmitHandler = async ({ printed }: ResolveOrderTicketForm) => {
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

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  const reason = printJobErrorText(job.errorCode);

  return (
    <FormBox id={RESOLVE_ORDER_TICKET_FORM_ID} onSubmit={onSubmit}>
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
      <FormControl error={!!errors.printed}>
        <RadioGroup
          onChange={(_, value) =>
            setValue("printed", value === "true", { shouldValidate: true })
          }
          value={printed === undefined ? "" : String(printed)}
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
        {errors.printed && (
          <FormHelperText>{errors.printed.message}</FormHelperText>
        )}
      </FormControl>
    </FormBox>
  );
};

export default ResolveOrderTicketDialogContent;
