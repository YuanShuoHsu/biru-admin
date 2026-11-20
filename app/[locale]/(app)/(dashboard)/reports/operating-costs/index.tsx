"use client";

import dayjs from "dayjs";
import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo } from "react";
import useSWR from "swr";

import OperatingCostDialog from "./OperatingCostDialog";

import AuditLogButton from "@/components/AuditLogButton";
import DataGrid from "@/components/DataGrid";
import { renderEmptyableCell } from "@/components/EmptyCell";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";
import { DEFAULT_PAGE_SIZE, getPageSizeOptions } from "@/constants/pagination";

import { useDataGridQueryState } from "@/hooks/useDataGridQueryState";
import {
  useBooleanFilterOperators,
  useDateFilterOperators,
  useEnumFilterOperators,
  useMonthFilterOperators,
  useNumberFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
import { useFormatMoney } from "@/hooks/useFormatMoney";
import { useMonthFormat } from "@/hooks/useMonthFormat";

import { Add, Delete, Edit } from "@mui/icons-material";
import {
  Button,
  Chip,
  DialogContentText,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization } from "@/types/organizations";
import type {
  OperatingCost,
  OperatingCostFilterField,
  OperatingCostListResponse,
  OperatingCostSortField,
} from "@/types/reports";

import { getDataGridSearchParams } from "@/utils/dataGrid";
import { getOperatingCostEnumOptions } from "@/utils/enumOptions";
import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

const ActionsStack = styled(Stack)(({ theme }) => ({
  height: "100%",
  alignItems: "center",
  gap: theme.spacing(1),
}));

const ToolbarStack = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  alignItems: "center",
  gap: theme.spacing(2),
}));

interface OperatingCostsProps {
  canViewAuditLog?: boolean;
  canWrite?: boolean;
  filterField?: OperatingCostFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  loading?: boolean;
  organization?: Organization;
  page?: number;
  pageSize?: number;
  quickFilterValue?: string;
  rowCount?: number;
  rows?: OperatingCost[];
  sortBy?: OperatingCostSortField;
  sortDirection?: SortDirection;
}

