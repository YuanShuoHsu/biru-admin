"use client";

import { type BaseSyntheticEvent, useState } from "react";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";

import FormBox from "@/components/FormBox";

import {
  InputAdornment,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { quantMarginDirectionValues } from "@/types/api";
import type { AdjustIsolatedMarginDto, QuantPosition } from "@/types/quant";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

export const ISOLATED_MARGIN_FORM_ID = "quant-isolated-margin-form";

const DECIMAL_PATTERN = /^\d+(\.\d+)?$/;

interface IsolatedMarginDialogProps {
  onSaved: () => void;
  position: QuantPosition;
  quote: string;
  url: string;
}

const IsolatedMarginDialog = ({
  onSaved,
  position,
  quote,
  url,
}: IsolatedMarginDialogProps) => {
  const tMargin = useTranslations("quant.futures.isolatedMargin");
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const [direction, setDirection] =
    useState<AdjustIsolatedMarginDto["direction"]>("IN");
  const [amount, setAmount] = useState("");
  const invalid = !DECIMAL_PATTERN.test(amount) || Number(amount) <= 0;

  const onSubmit = async (event: BaseSyntheticEvent) => {
    event.preventDefault();
    if (invalid || position.isolatedMode === "CROSS") return;

    setDialog({ confirmLoading: true });
    try {
      await fetcher(url, {
        body: JSON.stringify({
          amount,
          direction,
          isolatedMode: position.isolatedMode,
          symbol: position.symbol,
        } satisfies AdjustIsolatedMarginDto),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      enqueueSnackbar(tMargin("success"), { variant: "success" });
      closeDialog();
      onSaved();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
      setDialog({ confirmLoading: false });
    }
  };

  return (
    <FormBox id={ISOLATED_MARGIN_FORM_ID} noValidate onSubmit={onSubmit}>
      <ToggleButtonGroup
        exclusive
        fullWidth
        onChange={(_, value: AdjustIsolatedMarginDto["direction"] | null) =>
          value && setDirection(value)
        }
        value={direction}
      >
        {quantMarginDirectionValues.map((value) => (
          <ToggleButton key={value} value={value}>
            {tMargin(`directions.${value}`)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <TextField
        error={amount !== "" && invalid}
        helperText={tMargin(`helpers.${direction}`)}
        label={tMargin("amount")}
        onChange={(event) => setAmount(event.target.value)}
        slotProps={{
          htmlInput: { inputMode: "decimal" },
          input: {
            endAdornment: (
              <InputAdornment position="end">{quote}</InputAdornment>
            ),
          },
        }}
        value={amount}
      />
    </FormBox>
  );
};

export default IsolatedMarginDialog;
