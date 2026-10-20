"use client";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import useSWR from "swr";

import { CopyField } from "../../bots/WebhookSetup";

import { Terminal } from "@mui/icons-material";
import {
  Alert,
  Button,
  Chip,
  DialogContentText,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { QuantAgentToken, QuantAgentTokenCreated } from "@/types/quant";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

const AGENT_TOKEN_URL = "/api/quant/agent-token";

const TokenCreated = ({ token }: { token: string }) => {
  const tAgent = useTranslations("quant.settings.agent");

  return (
    <Stack sx={{ gap: 2 }}>
      <Alert severity="warning">{tAgent("tokenOnce")}</Alert>
      <CopyField label={tAgent("token")} value={token} />
      <Typography variant="body2">{tAgent("setup.test")}</Typography>
      <CopyField
        label={tAgent("setup.testCommand")}
        value={`cd biru-api && QUANT_AGENT_TOKEN=${token} node scripts/quant-claude-agent.mjs`}
      />
      <Typography variant="body2">{tAgent("setup.schedule")}</Typography>
      <Typography color="text.secondary" variant="caption">
        {tAgent("setup.safety")}
      </Typography>
    </Stack>
  );
};

const AgentTokenSettings = () => {
  const tAgent = useTranslations("quant.settings.agent");
  const format = useFormatter();
  const setDialog = useDialogStore((state) => state.setDialog);

  const {
    data: agentToken,
    isLoading,
    mutate,
  } = useSWR<QuantAgentToken>(AGENT_TOKEN_URL, fetcher);

  const create = () =>
    fetcher<QuantAgentTokenCreated>(AGENT_TOKEN_URL, { method: "POST" });

  const showToken = (created: QuantAgentTokenCreated) => {
    void mutate(created, { revalidate: false });
    setDialog({
      content: <TokenCreated token={created.token} />,
      open: true,
      showCancel: false,
      title: tAgent("created"),
    });
  };

  const handleGenerate = () => {
    if (!agentToken?.configured)
      return void create()
        .then(showToken)
        .catch((error: unknown) =>
          enqueueSnackbar(getErrorMessage(error), { variant: "error" }),
        );

    let created: QuantAgentTokenCreated | undefined;
    setDialog({
      content: (
        <DialogContentText>{tAgent("regenerate.confirm")}</DialogContentText>
      ),
      onConfirm: async () => {
        created = await create();
      },
      // 確認視窗關閉後才能開新視窗，否則新 token 一出現就被關掉
      onExited: () => {
        if (created) showToken(created);
      },
      open: true,
      title: tAgent("regenerate.title"),
    });
  };

  const handleRemove = () =>
    setDialog({
      content: (
        <DialogContentText>{tAgent("remove.confirm")}</DialogContentText>
      ),
      onConfirm: async () => {
        try {
          await fetcher(AGENT_TOKEN_URL, { method: "DELETE" });
          enqueueSnackbar(tAgent("remove.success"), { variant: "success" });
        } catch (error) {
          enqueueSnackbar(getErrorMessage(error), { variant: "error" });
        } finally {
          void mutate();
        }
      },
      open: true,
      title: tAgent("remove.title"),
    });

  if (isLoading) return <Skeleton height={30} variant="rounded" width={180} />;

  return agentToken?.configured ? (
    <Tooltip title={tAgent("regenerate.title")}>
      <Chip
        icon={<Terminal />}
        label={tAgent("bound", {
          last4: agentToken.tokenLast4 ?? "",
          lastUsed: agentToken.lastUsedAt
            ? format.dateTime(new Date(agentToken.lastUsedAt), "dateTime")
            : tAgent("neverUsed"),
        })}
        onClick={handleGenerate}
        onDelete={handleRemove}
        variant="outlined"
      />
    </Tooltip>
  ) : (
    <Button
      onClick={handleGenerate}
      size="small"
      startIcon={<Terminal />}
      variant="outlined"
    >
      {tAgent("bind")}
    </Button>
  );
};

export default AgentTokenSettings;
