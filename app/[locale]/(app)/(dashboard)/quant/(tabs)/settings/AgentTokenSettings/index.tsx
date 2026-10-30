"use client";

import { useEffect, useRef } from "react";

import { useSearchParams } from "next/navigation";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import useSWR from "swr";

import { CopyField } from "../../bots/WebhookSetup";

import { Terminal } from "@mui/icons-material";
import {
  Button,
  Chip,
  DialogContentText,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import { usePathname, useRouter } from "@/i18n/navigation";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { QuantAgentToken } from "@/types/quant";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

const AGENT_TOKEN_URL = "/api/quant/agent-token";

const AgentSetup = () => {
  const tAgent = useTranslations("quant.settings.agent");

  return (
    <Stack sx={{ gap: 2 }}>
      <Typography variant="body2">{tAgent("setup.start")}</Typography>
      <CopyField
        label={tAgent("setup.startCommand")}
        value="cd biru-api && node scripts/quant-claude-agent.mjs --watch"
      />
      <Typography variant="body2">{tAgent("setup.connect")}</Typography>
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

  // 本機代理沒有可用的 token 時會開瀏覽器帶 ?agentCode= 到這頁，等使用者核准
  const agentCode = useSearchParams().get("agentCode");
  const router = useRouter();
  const pathname = usePathname();
  const handledCode = useRef<string | null>(null);
  useEffect(() => {
    if (!agentCode || handledCode.current === agentCode) return;
    handledCode.current = agentCode;

    setDialog({
      content: (
        <DialogContentText>
          {tAgent("approve.confirm", { code: agentCode })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        await fetcher(`${AGENT_TOKEN_URL}/approve`, {
          body: JSON.stringify({ code: agentCode }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        enqueueSnackbar(tAgent("approve.success"), { variant: "success" });
        void mutate();
      },
      onExited: () => router.replace(pathname),
      open: true,
      title: tAgent("approve.title"),
    });
  }, [agentCode, mutate, pathname, router, setDialog, tAgent]);

  const showSetup = () =>
    setDialog({
      content: <AgentSetup />,
      open: true,
      showCancel: false,
      title: tAgent("setup.title"),
    });

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

  if (agentToken?.claudeCodeLocal)
    return (
      <Tooltip title={tAgent("local.description")}>
        <Chip
          icon={<Terminal />}
          label={tAgent("local.label")}
          variant="outlined"
        />
      </Tooltip>
    );

  return agentToken?.configured ? (
    <Tooltip title={tAgent("setup.title")}>
      <Chip
        icon={<Terminal />}
        label={tAgent("bound", {
          last4: agentToken.tokenLast4 ?? "",
          lastUsed: agentToken.lastUsedAt
            ? format.dateTime(new Date(agentToken.lastUsedAt), "dateTime")
            : tAgent("neverUsed"),
        })}
        onClick={showSetup}
        onDelete={handleRemove}
        variant="outlined"
      />
    </Tooltip>
  ) : (
    <Button
      onClick={showSetup}
      size="small"
      startIcon={<Terminal />}
      variant="outlined"
    >
      {tAgent("bind")}
    </Button>
  );
};

export default AgentTokenSettings;
