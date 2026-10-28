"use client";

import { type BaseSyntheticEvent, useState } from "react";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import useSWR from "swr";

import ErrorAlert from "@/components/ErrorAlert";
import FormBox from "@/components/FormBox";

import { Psychology } from "@mui/icons-material";
import {
  Alert,
  Button,
  Chip,
  DialogContentText,
  Skeleton,
  TextField,
  Tooltip,
} from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { QuantAiKey, SetQuantAiKeyDto } from "@/types/quant";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

const AI_KEY_URL = "/api/quant/ai-key";
const AI_KEY_FORM_ID = "quant-ai-key-form";

const AiKeyDialog = ({ onSaved }: { onSaved: () => void }) => {
  const tAi = useTranslations("quant.settings.ai");
  const { closeDialog, setDialog } = useDialogStore((state) => state);
  const [apiKey, setApiKey] = useState("");

  const onSubmit = async (event: BaseSyntheticEvent) => {
    event.preventDefault();
    if (!apiKey.trim()) return;

    setDialog({ confirmLoading: true });
    try {
      await fetcher(AI_KEY_URL, {
        body: JSON.stringify({ apiKey } satisfies SetQuantAiKeyDto),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });
      enqueueSnackbar(tAi("success"), { variant: "success" });
      closeDialog();
      onSaved();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
      setDialog({ confirmLoading: false });
    }
  };

  return (
    <FormBox
      autoComplete="off"
      id={AI_KEY_FORM_ID}
      noValidate
      onSubmit={onSubmit}
    >
      <Alert severity="info">
        {tAi("description")}
        <br />
        {tAi("hint")}
      </Alert>
      <TextField
        fullWidth
        label={tAi("apiKey")}
        onChange={(event) => setApiKey(event.target.value)}
        required
        slotProps={{ htmlInput: { autoComplete: "new-password" } }}
        type="password"
        value={apiKey}
      />
    </FormBox>
  );
};

const AiKeySettings = () => {
  const tAi = useTranslations("quant.settings.ai");
  const format = useFormatter();
  const setDialog = useDialogStore((state) => state.setDialog);

  const {
    data: aiKey,
    error,
    isLoading,
    mutate,
  } = useSWR<QuantAiKey>(AI_KEY_URL, fetcher);

  const handleSet = () =>
    setDialog({
      content: <AiKeyDialog onSaved={() => void mutate()} />,
      formId: AI_KEY_FORM_ID,
      open: true,
      title: tAi(aiKey?.configured ? "replace" : "bind"),
    });

  const handleRemove = () =>
    setDialog({
      content: <DialogContentText>{tAi("remove.confirm")}</DialogContentText>,
      onConfirm: async () => {
        try {
          await fetcher(AI_KEY_URL, { method: "DELETE" });
          enqueueSnackbar(tAi("remove.success"), { variant: "success" });
        } catch (error) {
          enqueueSnackbar(getErrorMessage(error), { variant: "error" });
        } finally {
          void mutate();
        }
      },
      open: true,
      title: tAi("remove.title"),
    });

  if (isLoading) return <Skeleton height={30} variant="rounded" width={180} />;

  if (error) return <ErrorAlert onRetry={() => mutate()} />;

  return aiKey?.configured ? (
    <Tooltip title={tAi("replace")}>
      <Chip
        icon={<Psychology />}
        label={tAi("bound", {
          cost: format.number(aiKey.monthCost, {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2,
          }),
          last4: aiKey.apiKeyLast4 ?? "",
        })}
        onClick={handleSet}
        onDelete={handleRemove}
        variant="outlined"
      />
    </Tooltip>
  ) : (
    <Button
      onClick={handleSet}
      size="small"
      startIcon={<Psychology />}
      variant="outlined"
    >
      {tAi("bind")}
    </Button>
  );
};

export default AiKeySettings;
