"use client";

import { useState } from "react";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useSWRConfig } from "swr";

import {
  QUANT_BOTS_URL,
  isQuantBotKey,
  pnlColor,
  useBotLabels,
  useBotStream,
  useQuantBots,
} from "../useQuantBots";

import DataGrid from "@/components/DataGrid";

import { DATA_GRID_PROPS } from "@/constants/dataGrid";
import { quantPairOf } from "@/constants/quant";

import { Link, useRouter } from "@/i18n/navigation";

import {
  Add,
  Archive,
  ContentCopy,
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
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { quantBotTypeValues } from "@/types/api";
import type { QuantBot } from "@/types/quant";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

const ActionsStack = styled(Stack)({ alignItems: "center", height: "100%" });

const STATUS_COLORS = {
  error: "error",
  running: "success",
  stopped: "default",
} as const;

const BotList = () => {
  const tBots = useTranslations("quant.bots");
  const format = useFormatter();
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const setDialog = useDialogStore((state) => state.setDialog);
  const labels = useBotLabels();

  useBotStream();
  const { data: bots, isLoading } = useQuantBots();

  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const running = bots?.filter(({ status }) => status === "running") ?? [];
  const formatQuote = (value: number) =>
    format.number(value, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
      signDisplay: "negative",
    });

  const request = async (url: string, success: string) => {
    try {
      await fetcher(url, { method: "POST" });
      enqueueSnackbar(success, { variant: "success" });
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
    } finally {
      void mutate(isQuantBotKey);
    }
  };

  const confirm = (action: "archive" | "stop", { id, name }: QuantBot) =>
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
    });

  const handleStopAll = () =>
    setDialog({
      content: (
        <DialogContentText>
          {tBots("actions.stopAll.confirm", { count: running.length })}
        </DialogContentText>
      ),
      onConfirm: () =>
        request(`${QUANT_BOTS_URL}/stop-all`, tBots("actions.stopAll.success")),
      open: true,
      title: tBots("actions.stopAll.title"),
    });

  const columns: GridColDef[] = [
    {
      field: "actions",
      filterable: false,
      headerName: tBots("columns.actions"),
      minWidth: 140,
      renderCell: ({ row }: GridRenderCellParams<QuantBot>) => (
        <ActionsStack direction="row">
          {!row.startedAt && (
            <Tooltip title={tBots("actions.start.label")}>
              <IconButton
                color="success"
                onClick={() =>
                  request(
                    `${QUANT_BOTS_URL}/${row.id}/start`,
                    tBots("actions.start.success"),
                  )
                }
                size="small"
              >
                <PlayArrow fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {row.status === "running" && (
            <Tooltip title={tBots("actions.stop.label")}>
              <IconButton
                color="error"
                onClick={() => confirm("stop", row)}
                size="small"
              >
                <Stop fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={tBots("actions.duplicate")}>
            <IconButton
              onClick={() => router.push(`/quant/bots/new?from=${row.id}`)}
              size="small"
            >
              <ContentCopy fontSize="small" />
            </IconButton>
          </Tooltip>
          {row.status !== "running" && (
            <Tooltip title={tBots("actions.archive.label")}>
              <IconButton onClick={() => confirm("archive", row)} size="small">
                <Archive fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </ActionsStack>
      ),
      sortable: false,
    },
    {
      field: "name",
      headerName: tBots("columns.name"),
      minWidth: 160,
      renderCell: ({ row }: GridRenderCellParams<QuantBot>) => (
        <Link href={`/quant/bots/${row.id}`}>{row.name}</Link>
      ),
    },
    {
      field: "type",
      headerName: tBots("columns.type"),
      minWidth: 120,
      valueFormatter: (value: QuantBot["type"]) => tBots(`types.${value}`),
    },
    {
      field: "symbol",
      headerName: tBots("columns.symbol"),
      valueFormatter: (value: string) => quantPairOf(value),
    },
    {
      field: "mode",
      headerName: tBots("columns.mode"),
      renderCell: ({ row }: GridRenderCellParams<QuantBot>) => (
        <Chip
          color={row.mode === "live" ? "warning" : "default"}
          label={tBots(`modes.${row.mode}`)}
          size="small"
        />
      ),
    },
    {
      field: "status",
      headerName: tBots("columns.status"),
      renderCell: ({ row }: GridRenderCellParams<QuantBot>) => (
        <Tooltip title={labels.reason(row.statusReason) ?? ""}>
          <Chip
            color={STATUS_COLORS[row.status]}
            label={labels.status(row)}
            size="small"
          />
        </Tooltip>
      ),
    },
    {
      field: "investment",
      headerName: tBots("columns.investment"),
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
      sortComparator: (a, b) => a - b,
      valueGetter: (_, row: QuantBot) => row.summary.pnl,
    },
    {
      field: "realizedPnl",
      headerName: tBots("columns.realizedPnl"),
      valueFormatter: (value: number) => formatQuote(value),
      valueGetter: (_, row: QuantBot) => row.summary.realizedPnl,
    },
    {
      field: "startedAt",
      headerName: tBots("columns.startedAt"),
      minWidth: 160,
      valueFormatter: (value?: string) =>
        value ? format.dateTime(new Date(value), "dateTime") : "—",
    },
  ];

  return (
    <Stack sx={{ gap: 2 }}>
      <Stack sx={{ flexDirection: "row", gap: 1 }}>
        <Button
          onClick={(event) => setMenuAnchor(event.currentTarget)}
          size="small"
          startIcon={<Add />}
          variant="contained"
        >
          {tBots("new.label")}
        </Button>
        <Button
          color="error"
          disabled={!running.length}
          onClick={handleStopAll}
          size="small"
          startIcon={<StopCircle />}
          variant="outlined"
        >
          {tBots("actions.stopAll.label")}
        </Button>
      </Stack>
      <Menu
        anchorEl={menuAnchor}
        onClose={() => setMenuAnchor(null)}
        open={!!menuAnchor}
      >
        {quantBotTypeValues.map((type) => (
          <MenuItem
            component={Link}
            href={`/quant/bots/new?type=${type}`}
            key={type}
            onClick={() => setMenuAnchor(null)}
            sx={{ maxWidth: 360, whiteSpace: "normal" }}
          >
            <ListItemText
              primary={tBots(`types.${type}`)}
              secondary={tBots(`typeDescriptions.${type}`)}
            />
          </MenuItem>
        ))}
      </Menu>
      <DataGrid
        {...DATA_GRID_PROPS}
        columns={columns}
        loading={isLoading}
        rows={bots ?? []}
        showToolbar={false}
      />
    </Stack>
  );
};

export default BotList;
