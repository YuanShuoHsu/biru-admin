"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { NumericFormat } from "react-number-format";

import {
  type CashDeviceCollectionForm,
  useCashDeviceCollectionFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";

import { zodResolver } from "@hookform/resolvers/zod";

import { useFormatMoney } from "@/hooks/useFormatMoney";

import { TextField, Typography } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  CashDeviceEvent,
  CreateCashDeviceCollectionDto,
} from "@/types/cashDevices";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

interface CashDeviceCollectionDialogProps {
  cashDeviceId: string;
  currency: string;
  mutate: () => void;
  organizationSlug: string;
}

const CashDeviceCollectionDialog = ({
  cashDeviceId,
  currency,
  mutate,
  organizationSlug,
}: CashDeviceCollectionDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const formatMoney = useFormatMoney();

  const tCashDevices = useTranslations("cashDevices");
  const tCommon = useTranslations("common");

  const cashDeviceCollectionFormSchema = useCashDeviceCollectionFormSchema();
  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
    trigger,
  } = useForm<CashDeviceCollectionForm>({
    defaultValues: { depositedAmount: "", note: "", reportedAmount: "" },
    resolver: zodResolver(cashDeviceCollectionFormSchema),
  });

  const [depositedAmount, reportedAmount] = useWatch({
    control,
    name: ["depositedAmount", "reportedAmount"],
  });

  const hasBothAmounts = depositedAmount !== "" && reportedAmount !== "";
  const difference = Number(depositedAmount) - Number(reportedAmount);

  const onSubmitHandler = async ({
    depositedAmount,
    note,
    reportedAmount,
  }: CashDeviceCollectionForm) => {
    try {
      setDialog({ confirmLoading: true });

      const event = await fetcher<CashDeviceEvent>(
        `/api/organizations/${organizationSlug}/cash-devices/${cashDeviceId}/collections`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            depositedAmount: Number(depositedAmount),
            idempotencyKey,
            note: note || null,
            reportedAmount: Number(reportedAmount),
          } satisfies CreateCashDeviceCollectionDto),
        },
      );

      enqueueSnackbar(
        tCashDevices("actions.collection.success", {
          difference: formatMoney(Number(event.difference), currency, {
            signDisplay: "exceptZero",
          }),
        }),
        { variant: Number(event.difference) === 0 ? "success" : "warning" },
      );

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
    <FormBox id="cash-device-collection-form" onSubmit={onSubmit}>
      <NumericFormat
        allowNegative={false}
        customInput={TextField}
        decimalScale={0}
        error={!!errors.reportedAmount}
        fullWidth
        helperText={errors.reportedAmount?.message}
        label={tCashDevices("events.reportedAmount")}
        name="reportedAmount"
        onValueChange={({ value }) => {
          setValue("reportedAmount", value);

          if (isSubmitted) trigger(["depositedAmount", "reportedAmount"]);
        }}
        required
        thousandSeparator=","
        value={reportedAmount}
        valueIsNumericString
      />
      <NumericFormat
        allowNegative={false}
        customInput={TextField}
        decimalScale={0}
        error={!!errors.depositedAmount}
        fullWidth
        helperText={errors.depositedAmount?.message}
        label={tCashDevices("events.depositedAmount")}
        name="depositedAmount"
        onValueChange={({ value }) => {
          setValue("depositedAmount", value);

          if (isSubmitted) trigger(["depositedAmount", "reportedAmount"]);
        }}
        required
        thousandSeparator=","
        value={depositedAmount}
        valueIsNumericString
      />
      {hasBothAmounts && (
        <Typography color={difference === 0 ? undefined : "warning"}>
          {tCashDevices("actions.collection.difference", {
            difference: formatMoney(difference, currency, {
              signDisplay: "exceptZero",
            }),
          })}
        </Typography>
      )}
      <TextField
        error={!!errors.note}
        fullWidth
        helperText={errors.note?.message}
        label={`${tCashDevices("events.note")} ${tCommon("optional")}`}
        {...register("note")}
      />
    </FormBox>
  );
};

export default CashDeviceCollectionDialog;
