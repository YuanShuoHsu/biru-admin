"use client";

import { useCallback, useMemo, useState } from "react";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import useSWR, { useSWRConfig } from "swr";

import { useBotFormDialog } from "../BotForm";
import {
  QUANT_BOTS_URL,
  isQuantBotKey,
  pnlColor,
  useBotLabels,
  useBotStream,
} from "../useQuantBots";

import DataGrid from "@/components/DataGrid";
import { renderEmptyableCell } from "@/components/EmptyCell";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import { getPageSizeOptions } from "@/constants/pagination";
import { quantPairOf } from "@/constants/quant";

import {
  useDateFilterOperators,
  useEnumFilterOperators,
  useNumberFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

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
import type {
  GridColDef,
  GridFilterModel,
  GridPaginationModel,
  GridRenderCellParams,
  GridSortModel,
} from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type {
  QuantBot,
  QuantBotFilterField,
  QuantBotSortField,
} from "@/types/quant";

import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { getQuantBotEnumOptions } from "@/utils/enumOptions";
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
  gap: theme.spacing(2),
}));

const STATUS_COLORS = {
  error: "error",
  running: "success",
  stopped: "default",
} as const;

// 「全部停止」要算所有頁的執行中機器人，不能只看目前這一頁
const RUNNING_COUNT_URL = `${QUANT_BOTS_URL}?filterField=status&filterOperator=is&filterValue=running&limit=1`;

interface BotListProps {
  filterField?: QuantBotFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  rowCount: number;
  rows: QuantBot[];
  sortBy?: QuantBotSortField;
  sortDirection?: SortDirection;
}

