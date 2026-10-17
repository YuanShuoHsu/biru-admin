"use client";

import { type BaseSyntheticEvent, useState } from "react";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import useSWR from "swr";

import FormBox from "@/components/FormBox";

import { LinkOff, Psychology } from "@mui/icons-material";
import {
  Alert,
  Button,
  DialogContentText,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
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
      <Alert severity="info">{tAi("hint")}</Alert>
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

  return (
    <Paper sx={{ display: "flex", flexDirection: "column", gap: 1.5, p: 2 }}>
      <Typography variant="h6">{tAi("title")}</Typography>
      <Typography color="text.secondary" variant="body2">
        {tAi("description")}
      </Typography>
      {isLoading ? (
        <Skeleton height={36} variant="rounded" />
      ) : (
        <Stack
          sx={{
            alignItems: "center",
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Typography variant="body2">
            {aiKey?.configured && aiKey.createdAt
              ? tAi("bound", {
                  date: format.dateTime(new Date(aiKey.createdAt), "dateTime"),
                  last4: aiKey.apiKeyLast4 ?? "",
                })
              : tAi("notBound")}
          </Typography>
          <Button
            onClick={handleSet}
            size="small"
            startIcon={<Psychology />}
            variant={aiKey?.configured ? "outlined" : "contained"}
          >
            {tAi(aiKey?.configured ? "replace" : "bind")}
          </Button>
          {aiKey?.configured && (
            <Button
              color="error"
              onClick={handleRemove}
              size="small"
              startIcon={<LinkOff />}
            >
              {tAi("remove.label")}
            </Button>
          )}
        </Stack>
      )}
    </Paper>
  );
};

export default AiKeySettings;
