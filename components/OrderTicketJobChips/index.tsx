"use client";

import { useTranslations } from "next-intl";

import PrintJobChip from "@/components/PrintJobChip";

import type { OrderTicketJob } from "@/types/orders";

interface OrderTicketJobChipsProps {
  jobs: OrderTicketJob[];
}

const OrderTicketJobChips = ({ jobs }: OrderTicketJobChipsProps) => {
  const tOrders = useTranslations("orders");

  return jobs.map((job) => (
    <PrintJobChip
      key={job.id}
      label={tOrders("orderTicket.chip", {
        kind: job.kind,
        printer: job.printerName,
        status: tOrders(`printJobStatus.${job.status}`),
      })}
      printJob={job}
    />
  ));
};

export default OrderTicketJobChips;
