"use client";

import { useTranslations } from "next-intl";
import useSWR from "swr";

import ErrorAlert from "@/components/ErrorAlert";

import { MenuItem, TextField } from "@mui/material";

import type { OrderTicketPrinterOption } from "@/types/orders";

interface OrderTicketPrinterFieldProps {
  disabled?: boolean;
  menuId: string;
  onChange: (printerId: string | null) => void;
  scope: "item" | "section";
  value: string | null;
}

const OrderTicketPrinterField = ({
  disabled,
  menuId,
  onChange,
  scope,
  value,
}: OrderTicketPrinterFieldProps) => {
  const tCommon = useTranslations("common");
  const tMenus = useTranslations("menus");

  const {
    data: printers,
    error,
    mutate,
  } = useSWR<OrderTicketPrinterOption[]>(
    `/api/menus/${menuId}/order-ticket-printers`,
  );

  if (error) return <ErrorAlert onRetry={() => mutate()} />;

  // 只有一台時每個品項都印到它，不需要指定
  if (!printers || printers.length < 2) return null;

  const selected = printers.find(({ id }) => id === value);
  const defaultPrinter = printers.find(({ isDefault }) => isDefault);

  return (
    <TextField
      disabled={disabled}
      fullWidth
      helperText={
        scope === "section"
          ? tMenus("orderTicketPrinter.sectionHelperText", {
              name: defaultPrinter?.name ?? "",
            })
          : tMenus("orderTicketPrinter.itemHelperText")
      }
      label={`${tMenus("orderTicketPrinter.label")} ${tCommon("optional")}`}
      onChange={(event) => onChange(event.target.value || null)}
      select
      slotProps={{
        inputLabel: { shrink: true },
        select: {
          displayEmpty: true,
          renderValue: () =>
            selected ? (
              selected.name
            ) : (
              <em>{tMenus("orderTicketPrinter.placeholder")}</em>
            ),
        },
      }}
      value={selected ? value : ""}
    >
      <MenuItem value="">
        <em>{tMenus("orderTicketPrinter.placeholder")}</em>
      </MenuItem>
      {printers.map(({ id, name }) => (
        <MenuItem key={id} value={id}>
          {name}
        </MenuItem>
      ))}
    </TextField>
  );
};

export default OrderTicketPrinterField;