const OperatingCosts = ({
  canViewAuditLog = false,
  canWrite = false,
  filterField,
  filterOperator,
  filterValue,
  loading = false,
  organization,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  quickFilterValue,
  rowCount: initialRowCount = 0,
  rows: initialRows = [],
  sortBy,
  sortDirection,
}: OperatingCostsProps) => {
  const organizationSlug = organization?.slug ?? "";
  const currency = organization?.currency ?? "";

  const {
    filterModel,
    handleFilterModelChange,
    handlePaginationModelChange,
    handleSortModelChange,
    paginationModel,
    sortModel,
  } = useDataGridQueryState({
    filterField,
    filterOperator,
    filterValue,
    page,
    pageSize,
    quickFilterValue,
    sortBy,
    sortDirection,
  });

  const { setDialog } = useDialogStore((state) => state);

  const booleanFilterOperators = useBooleanFilterOperators();
  const dateFilterOperators = useDateFilterOperators();
  const enumFilterOperators = useEnumFilterOperators();
  const monthFilterOperators = useMonthFilterOperators();
  const numberFilterOperators = useNumberFilterOperators();
  const stringFilterOperators = useStringFilterOperators();

  const format = useFormatter();

  const formatMoney = useFormatMoney();

  const monthFormat = useMonthFormat();

  const apiRef = useGridApiRef();

  const tCommon = useTranslations("common");
  const tReports = useTranslations("reports");

  const listPath = `/api/organizations/${organizationSlug}/operating-costs`;

  const enumOptions = useMemo(
    () => getOperatingCostEnumOptions(tReports),
    [tReports],
  );

  const {
    data: { data: rows, total: rowCount } = {
      data: initialRows,
      total: initialRowCount,
    },
    mutate,
    isValidating,
  } = useSWR(
    !loading && [
      listPath,
      filterModel.items[0]?.field,
      filterModel.items[0]?.operator,
      filterModel.items[0]?.value,
      filterModel.quickFilterValues,
      paginationModel.page,
      paginationModel.pageSize,
      sortModel,
    ],
    async () =>
      fetcher<OperatingCostListResponse>(
        `${listPath}?${getDataGridSearchParams(paginationModel, filterModel, sortModel, enumOptions)}`,
      ),
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

  const openDialog = useCallback(
    (operatingCost: OperatingCost | null) => {
      const action = operatingCost ? "update" : "create";

      setDialog({
        content: (
          <OperatingCostDialog
            mutate={mutate}
            operatingCost={operatingCost}
            organizationSlug={organizationSlug}
          />
        ),
        formId: "operating-cost-form",
        open: true,
        title: tReports(`operatingCosts.actions.${action}.title`),
      });
    },
    [mutate, organizationSlug, setDialog, tReports],
  );

  const handleDelete = useCallback(
    ({ category, effectiveFrom, id }: OperatingCost) => {
      setDialog({
        content: (
          <DialogContentText>
            {tReports.rich("operatingCosts.actions.delete.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              category: tReports(`operatingCosts.category.options.${category}`),
              effectiveFrom: dayjs(effectiveFrom).format(monthFormat),
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          try {
            await fetcher(`${listPath}/${id}`, { method: "DELETE" });

            enqueueSnackbar(tReports("operatingCosts.actions.delete.success"), {
              variant: "success",
            });

            mutate();
          } catch (error) {
            enqueueSnackbar(getErrorMessage(error), { variant: "error" });
          }
        },
        open: true,
        title: tReports("operatingCosts.actions.delete.title"),
      });
    },
    [listPath, monthFormat, mutate, setDialog, tReports],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      ...(canWrite || canViewAuditLog
        ? [
            {
              disableColumnMenu: true,
              disableExport: true,
              field: "actions",
              filterable: false,
              headerName: tReports("operatingCosts.actions.label"),
              renderCell: ({ row }: GridRenderCellParams<OperatingCost>) => (
                <ActionsStack direction="row">
                  {canWrite && (
                    <Tooltip
                      title={tReports("operatingCosts.actions.update.title")}
                    >
                      <IconButton onClick={() => openDialog(row)} size="small">
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {canViewAuditLog && <AuditLogButton resourceId={row.id} />}
                  {canWrite && (
                    <Tooltip
                      title={tReports("operatingCosts.actions.delete.title")}
                    >
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(row)}
                        size="small"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </ActionsStack>
              ),
              resizable: false,
              sortable: false,
            },
          ]
        : []),
      {
        field: "category",
        filterOperators: enumFilterOperators,
        headerName: tReports("operatingCosts.category.label"),
        type: "singleSelect",
        valueOptions: enumOptions.category,
      },
      {
        field: "effectiveFrom",
        filterOperators: monthFilterOperators,
        headerName: tReports("operatingCosts.effectiveFrom.label"),
        valueFormatter: (value: string) => dayjs(value).format(monthFormat),
      },
      {
        field: "monthlyAmount",
        filterOperators: numberFilterOperators,
        headerName: tReports("operatingCosts.monthlyAmount.label"),
        type: "number",
        valueGetter: (value: string) => Number(value),
        valueFormatter: (value: number) => formatMoney(value, currency),
      },
      {
        field: "inputTaxDeductible",
        filterOperators: booleanFilterOperators,
        headerName: tReports("operatingCosts.inputTaxDeductible.column"),
        renderCell: ({ value }: GridRenderCellParams<OperatingCost>) => (
          <Chip
            color={value ? "success" : "default"}
            label={tReports(
              value
                ? "operatingCosts.inputTaxDeductible.yes"
                : "operatingCosts.inputTaxDeductible.no",
            )}
            size="small"
            variant="outlined"
          />
        ),
        type: "boolean",
      },
      {
        field: "note",
        filterOperators: stringFilterOperators,
        headerName: `${tReports("operatingCosts.note.label")} ${tCommon("optional")}`,
        maxWidth: 320,
        renderCell: renderEmptyableCell,
      },
      {
        field: "createdAt",
        filterOperators: dateFilterOperators,
        headerName: tReports("operatingCosts.createdAt"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "short"),
      },
      {
        field: "updatedAt",
        filterOperators: dateFilterOperators,
        headerName: tReports("operatingCosts.updatedAt"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "short"),
      },
    ],
    [
      booleanFilterOperators,
      canViewAuditLog,
      canWrite,
      enumOptions.category,
      currency,
      dateFilterOperators,
      enumFilterOperators,
      format,
      formatMoney,
      handleDelete,
      monthFilterOperators,
      monthFormat,
      numberFilterOperators,
      openDialog,
      stringFilterOperators,
      tCommon,
      tReports,
    ],
  );

  return (
    <>
      <ToolbarStack direction="row">
        {canWrite && (
          <Button
            disabled={loading}
            onClick={() => openDialog(null)}
            size="small"
            startIcon={<Add />}
            variant="contained"
          >
            {tReports("operatingCosts.actions.create.title")}
          </Button>
        )}
        <Typography color="textSecondary" variant="body2">
          {tReports("operatingCosts.description")}
        </Typography>
      </ToolbarStack>
      <DataGrid
        {...DATA_GRID_PROPS}
        apiRef={apiRef}
        columns={columns}
        filterMode="server"
        filterModel={filterModel}
        loading={loading || isValidating}
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

export default OperatingCosts;
