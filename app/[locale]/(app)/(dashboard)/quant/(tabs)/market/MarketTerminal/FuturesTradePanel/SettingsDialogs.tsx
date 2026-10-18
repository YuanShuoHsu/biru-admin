"use client";

import { type BaseSyntheticEvent, useState } from "react";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";

import FormBox from "@/components/FormBox";

import {
  Alert,
  Slider,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { quantMarginModeValues, quantPositionModeValues } from "@/types/api";
import type {
  QuantMarginMode,
  QuantPositionMode,
  SetLeverageDto,
  SetMarginModeDto,
  SetPositionModeDto,
} from "@/types/quant";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

export const FUTURES_SETTINGS_FORM_ID = "quant-futures-settings-form";

const useSubmit = (url: string, onSaved: () => void) => {
  const tQuant = useTranslations("quant");
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  return async (body: object) => {
    try {
      setDialog({ confirmLoading: true });
      await fetcher(url, {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });
      enqueueSnackbar(tQuant("futures.settings.success"), {
        variant: "success",
      });
      closeDialog();
      onSaved();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
      setDialog({ confirmLoading: false });
    }
  };
};

interface LeverageDialogProps {
  leverage: number;
  maxLeverage: number;
  onSaved: () => void;
  symbol: string;
  url: string;
}

export const LeverageDialog = ({
  leverage,
  maxLeverage,
  onSaved,
  symbol,
  url,
}: LeverageDialogProps) => {
  const tQuant = useTranslations("quant");
  const submit = useSubmit(url, onSaved);
  const max = maxLeverage;
  const [value, setValue] = useState(Math.min(leverage, max));

  const onSubmit = (event: BaseSyntheticEvent) => {
    event.preventDefault();
    void submit({ leverage: value, symbol } satisfies SetLeverageDto);
  };

  return (
    <FormBox id={FUTURES_SETTINGS_FORM_ID} noValidate onSubmit={onSubmit}>
      <Stack sx={{ alignItems: "center", flexDirection: "row", gap: 2 }}>
        <Slider
          max={max}
          min={1}
          onChange={(_, next) => setValue(next)}
          sx={{ flex: 1 }}
          value={value}
        />
        <TextField
          label={tQuant("futures.leverage")}
          onChange={(event) =>
            setValue(
              Math.min(
                max,
                Math.max(1, Math.floor(Number(event.target.value))),
              ),
            )
          }
          size="small"
          slotProps={{ htmlInput: { inputMode: "numeric", max, min: 1 } }}
          sx={{ width: 100 }}
          type="number"
          value={value}
        />
      </Stack>
      <Typography color="text.secondary" variant="body2">
        {tQuant("futures.leverageMax", { max: maxLeverage })}
      </Typography>
      <Alert severity="warning">{tQuant("futures.leverageWarning")}</Alert>
    </FormBox>
  );
};

interface MarginModeDialogProps {
  marginMode: QuantMarginMode;
  onSaved: () => void;
  symbol: string;
  url: string;
}

export const MarginModeDialog = ({
  marginMode,
  onSaved,
  symbol,
  url,
}: MarginModeDialogProps) => {
  const tQuant = useTranslations("quant");
  const submit = useSubmit(url, onSaved);
  const [value, setValue] = useState(marginMode);

  const onSubmit = (event: BaseSyntheticEvent) => {
    event.preventDefault();
    void submit({ marginMode: value, symbol } satisfies SetMarginModeDto);
  };

  return (
    <FormBox id={FUTURES_SETTINGS_FORM_ID} noValidate onSubmit={onSubmit}>
      <ToggleButtonGroup
        exclusive
        fullWidth
        onChange={(_, next: QuantMarginMode | null) => next && setValue(next)}
        value={value}
      >
        {quantMarginModeValues.map((mode) => (
          <ToggleButton key={mode} value={mode}>
            {tQuant(`futures.marginModes.${mode}`)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <Typography color="text.secondary" variant="body2">
        {tQuant(`futures.marginModeDescriptions.${value}`)}
      </Typography>
    </FormBox>
  );
};

interface PositionModeDialogProps {
  onSaved: () => void;
  positionMode: QuantPositionMode;
  url: string;
}

export const PositionModeDialog = ({
  onSaved,
  positionMode,
  url,
}: PositionModeDialogProps) => {
  const tQuant = useTranslations("quant");
  const submit = useSubmit(url, onSaved);
  const [value, setValue] = useState(positionMode);

  const onSubmit = (event: BaseSyntheticEvent) => {
    event.preventDefault();
    void submit({ positionMode: value } satisfies SetPositionModeDto);
  };

  return (
    <FormBox id={FUTURES_SETTINGS_FORM_ID} noValidate onSubmit={onSubmit}>
      <ToggleButtonGroup
        exclusive
        fullWidth
        onChange={(_, next: QuantPositionMode | null) => next && setValue(next)}
        value={value}
      >
        {quantPositionModeValues.map((mode) => (
          <ToggleButton key={mode} value={mode}>
            {tQuant(`futures.positionModes.${mode}`)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <Typography color="text.secondary" variant="body2">
        {tQuant(`futures.positionModeDescriptions.${value}`)}
      </Typography>
      <Alert severity="warning">{tQuant("futures.positionModeWarning")}</Alert>
    </FormBox>
  );
};