const BotList = ({
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  page,
  pageSize,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount,
  rows: initialRows,
  sortBy,
  sortDirection,
}: BotListProps) => {
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: page - 1,
    pageSize,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>(
    sortBy && sortDirection ? [{ field: sortBy, sort: sortDirection }] : [],
  );
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items:
      initialFilterField &&
      initialFilterOperator &&
      (initialFilterValue ||
        NO_VALUE_FILTER_OPERATORS.includes(initialFilterOperator))
        ? [
            {
              field: initialFilterField,
              operator: initialFilterOperator,
              value:
                initialFilterOperator === "isAnyOf"
                  ? initialFilterValue?.split(",")
                  : initialFilterValue,
            },
          ]
        : [],
    quickFilterValues: initialQuickFilterValue ? [initialQuickFilterValue] : [],
  });

  const tBots = useTranslations("quant.bots");
  const format = useFormatter();
  const router = useRouter();
  const apiRef = useGridApiRef();
  const { mutate } = useSWRConfig();
  const setDialog = useDialogStore((state) => state.setDialog);
  const labels = useBotLabels();
  const openBotForm = useBotFormDialog();

  const stringFilterOperators = useStringFilterOperators();
  const enumFilterOperators = useEnumFilterOperators();
  const dateFilterOperators = useDateFilterOperators();
  const numberFilterOperators = useNumberFilterOperators();

  const updateQuery = useUpdateQuery();

  const enumOptions = useMemo(() => getQuantBotEnumOptions(tBots), [tBots]);

  useBotStream();
  const {
    data: { data: rows, total: rowCount } = {
      data: initialRows,
      total: initialRowCount,
    },
    isLoading: loading,
  } = useSWR(
    [
      QUANT_BOTS_URL,
      filterModel.items[0]?.field,
      filterModel.items[0]?.operator,
      filterModel.items[0]?.value,
      filterModel.quickFilterValues,
      paginationModel.page,
      paginationModel.pageSize,
      sortModel,
    ],
    async ([url]) =>
      fetcher<{ data: QuantBot[]; total: number }>(
        `${url}?${getDataGridSearchParams(
          paginationModel,
          filterModel,
          sortModel,
          enumOptions,
        )}`,
      ),
    {
      fallbackData: { data: initialRows, total: initialRowCount },
      onSuccess: () => {
        setTimeout(() => {
          apiRef.current?.autosizeColumns(autosizeOptions);
        }, 0);
      },
    },
  );
  const { data: { total: runningCount } = { total: 0 } } = useSWR<{
    total: number;
  }>(RUNNING_COUNT_URL, fetcher);

  const handlePaginationModelChange = useCallback(
    (newModel: GridPaginationModel) => {
      setPaginationModel(newModel);

      updateQuery({
        page: String(newModel.page + 1),
        pageSize: String(newModel.pageSize),
      });
    },
    [updateQuery],
  );

  const handleSortModelChange = useCallback(
    (newModel: GridSortModel) => {
      setSortModel(newModel);
      setPaginationModel((previous) => ({ ...previous, page: 0 }));

      updateQuery({
        page: "1",
        sortBy: newModel[0]?.field ?? "",
        sortDirection: newModel[0]?.sort ?? "",
      });
    },
    [updateQuery],
  );

  const handleFilterModelChange = useCallback(
    (newModel: GridFilterModel) => {
      setFilterModel(newModel);
      setPaginationModel((previous) => ({ ...previous, page: 0 }));

      const {
        filterField = "",
        filterOperator = "",
        filterValue = "",
      } = getFilterItemParams(newModel.items[0]);

      updateQuery({
        filterField,
        filterOperator,
        filterValue,
        page: "1",
        quickFilterValue: (newModel.quickFilterValues ?? []).join(" ").trim(),
      });
    },
    [updateQuery],
  );

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
      {
        field: "name",
        filterOperators: stringFilterOperators,
        headerName: tBots("columns.name"),
      },
      {
        field: "type",
        filterOperators: enumFilterOperators,
        headerName: tBots("columns.type"),
        type: "singleSelect",
        valueOptions: enumOptions.type,
      },
      {
        field: "symbol",
        filterOperators: stringFilterOperators,
        headerName: tBots("columns.symbol"),
        valueGetter: (value: string) => quantPairOf(value),
      },
      {
        field: "mode",
        filterOperators: enumFilterOperators,
        headerName: tBots("columns.mode"),
        renderCell: ({ row }: GridRenderCellParams<QuantBot>) => (
          <Chip
            color={row.mode === "live" ? "warning" : "default"}
            label={tBots(`modes.${row.mode}`)}
            size="small"
            variant="outlined"
          />
        ),
        type: "singleSelect",
        valueOptions: enumOptions.mode,
      },
      {
        field: "status",
        filterOperators: enumFilterOperators,
        headerName: tBots("columns.status"),
        renderCell: ({ row }: GridRenderCellParams<QuantBot>) => (
          <Tooltip title={labels.reason(row.statusReason) ?? ""}>
            <Chip
              color={STATUS_COLORS[row.status]}
              label={labels.status(row)}
              size="small"
              variant="outlined"
            />
          </Tooltip>
        ),
        type: "singleSelect",
        valueGetter: (_, row: QuantBot) =>
          row.startedAt ? row.status : "notStarted",
        valueOptions: enumOptions.status,
      },
      {
        field: "investment",
        filterOperators: numberFilterOperators,
        headerName: tBots("columns.investment"),
        type: "number",
        valueFormatter: (value: number) => formatQuote(value),
      },
      {
        field: "pnl",
        filterable: false,
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
        sortable: false,
        type: "number",
        valueGetter: (_, row: QuantBot) => row.summary.pnl,
      },
      {
        field: "realizedPnl",
        filterable: false,
        headerName: tBots("columns.realizedPnl"),
        sortable: false,
        type: "number",
        valueFormatter: (value: number) => formatQuote(value),
        valueGetter: (_, row: QuantBot) => row.summary.realizedPnl,
      },
      {
        field: "startedAt",
        filterOperators: dateFilterOperators,
        headerName: tBots("columns.startedAt"),
        renderCell: renderEmptyableCell,
        valueFormatter: (value?: string) =>
          value ? format.dateTime(new Date(value), "short") : "",
      },
    ],
    [
      confirm,
      dateFilterOperators,
      enumFilterOperators,
      enumOptions,
      format,
      formatQuote,
      labels,
      numberFilterOperators,
      openBotForm,
      request,
      router,
      stringFilterOperators,
      tBots,
    ],
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
        filterMode="server"
        filterModel={filterModel}
        loading={loading}
        onFilterModelChange={handleFilterModelChange}
        onPaginationModelChange={handlePaginationModelChange}
        onSortModelChange={handleSortModelChange}
        pageSizeOptions={getPageSizeOptions(paginationModel.pageSize)}
        paginationMode="server"
        paginationModel={paginationModel}
        rowCount={rowCount}
        rows={rows}
        sortingMode="server"
        sortModel={sortModel}
      />
    </>
  );
};

export default BotList;
