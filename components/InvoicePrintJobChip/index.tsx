"use client";

import { useTranslations } from "next-intl";

import { INVOICE_PRINT_JOB_STATUS_COLORS } from "@/constants/orders";

import { Chip, Tooltip } from "@mui/material";

import orders from "@/messages/en/orders.json";

import type { InvoicePrintJob } from "@/types/orders";

const isKnownErrorCode = (
  code: string,
): code is keyof typeof orders.printJobError =>
  Object.hasOwn(orders.printJobError, code);

export const usePrintJobErrorText = () => {
  const tOrders = useTranslations("orders");

  return (code?: string | null) => {
    if (!code) return "";

    return isKnownErrorCode(code)
      ? tOrders(`printJobError.${code}`)
      : tOrders("printJobError.other", { code });
  };
};

interface InvoicePrintJobChipProps {
  printJob: InvoicePrintJob;
}

const InvoicePrintJobChip = ({ printJob }: InvoicePrintJobChipProps) => {
  const tOrders = useTranslations("orders");

  const printJobErrorText = usePrintJobErrorText();

  return (
    <Tooltip title={printJobErrorText(printJob.errorCode)}>
      <Chip
        color={
          printJob.errorCode && printJob.status === "queued"
            ? "warning"
            : INVOICE_PRINT_JOB_STATUS_COLORS[printJob.status]
        }
        label={tOrders(`printJobStatus.${printJob.status}`)}
        size="small"
        variant="outlined"
      />
    </Tooltip>
  );
};

export default InvoicePrintJobChip;
