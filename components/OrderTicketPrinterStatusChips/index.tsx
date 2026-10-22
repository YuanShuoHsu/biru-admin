"use client";

import { useFormatter, useTranslations } from "next-intl";

import { useOrderTicketPrinterStatuses } from "@/hooks/useOrderActions";

import { PrintDisabled } from "@mui/icons-material";
import { Chip, Tooltip } from "@mui/material";

interface OrderTicketPrinterStatusChipsProps {
  organizationSlug: string;
}

const OrderTicketPrinterStatusChips = ({
  organizationSlug,
}: OrderTicketPrinterStatusChipsProps) => {
  const format = useFormatter();
  const tOrders = useTranslations("orders");

  const printers = useOrderTicketPrinterStatuses(organizationSlug);

  return printers
    ?.filter(({ online }) => !online)
    .map(({ id, lastSeenAt, name }) => (
      <Tooltip
        key={id}
        title={tOrders("orderTicket.offline.tooltip", {
          lastSeenAt: lastSeenAt
            ? format.dateTime(new Date(lastSeenAt), "short")
            : tOrders("printerOffline.neverSeen"),
        })}
      >
        <Chip
          color="error"
          icon={<PrintDisabled />}
          label={tOrders("orderTicket.offline.label", { printer: name ?? "" })}
          variant="outlined"
        />
      </Tooltip>
    ));
};

export default OrderTicketPrinterStatusChips;
