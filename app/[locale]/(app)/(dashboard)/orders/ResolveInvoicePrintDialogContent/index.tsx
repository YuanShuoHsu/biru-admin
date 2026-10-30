"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import type { BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  type ResolveInvoicePrintForm,
  useResolveInvoicePrintFormSchema,
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
  PrintJob,
  ResolvePrintJobDto,
} from "@/types/orders";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

export const RESOLVE_INVOICE_PRINT_FORM_ID = "resolve-invoice-print-form";

interface ResolveInvoicePrintDialogContentProps {
  mutate: () => void;
  onBrowserReprint: () => Promise<void>;
  order: AdminOrderResponse;
  organizationSlug: string;
  printJob: PrintJob;
}

const ResolveInvoicePrintDialogContent = ({
  mutate,
  onBrowserReprint,
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

  const resolveInvoicePrintFormSchema = useResolveInvoicePrintFormSchema();

  const {
    control,
    formState: { errors },
    handleSubmit,
    setValue,
  } = useForm<ResolveInvoicePrintForm>({
    resolver: zodResolver(resolveInvoicePrintFormSchema),
  });

  const printed = useWatch({ control, name: "printed" });

  const onSubmitHandler = async ({ printed }: ResolveInvoicePrintForm) => {
    setDialog({ confirmLoading: true });

    try {
      const resolved = await fetcher<PrintJob>(
        `/api/organizations/${organizationSlug}/orders/${order.id}/invoice/print-jobs/${printJob.id}/resolution`,
        {
          body: JSON.stringify({
            printed,
          } satisfies ResolvePrintJobDto),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        },
      );

      closeDialog();

      // 沒有印表機時後端只作廢這次列印，重印要由這個瀏覽器再開一次列印視窗
      if (resolved.status === "cancelled") {
        enqueueSnackbar(tOrders("actions.resolveInvoicePrint.browserReprint"), {
          variant: "info",
        });
        await onBrowserReprint();

        return;
      }

      enqueueSnackbar(
        tOrders(
          printed
            ? "actions.resolveInvoicePrint.printedSuccess"
            : "actions.resolveInvoicePrint.reprintSuccess",
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

  const reason = printJobErrorText(printJob.errorCode);

  return (
    <FormBox id={RESOLVE_INVOICE_PRINT_FORM_ID} onSubmit={onSubmit}>
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
        {errors.printed && (
          <FormHelperText>{errors.printed.message}</FormHelperText>
        )}
      </FormControl>
    </FormBox>
  );
};

export default ResolveInvoicePrintDialogContent;
