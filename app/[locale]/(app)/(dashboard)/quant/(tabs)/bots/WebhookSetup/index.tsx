"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";

import { ContentCopy } from "@mui/icons-material";
import {
  Alert,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

const API_URL = process.env.NEXT_PUBLIC_NEST_URL;

export const webhookUrl = (botId: string) =>
  `${API_URL}/api/quant/webhooks/${botId}`;

// TradingView 的 {{timenow}} 每次觸發都不同，當作訊號 id 讓重送只執行一次
export const alertTemplate = (token: string) =>
  JSON.stringify({ action: "buy", id: "{{timenow}}", token });

export const CopyField = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => {
  const tWebhook = useTranslations("quant.bots.webhook");

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    enqueueSnackbar(tWebhook("copied"), { variant: "success" });
  };

  return (
    <TextField
      fullWidth
      label={label}
      multiline
      size="small"
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title={tWebhook("copy")}>
                <IconButton edge="end" onClick={copy} size="small">
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ),
          readOnly: true,
        },
      }}
      value={value}
    />
  );
};

interface WebhookSetupProps {
  botId: string;
  /** 只有剛建立或剛重新產生時才拿得到 token */
  token?: string;
}

const WebhookSetup = ({ botId, token }: WebhookSetupProps) => {
  const tWebhook = useTranslations("quant.bots.webhook");

  return (
    <Stack sx={{ gap: 2 }}>
      <CopyField label={tWebhook("url")} value={webhookUrl(botId)} />
      {token && (
        <>
          <Alert severity="warning">{tWebhook("tokenOnce")}</Alert>
          <CopyField
            label={tWebhook("template")}
            value={alertTemplate(token)}
          />
          <Typography color="text.secondary" variant="caption">
            {tWebhook("actionsHint")}
          </Typography>
        </>
      )}
    </Stack>
  );
};

export default WebhookSetup;
