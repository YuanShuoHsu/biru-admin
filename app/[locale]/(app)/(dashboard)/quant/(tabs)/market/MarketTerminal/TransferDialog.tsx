"use client";

import { type BaseSyntheticEvent, useState } from "react";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import useSWR from "swr";

import { quantAccountUrl } from "../../useQuantCredentials";
import { floorToPrecision } from "./TradePanel/definitions";

import FormBox from "@/components/FormBox";

import { SwapVert } from "@mui/icons-material";
import {
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  CreateQuantTransferDto,
  QuantBalance,
  QuantFuturesAccount,
  QuantTransferAccount,
} from "@/types/quant";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

export const TRANSFER_FORM_ID = "quant-transfer-form";

const DECIMAL_PATTERN = /^\d+(\.\d+)?$/;
const MAX_FRACTION_DIGITS = 8;

interface TransferDialogProps {
  credentialId: string;
  currency: string;
  onSaved: () => void;
}

const TransferDialog = ({
  credentialId,
  currency,
  onSaved,
}: TransferDialogProps) => {
  const tTransfer = useTranslations("quant.transfer");
  const format = useFormatter();
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const [fromAccount, setFromAccount] = useState<QuantTransferAccount>("MAIN");
  const [amount, setAmount] = useState("");

  const { data: spotBalances } = useSWR<QuantBalance[]>(
    quantAccountUrl(credentialId, "balances"),
    fetcher,
  );
  const { data: futuresAccount } = useSWR<QuantFuturesAccount>(
    quantAccountUrl(credentialId, "futures"),
    fetcher,
  );

  const available =
    fromAccount === "MAIN"
      ? spotBalances?.find(({ coin }) => coin === currency)?.free
      : futuresAccount?.balances.find(({ coin }) => coin === currency)
          ?.transferable;
  const toAccount: QuantTransferAccount =
    fromAccount === "MAIN" ? "TRADE" : "MAIN";

  const invalid =
    !DECIMAL_PATTERN.test(amount) ||
    Number(amount) <= 0 ||
    (available !== undefined && Number(amount) > available);

  const onSubmit = async (event: BaseSyntheticEvent) => {
    event.preventDefault();
    if (invalid) return;

    setDialog({ confirmLoading: true });
    try {
      await fetcher(quantAccountUrl(credentialId, "transfers"), {
        body: JSON.stringify({
          amount,
          currency,
          fromAccount,
        } satisfies CreateQuantTransferDto),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      enqueueSnackbar(tTransfer("success"), { variant: "success" });
      closeDialog();
      onSaved();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
      setDialog({ confirmLoading: false });
    }
  };

  return (
    <FormBox id={TRANSFER_FORM_ID} noValidate onSubmit={onSubmit}>
      <Stack sx={{ alignItems: "center", flexDirection: "row", gap: 1 }}>
        <Stack sx={{ flex: 1, gap: 1 }}>
          <TextField
            label={tTransfer("from")}
            slotProps={{ input: { readOnly: true } }}
            value={tTransfer(`accounts.${fromAccount}`)}
          />
          <TextField
            label={tTransfer("to")}
            slotProps={{ input: { readOnly: true } }}
            value={tTransfer(`accounts.${toAccount}`)}
          />
        </Stack>
        <Tooltip title={tTransfer("swap")}>
          <IconButton
            onClick={() => {
              setFromAccount(toAccount);
              setAmount("");
            }}
          >
            <SwapVert />
          </IconButton>
        </Tooltip>
      </Stack>
      <TextField
        error={amount !== "" && invalid}
        helperText={tTransfer("available", {
          amount:
            available === undefined
              ? "—"
              : format.number(available, {
                  maximumFractionDigits: MAX_FRACTION_DIGITS,
                }),
          currency,
        })}
        label={tTransfer("amount")}
        onChange={(event) => setAmount(event.target.value)}
        slotProps={{
          htmlInput: { inputMode: "decimal" },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <Typography color="text.secondary" variant="body2">
                  {currency}
                </Typography>
                <Button
                  disabled={!available}
                  onClick={() =>
                    setAmount(
                      floorToPrecision(available ?? 0, MAX_FRACTION_DIGITS),
                    )
                  }
                  size="small"
                >
                  {tTransfer("max")}
                </Button>
              </InputAdornment>
            ),
          },
        }}
        value={amount}
      />
    </FormBox>
  );
};

export default TransferDialog;
