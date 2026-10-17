"use client";

import type { BaseSyntheticEvent } from "react";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useForm } from "react-hook-form";

import { quantAccountUrl } from "../../useQuantCredentials";
import {
  type FuturesRiskForm,
  toRiskDto,
  useFuturesRiskFormSchema,
  valuesFromRisk,
} from "./definitions";

import FormBox from "@/components/FormBox";

import { zodResolver } from "@hookform/resolvers/zod";

import { Alert, InputAdornment, TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { QuantCredential, QuantFuturesRisk } from "@/types/quant";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

export const FUTURES_RISK_FORM_ID = "quant-futures-risk-form";

interface FuturesRiskDialogProps {
  credential: QuantCredential;
  risk: QuantFuturesRisk;
}

const FuturesRiskDialog = ({ credential, risk }: FuturesRiskDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);
  const tQuant = useTranslations("quant");

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<FuturesRiskForm>({
    defaultValues: valuesFromRisk(risk),
    resolver: zodResolver(useFuturesRiskFormSchema()),
  });

  const onSubmitHandler = async (values: FuturesRiskForm) => {
    try {
      setDialog({ confirmLoading: true });
      await fetcher(quantAccountUrl(credential.id, "futures/risk"), {
        body: JSON.stringify(toRiskDto(values)),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });
      enqueueSnackbar(tQuant("settings.risk.success"), { variant: "success" });
      closeDialog();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  const field = (
    name: keyof FuturesRiskForm,
    adornment: string,
    inputMode: "decimal" | "numeric",
  ) => (
    <TextField
      {...register(name)}
      error={!!errors[name]}
      fullWidth
      helperText={
        errors[name]?.message ?? tQuant(`settings.risk.${name}Helper`)
      }
      label={tQuant(`settings.risk.${name}`)}
      placeholder={tQuant("settings.risk.unlimited")}
      slotProps={{
        htmlInput: { inputMode },
        input: {
          endAdornment: (
            <InputAdornment position="end">{adornment}</InputAdornment>
          ),
        },
      }}
    />
  );

  return (
    <FormBox id={FUTURES_RISK_FORM_ID} noValidate onSubmit={onSubmit}>
      <Alert severity="info">{tQuant("settings.risk.hint")}</Alert>
      {field("maxLeverage", "x", "numeric")}
      {field("maxDailyLoss", "USDT", "decimal")}
      {field("minLiquidationDistance", "%", "decimal")}
    </FormBox>
  );
};

export default FuturesRiskDialog;
