"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { NumericFormat } from "react-number-format";

import {
  CASH_DENOMINATIONS,
  type CashDeviceRefillForm,
  useCashDeviceRefillFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";

import { zodResolver } from "@hookform/resolvers/zod";

import { useFormatMoney } from "@/hooks/useFormatMoney";

import { FormHelperText, Grid, TextField, Typography } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  CashDeviceEvent,
  CreateCashDeviceRefillDto,
} from "@/types/cashDevices";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

interface CashDeviceRefillDialogProps {
  cashDeviceId: string;
  currency: string;
  mutate: () => void;
  organizationSlug: string;
}

const CashDeviceRefillDialog = ({
  cashDeviceId,
  currency,
  mutate,
  organizationSlug,
}: CashDeviceRefillDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const formatMoney = useFormatMoney();

  const tCashDevices = useTranslations("cashDevices");
  const tCommon = useTranslations("common");

  const cashDeviceRefillFormSchema = useCashDeviceRefillFormSchema();
  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<CashDeviceRefillForm>({
    defaultValues: {
      counts: CASH_DENOMINATIONS.map(() => ""),
      note: "",
    },
    resolver: zodResolver(cashDeviceRefillFormSchema),
  });

  const counts = useWatch({ control, name: "counts" });

  const total = CASH_DENOMINATIONS.reduce(
    (sum, denomination, index) => sum + denomination * Number(counts[index]),
    0,
  );

  const onSubmitHandler = async ({ counts, note }: CashDeviceRefillForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher<CashDeviceEvent>(
        `/api/organizations/${organizationSlug}/cash-devices/${cashDeviceId}/refills`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            denominations: Object.fromEntries(
              CASH_DENOMINATIONS.flatMap((denomination, index) =>
                Number(counts[index]) > 0
                  ? [[denomination, Number(counts[index])]]
                  : [],
              ),
            ),
            idempotencyKey,
            note: note || null,
          } satisfies CreateCashDeviceRefillDto),
        },
      );

      enqueueSnackbar(tCashDevices("actions.refill.success"), {
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
    <FormBox id="cash-device-refill-form" onSubmit={onSubmit}>
      <Grid container spacing={2}>
        {CASH_DENOMINATIONS.map((denomination, index) => (
          <Grid key={denomination} size={{ xs: 6, sm: 4 }}>
            <NumericFormat
              allowNegative={false}
              customInput={TextField}
              decimalScale={0}
              error={!!errors.counts?.message || !!errors.counts?.[index]}
              fullWidth
              helperText={errors.counts?.[index]?.message}
              label={formatMoney(denomination, currency)}
              name={`counts.${index}`}
              onValueChange={({ value }) =>
                setValue(`counts.${index}`, value, {
                  shouldValidate: isSubmitted,
                })
              }
              thousandSeparator=","
              value={counts[index]}
              valueIsNumericString
            />
          </Grid>
        ))}
      </Grid>
      {errors.counts?.message && (
        <FormHelperText error>{errors.counts.message}</FormHelperText>
      )}
      <Typography>
        {tCashDevices("actions.refill.total", {
          total: formatMoney(total, currency),
        })}
      </Typography>
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

export default CashDeviceRefillDialog;
