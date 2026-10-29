"use client";

import { useState } from "react";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useSWRConfig } from "swr";

import { QUANT_BOTS_URL, isQuantBotKey } from "../../useQuantBots";
import { CopyField } from "../../WebhookSetup";

import {
  CustomizedDialogActions,
  CustomizedDialogContent,
} from "@/components/CustomizedDialogs";

import { Visibility } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  DialogContentText,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { quantSignalActionValues } from "@/types/api";
import type { QuantBot, SendSignalDto, SignalSetup } from "@/types/quant";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

const DECIMAL_PATTERN = /^-?\d+(\.\d+)?$/;

const SignalPanel = ({ bot }: { bot: QuantBot }) => {
  const tSignal = useTranslations("quant.bots.signal");
  const { mutate } = useSWRConfig();
  const setDialog = useDialogStore((state) => state.setDialog);

  const [setup, setSetup] = useState<SignalSetup | null>(null);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<SendSignalDto["action"]>("buy");
  const [contracts, setContracts] = useState("");
  const [positionSize, setPositionSize] = useState("");

  const url = `${QUANT_BOTS_URL}/${bot.id}/signal`;

  const reveal = async () => {
    setLoading(true);
    try {
      setSetup(await fetcher<SignalSetup>(url));
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const valid =
    DECIMAL_PATTERN.test(contracts) &&
    Number(contracts) > 0 &&
    DECIMAL_PATTERN.test(positionSize);

  const send = () =>
    setDialog({
      content: (
        <>
          <CustomizedDialogContent>
            <DialogContentText>
              {tSignal("send.confirm", {
                action: tSignal(`actions.${action}`),
                contracts,
                positionSize,
              })}
            </DialogContentText>
          </CustomizedDialogContent>
          <CustomizedDialogActions />
        </>
      ),
      onConfirm: async () => {
        try {
          await fetcher(url, {
            body: JSON.stringify({
              action,
              contracts: Number(contracts),
              positionSize: Number(positionSize),
            } satisfies SendSignalDto),
            headers: { "Content-Type": "application/json" },
            method: "POST",
          });
          enqueueSnackbar(tSignal("send.success"), { variant: "success" });
        } catch (error) {
          enqueueSnackbar(getErrorMessage(error), { variant: "error" });
        } finally {
          void mutate(isQuantBotKey);
        }
      },
      open: true,
      title: tSignal("send.title"),
    });

  return (
    <Stack sx={{ gap: 2 }}>
      <Typography variant="h6">{tSignal("title")}</Typography>
      <Typography color="text.secondary" variant="body2">
        {tSignal("description")}
      </Typography>
      {setup ? (
        <>
          <Alert severity="warning">{tSignal("secret")}</Alert>
          <CopyField label={tSignal("webhookUrl")} value={setup.webhookUrl} />
          <CopyField label={tSignal("message")} value={setup.message} />
        </>
      ) : (
        <Box>
          <Button
            loading={loading}
            onClick={reveal}
            startIcon={<Visibility />}
            variant="outlined"
          >
            {tSignal("reveal")}
          </Button>
        </Box>
      )}
      {bot.status === "running" && (
        <>
          <Typography variant="subtitle2">{tSignal("send.label")}</Typography>
          <Grid container spacing={2}>
            <Grid size={{ sm: 3, xs: 12 }}>
              <TextField
                fullWidth
                label={tSignal("action")}
                onChange={(event) =>
                  setAction(event.target.value as SendSignalDto["action"])
                }
                select
                size="small"
                value={action}
              >
                {quantSignalActionValues.map((value) => (
                  <MenuItem key={value} value={value}>
                    {tSignal(`actions.${value}`)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ sm: 4, xs: 12 }}>
              <TextField
                fullWidth
                label={tSignal("contracts")}
                onChange={(event) => setContracts(event.target.value)}
                size="small"
                slotProps={{ htmlInput: { inputMode: "decimal" } }}
                value={contracts}
              />
            </Grid>
            <Grid size={{ sm: 5, xs: 12 }}>
              <TextField
                fullWidth
                helperText={tSignal("positionSizeHelper")}
                label={tSignal("positionSize")}
                onChange={(event) => setPositionSize(event.target.value)}
                size="small"
                slotProps={{ htmlInput: { inputMode: "decimal" } }}
                value={positionSize}
              />
            </Grid>
          </Grid>
          <Box>
            <Button
              color="warning"
              disabled={!valid}
              onClick={send}
              variant="contained"
            >
              {tSignal("send.submit")}
            </Button>
          </Box>
        </>
      )}
    </Stack>
  );
};

export default SignalPanel;
