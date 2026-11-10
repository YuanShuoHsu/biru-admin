"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";

import {
  type OrderTicketPrinterForm,
  useOrderTicketPrinterFormSchema,
} from "../definitions";

import FormBox from "@/components/FormBox";

import { zodResolver } from "@hookform/resolvers/zod";

import { TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { UpdateOrderTicketPrinterDto } from "@/types/orders";
import type { Printer } from "@/types/organizations";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

interface RenameOrderTicketPrinterDialogProps {
  onChanged: () => Promise<unknown>;
  printer: Printer;
  printerUrl: string;
}

const RenameOrderTicketPrinterDialog = ({
  onChanged,
  printer,
  printerUrl,
}: RenameOrderTicketPrinterDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tOrganizations = useTranslations("organizations");

  const orderTicketPrinterFormSchema = useOrderTicketPrinterFormSchema();

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<OrderTicketPrinterForm>({
    defaultValues: { name: printer.name ?? "" },
    resolver: zodResolver(orderTicketPrinterFormSchema),
  });

  const onSubmitHandler = async ({ name }: OrderTicketPrinterForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher<Printer>(printerUrl, {
        body: JSON.stringify({ name } satisfies UpdateOrderTicketPrinterDto),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });

      enqueueSnackbar(
        tOrganizations("inStore.orderTicketPrinters.renameSuccess", { name }),
        { variant: "success" },
      );

      closeDialog();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });

      setDialog({ confirmLoading: false });
    } finally {
      await onChanged();
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="rename-order-ticket-printer-form" onSubmit={onSubmit}>
      <TextField
        error={!!errors.name}
        fullWidth
        helperText={errors.name?.message}
        label={tOrganizations("inStore.orderTicketPrinters.name.label")}
        placeholder={tOrganizations(
          "inStore.orderTicketPrinters.name.placeholder",
        )}
        required
        slotProps={{ htmlInput: { maxLength: 50 } }}
        {...register("name")}
      />
    </FormBox>
  );
};

export default RenameOrderTicketPrinterDialog;
