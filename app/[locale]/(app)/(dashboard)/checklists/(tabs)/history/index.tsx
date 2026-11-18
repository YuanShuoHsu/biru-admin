"use client";

import type { Dayjs } from "dayjs";
import { useFormatter, useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import ChecklistRunItemContent from "../ChecklistRunItemContent";
import ChecklistRunStatusChip, {
  useChecklistRunStatusLabel,
} from "../ChecklistRunStatusChip";
import { type ChecklistRunFilters, getChecklistRunsUrl } from "./definitions";

import { toStoreDate } from "@/app/[locale]/(app)/(dashboard)/reports/definitions";

import DataGrid from "@/components/DataGrid";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";
import { getPageSizeOptions } from "@/constants/pagination";
import { STORE_TIMEZONE } from "@/constants/timezone";

import { useDataGridQueryState } from "@/hooks/useDataGridQueryState";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { ListAlt } from "@mui/icons-material";
import {
  IconButton,
  List,
  ListItem,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import type { PickerChangeHandlerContext } from "@mui/x-date-pickers/models";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  ChecklistRun,
  ChecklistRunListResponse,
  ChecklistTemplate,
} from "@/types/checklists";

import { fetcher } from "@/utils/fetcher";

const ToolbarStack = styled(Stack)(({ theme }) => ({
  alignItems: "center",
  flexWrap: "wrap",
  gap: theme.spacing(2),
}));

const TemplateTextField = styled(TextField)({
  minWidth: 160,
});

const toFilterDate = (date: string) => (date ? toStoreDate(date) : null);

interface ChecklistHistoryProps {
  filters: ChecklistRunFilters;
  organizationSlug: string;
  page: number;
  pageSize: number;
  rowCount: number;
  rows: ChecklistRun[];
  templates: ChecklistTemplate[];
}

const ChecklistHistory = ({
  filters: initialFilters,
  organizationSlug,
  page,
  pageSize,
  rowCount: initialRowCount,
  rows: initialRows,
  templates,
}: ChecklistHistoryProps) => {
  const [filters, setFilters] = useState(initialFilters);

  const { handlePaginationModelChange, paginationModel, setPaginationModel } =
    useDataGridQueryState({ page, pageSize });

  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const getStatusLabel = useChecklistRunStatusLabel();

  const apiRef = useGridApiRef();

  const tChecklists = useTranslations("checklists");
  const tCommon = useTranslations("common");

  const updateQuery = useUpdateQuery();

  const {
    data: { data: rows, total: rowCount } = {
      data: initialRows,
      total: initialRowCount,
    },
    isValidating,
  } = useSWR(
    getChecklistRunsUrl(organizationSlug, paginationModel, filters),
    (url: string) => fetcher<ChecklistRunListResponse>(url),
    {
      fallbackData: { data: initialRows, total: initialRowCount },
      keepPreviousData: true,
      onSuccess: () => {
        setTimeout(() => {
          apiRef.current?.autosizeColumns(autosizeOptions);
        }, 0);
      },
    },
  );

  const handleFiltersChange = (changes: Partial<ChecklistRunFilters>) => {
    setFilters((previous) => ({ ...previous, ...changes }));
    setPaginationModel((previous) => ({ ...previous, page: 0 }));

    updateQuery({ ...changes, page: "1" });
  };

  const handleDateChange =
    (field: "from" | "to") =>
    (
      value: Dayjs | null,
      { validationError }: PickerChangeHandlerContext<unknown>,
    ) => {
      if (validationError) return;

      handleFiltersChange({ [field]: value?.format("YYYY-MM-DD") ?? "" });
    };

  const formatBusinessDate = useCallback(
    (value: string) => format.dateTime(toStoreDate(value).toDate(), "date"),
    [format],
  );

  const handleViewItems = useCallback(
    (run: ChecklistRun) =>
      setDialog({
        content: (
          <List disablePadding>
            {run.items.map((item) => (
              <ListItem divider key={item.id}>
                <ChecklistRunItemContent item={item} />
              </ListItem>
            ))}
          </List>
        ),
        open: true,
        showConfirm: false,
        title: [formatBusinessDate(run.businessDate), run.name].join(
          tCommon("middleDot"),
        ),
      }),
    [formatBusinessDate, setDialog, tCommon],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        disableExport: true,
        field: "actions",
        headerName: tChecklists("templates.actions.label"),
        renderCell: ({ row }: GridRenderCellParams<ChecklistRun>) => (
          <Tooltip title={tChecklists("history.viewItems")}>
            <IconButton onClick={() => handleViewItems(row)} size="small">
              <ListAlt fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
        resizable: false,
      },
      {
        field: "businessDate",
        headerName: tChecklists("history.businessDate"),
        valueFormatter: formatBusinessDate,
      },
      { field: "name", headerName: tChecklists("templates.name") },
      {
        field: "timing",
        headerName: tChecklists("templates.timing.label"),
        valueFormatter: (value: ChecklistRun["timing"]) =>
          tChecklists(`templates.timing.${value}`),
      },
      {
        field: "status",
        headerName: tChecklists("history.status"),
        renderCell: ({ row }: GridRenderCellParams<ChecklistRun>) => (
          <ChecklistRunStatusChip run={row} />
        ),
        valueGetter: (_value, row: ChecklistRun) => getStatusLabel(row),
      },
    ],
    [formatBusinessDate, getStatusLabel, handleViewItems, tChecklists],
  );

  return (
    <>
      <ToolbarStack direction="row">
        <DatePicker
          disableFuture
          label={tChecklists("history.from")}
          maxDate={toFilterDate(filters.to) ?? undefined}
          onChange={handleDateChange("from")}
          slotProps={{ field: { clearable: true } }}
          timezone={STORE_TIMEZONE}
          value={toFilterDate(filters.from)}
        />
        <DatePicker
          disableFuture
          label={tChecklists("history.to")}
          minDate={toFilterDate(filters.from) ?? undefined}
          onChange={handleDateChange("to")}
          slotProps={{ field: { clearable: true } }}
          timezone={STORE_TIMEZONE}
          value={toFilterDate(filters.to)}
        />
        <TemplateTextField
          label={tChecklists("history.template")}
          onChange={({ target }) =>
            handleFiltersChange({ templateId: target.value })
          }
          select
          value={filters.templateId}
        >
          <MenuItem value="">{tChecklists("history.allTemplates")}</MenuItem>
          {templates.map(({ id, name }) => (
            <MenuItem key={id} value={id}>
              {name}
            </MenuItem>
          ))}
        </TemplateTextField>
      </ToolbarStack>
      <DataGrid
        {...DATA_GRID_PROPS}
        apiRef={apiRef}
        columns={columns}
        disableColumnFilter
        disableColumnSorting
        getRowId={({ id }) => String(id)}
        loading={isValidating}
        onPaginationModelChange={handlePaginationModelChange}
        pageSizeOptions={getPageSizeOptions(paginationModel.pageSize)}
        paginationMode="server"
        paginationModel={paginationModel}
        rowCount={rowCount}
        rows={rows}
        slotProps={{
          ...DATA_GRID_PROPS.slotProps,
          toolbar: {
            disableQuickFilter: true,
            exportDateField: "businessDate",
          },
        }}
      />
    </>
  );
};

export default ChecklistHistory;
