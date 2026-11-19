"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import { type CashDeviceForm, useCashDeviceFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";

import { zodResolver } from "@hookform/resolvers/zod";

import { MenuItem, TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { cashDeviceStatusValues } from "@/types/api";
import type {
  CashDevice,
  CreateCashDeviceDto,
  UpdateCashDeviceDto,
} from "@/types/cashDevices";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

interface CashDeviceDialogProps {
  cashDevice: CashDevice | null;
  mutate: () => void;
  organizationSlug: string;
}

const CashDeviceDialog = ({
  cashDevice,
  mutate,
  organizationSlug,
}: CashDeviceDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tCashDevices = useTranslations("cashDevices");
  const tCommon = useTranslations("common");

  const cashDeviceFormSchema = useCashDeviceFormSchema();
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setValue,
  } = useForm<CashDeviceForm>({
    defaultValues: {
      model: cashDevice?.model ?? "",
      name: cashDevice?.name ?? "",
      status: cashDevice?.status ?? "active",
      vendor: cashDevice?.vendor ?? "",
    },
    resolver: zodResolver(cashDeviceFormSchema),
  });

  const status = useWatch({ control, name: "status" });

  const action = cashDevice ? "update" : "create";

  const onSubmitHandler = async (values: CashDeviceForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher<CashDevice>(
        `/api/organizations/${organizationSlug}/cash-devices${cashDevice ? `/${cashDevice.id}` : ""}`,
        {
          method: cashDevice ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: values.model || null,
            name: values.name,
            status: values.status,
            vendor: values.vendor || null,
          } satisfies CreateCashDeviceDto & UpdateCashDeviceDto),
        },
      );

      enqueueSnackbar(tCashDevices(`actions.${action}.success`), {
        variant: "success",
      });

      closeDialog();

      mutate();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="cash-device-form" onSubmit={onSubmit}>
      <TextField
        error={!!errors.name}
        fullWidth
        helperText={errors.name?.message}
        label={tCashDevices("name.label")}
        placeholder={tCashDevices("name.placeholder")}
        required
        {...register("name")}
      />
      <TextField
        error={!!errors.vendor}
        fullWidth
        helperText={errors.vendor?.message}
        label={`${tCashDevices("vendor.label")} ${tCommon("optional")}`}
        placeholder={tCashDevices("vendor.placeholder")}
        {...register("vendor")}
      />
      <TextField
        error={!!errors.model}
        fullWidth
        helperText={errors.model?.message}
        label={`${tCashDevices("model.label")} ${tCommon("optional")}`}
        placeholder={tCashDevices("model.placeholder")}
        {...register("model")}
      />
      <TextField
        fullWidth
        label={tCashDevices("status.label")}
        onChange={(event) =>
          setValue("status", event.target.value as CashDeviceForm["status"])
        }
        select
        value={status}
      >
        {cashDeviceStatusValues.map((value) => (
          <MenuItem key={value} value={value}>
            {tCashDevices(`status.${value}`)}
          </MenuItem>
        ))}
      </TextField>
    </FormBox>
  );
};

export default CashDeviceDialog;
