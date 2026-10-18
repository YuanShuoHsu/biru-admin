"use client";

import { useCallback, useMemo } from "react";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useSWRConfig } from "swr";

import { useBotFormDialog } from "../BotForm";
import {
  QUANT_BOTS_URL,
  isQuantBotKey,
  pnlColor,
  useBotLabels,
  useBotStream,
  useQuantBots,
} from "../useQuantBots";

import DataGrid from "@/components/DataGrid";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";
import { quantPairOf } from "@/constants/quant";

import { useRouter } from "@/i18n/navigation";

import {
  Add,
  Archive,
  ContentCopy,
  Insights,
  PlayArrow,
  Stop,
  StopCircle,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  DialogContentText,
  IconButton,
  Stack,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { QuantBot } from "@/types/quant";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

const ActionsStack = styled(Stack)(({ theme }) => ({
  height: "100%",
  alignItems: "center",
  gap: theme.spacing(1),
}));

const StyledIconButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== "visible",
})<{ visible: boolean }>(({ visible }) => ({
  visibility: visible ? "visible" : "hidden",
}));

const ToolbarStack = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  alignItems: "center",
  gap: theme.spacing(1),
}));

const STATUS_COLORS = {
  error: "error",
  running: "success",
  stopped: "default",
} as const;

