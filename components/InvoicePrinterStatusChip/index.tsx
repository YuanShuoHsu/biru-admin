"use client";

import { useFormatter, useTranslations } from "next-intl";

import { useInvoicePrinterStatus } from "@/hooks/useOrderActions";

import { PrintDisabled } from "@mui/icons-material";
import { Chip, Tooltip } from "@mui/material";

interface InvoicePrinterStatusChipProps {
  organizationSlug: string;
}

const InvoicePrinterStatusChip = ({
  organizationSlug,
}: InvoicePrinterStatusChipProps) => {
  const format = useFormatter();
  const tOrders = useTranslations("orders");

  const status = useInvoicePrinterStatus(organizationSlug);

  if (!status?.configured || status.online) return null;

  return (
    <Tooltip
      title={tOrders("printerOffline.tooltip", {
        lastSeenAt: status.lastSeenAt
          ? format.dateTime(new Date(status.lastSeenAt), "short")
          : tOrders("printerOffline.neverSeen"),
      })}
    >
      <Chip
        color="error"
        icon={<PrintDisabled />}
        label={tOrders("printerOffline.label")}
        variant="outlined"
      />
    </Tooltip>
  );
};

export default InvoicePrinterStatusChip;
