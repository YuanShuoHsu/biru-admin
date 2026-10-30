"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import type { BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  type ReprintOrderTicketForm,
  useReprintOrderTicketFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";
import StyledFormControlLabel from "@/components/StyledFormControlLabel";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  Checkbox,
  DialogContentText,
  FormControl,
  FormGroup,
  FormHelperText,
  FormLabel,
} from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  AdminOrderResponse,
  OrderTicketPrinterStatus,
  ReprintOrderTicketDto,
} from "@/types/orders";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

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

  const reprintOrderTicketFormSchema = useReprintOrderTicketFormSchema();

  const {
    control,
    formState: { errors },
    handleSubmit,
    setValue,
  } = useForm<ReprintOrderTicketForm>({
    // 多台時不預設全選，避免一台卡紙卻讓每個工作站都多做一份
    defaultValues: { printerIds: onlyPrinter ? [onlyPrinter.id] : [] },
    resolver: zodResolver(reprintOrderTicketFormSchema),
  });

  const printerIds = useWatch({ control, name: "printerIds" });

  const handleToggle = (printerId: string, checked: boolean) =>
    setValue(
      "printerIds",
      checked
        ? [...printerIds, printerId]
        : printerIds.filter((id) => id !== printerId),
      { shouldValidate: true },
    );

  const onSubmitHandler = async ({ printerIds }: ReprintOrderTicketForm) => {
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

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id={REPRINT_ORDER_TICKET_FORM_ID} onSubmit={onSubmit}>
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
        <FormControl error={!!errors.printerIds}>
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
          {errors.printerIds && (
            <FormHelperText>{errors.printerIds.message}</FormHelperText>
          )}
        </FormControl>
      )}
    </FormBox>
  );
};

export default ReprintOrderTicketDialogContent;