const BotList = () => {
  const tBots = useTranslations("quant.bots");
  const format = useFormatter();
  const router = useRouter();
  const apiRef = useGridApiRef();
  const { mutate } = useSWRConfig();
  const setDialog = useDialogStore((state) => state.setDialog);
  const labels = useBotLabels();
  const openBotForm = useBotFormDialog();

  useBotStream();
  const { data: bots, isLoading } = useQuantBots({
    onSuccess: () => {
      setTimeout(() => {
        apiRef.current?.autosizeColumns(autosizeOptions);
      }, 0);
    },
  });

  const runningCount =
    bots?.filter(({ status }) => status === "running").length ?? 0;

  const formatQuote = useCallback(
    (value: number) =>
      format.number(value, {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
        signDisplay: "negative",
      }),
    [format],
  );

  const request = useCallback(
    async (url: string, success: string) => {
      try {
        await fetcher(url, { method: "POST" });
        enqueueSnackbar(success, { variant: "success" });
      } catch (error) {
        enqueueSnackbar(getErrorMessage(error), { variant: "error" });
      } finally {
        void mutate(isQuantBotKey);
      }
    },
    [mutate],
  );

  const confirm = useCallback(
    (action: "archive" | "stop", { id, name }: QuantBot) =>
      setDialog({
        content: (
          <DialogContentText>
            {tBots.rich(`actions.${action}.confirm`, {
              bold: (chunks) => <strong>{chunks}</strong>,
              name,
            })}
          </DialogContentText>
        ),
        onConfirm: () =>
          request(
            `${QUANT_BOTS_URL}/${id}/${action}`,
            tBots(`actions.${action}.success`),
          ),
        open: true,
        title: tBots(`actions.${action}.title`),
      }),
    [request, setDialog, tBots],
  );

  const handleStopAll = () =>
    setDialog({
      content: (
        <DialogContentText>
          {tBots("actions.stopAll.confirm", { count: runningCount })}
        </DialogContentText>
      ),
      onConfirm: () =>
        request(`${QUANT_BOTS_URL}/stop-all`, tBots("actions.stopAll.success")),
      open: true,
      title: tBots("actions.stopAll.title"),
    });

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        disableColumnMenu: true,
        disableExport: true,
        field: "actions",
        filterable: false,
        headerName: tBots("columns.actions"),
        renderCell: ({ row }: GridRenderCellParams<QuantBot>) => (
          <ActionsStack direction="row">
            <Tooltip title={tBots("actions.view")}>
              <IconButton
                onClick={(event) => {
                  event.stopPropagation();

                  router.push(`/quant/bots/${row.id}`);
                }}
                size="small"
              >
                <Insights fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={tBots("actions.start.label")}>
              <StyledIconButton
                color="success"
                onClick={(event) => {
                  event.stopPropagation();

                  void request(
                    `${QUANT_BOTS_URL}/${row.id}/start`,
                    tBots("actions.start.success"),
                  );
                }}
                size="small"
                visible={!row.startedAt}
              >
                <PlayArrow fontSize="small" />
              </StyledIconButton>
            </Tooltip>
            <Tooltip title={tBots("actions.stop.label")}>
              <StyledIconButton
                color="error"
                onClick={(event) => {
                  event.stopPropagation();

                  confirm("stop", row);
                }}
                size="small"
                visible={row.status === "running"}
              >
                <Stop fontSize="small" />
              </StyledIconButton>
            </Tooltip>
            <Tooltip title={tBots("actions.duplicate")}>
              <IconButton
                onClick={(event) => {
                  event.stopPropagation();

                  openBotForm({ fromId: row.id });
                }}
                size="small"
              >
                <ContentCopy fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={tBots("actions.archive.label")}>
              <StyledIconButton
                onClick={(event) => {
                  event.stopPropagation();

                  confirm("archive", row);
                }}
                size="small"
                visible={row.status !== "running"}
              >
                <Archive fontSize="small" />
              </StyledIconButton>
            </Tooltip>
          </ActionsStack>
        ),
        resizable: false,
        sortable: false,
      },
      { field: "name", headerName: tBots("columns.name") },
      {
        field: "type",
        headerName: tBots("columns.type"),
        valueGetter: (value: QuantBot["type"]) => tBots(`types.${value}`),
      },
      {
        field: "symbol",
        headerName: tBots("columns.symbol"),
        valueGetter: (value: string) => quantPairOf(value),
      },
      {
        field: "mode",
        headerName: tBots("columns.mode"),
        renderCell: ({
          row,
          value,
        }: GridRenderCellParams<QuantBot, string>) => (
          <Chip
            color={row.mode === "live" ? "warning" : "default"}
            label={value}
            size="small"
          />
        ),
        valueGetter: (value: QuantBot["mode"]) => tBots(`modes.${value}`),
      },
      {
        field: "status",
        headerName: tBots("columns.status"),
        renderCell: ({
          row,
          value,
        }: GridRenderCellParams<QuantBot, string>) => (
          <Tooltip title={labels.reason(row.statusReason) ?? ""}>
            <Chip
              color={STATUS_COLORS[row.status]}
              label={value}
              size="small"
            />
          </Tooltip>
        ),
        valueGetter: (_, row: QuantBot) => labels.status(row),
      },
      {
        field: "investment",
        headerName: tBots("columns.investment"),
        type: "number",
        valueFormatter: (value: number) => formatQuote(value),
      },
      {
        field: "pnl",
        headerName: tBots("columns.pnl"),
        renderCell: ({ row }: GridRenderCellParams<QuantBot>) => (
          <Box component="span" sx={{ color: pnlColor(row.summary.pnl) }}>
            {formatQuote(row.summary.pnl)} (
            {format.number(row.summary.pnl / row.investment, {
              maximumFractionDigits: 2,
              signDisplay: "exceptZero",
              style: "percent",
            })}
            )
          </Box>
        ),
        type: "number",
        valueGetter: (_, row: QuantBot) => row.summary.pnl,
      },
      {
        field: "realizedPnl",
        headerName: tBots("columns.realizedPnl"),
        type: "number",
        valueFormatter: (value: number) => formatQuote(value),
        valueGetter: (_, row: QuantBot) => row.summary.realizedPnl,
      },
      {
        field: "startedAt",
        headerName: tBots("columns.startedAt"),
        valueFormatter: (value?: string) =>
          value ? format.dateTime(new Date(value), "short") : "—",
      },
    ],
    [confirm, format, formatQuote, labels, openBotForm, request, router, tBots],
  );

  return (
    <>
      <ToolbarStack direction="row">
        <Button
          onClick={() => openBotForm({})}
          size="small"
          startIcon={<Add />}
          variant="contained"
        >
          {tBots("new.label")}
        </Button>
        <Button
          color="error"
          disabled={!runningCount}
          onClick={handleStopAll}
          size="small"
          startIcon={<StopCircle />}
          variant="outlined"
        >
          {tBots("actions.stopAll.label")}
        </Button>
      </ToolbarStack>
      <DataGrid
        {...DATA_GRID_PROPS}
        apiRef={apiRef}
        columns={columns}
        loading={isLoading}
        rows={bots ?? []}
      />
    </>
  );
};

export default BotList;
