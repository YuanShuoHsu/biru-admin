"use client";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo } from "react";
import useSWR from "swr";

import CashDeviceDialog from "./CashDeviceDialog";

import DataGrid from "@/components/DataGrid";
import { renderEmptyableCell } from "@/components/EmptyCell";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";
import { DEFAULT_PAGE_SIZE, getPageSizeOptions } from "@/constants/pagination";

import { useDataGridQueryState } from "@/hooks/useDataGridQueryState";
import {
  useDateFilterOperators,
  useEnumFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";

import { Add, Delete, Edit } from "@mui/icons-material";
import {
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

import type {
  CashDevice,
  CashDeviceFilterField,
  CashDeviceListResponse,
  CashDeviceSortField,
} from "@/types/cashDevices";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization } from "@/types/organizations";

import { getDataGridSearchParams } from "@/utils/dataGrid";
import { getCashDeviceEnumOptions } from "@/utils/enumOptions";
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

interface CashDevicesProps {
  canCreate?: boolean;
  canDelete?: boolean;
  canUpdate?: boolean;
  filterField?: CashDeviceFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  loading?: boolean;
  organization?: Organization;
  page?: number;
  pageSize?: number;
  quickFilterValue?: string;
  rowCount?: number;
  rows?: CashDevice[];
  sortBy?: CashDeviceSortField;
  sortDirection?: SortDirection;
}

const CashDevices = ({
  canCreate = false,
  canDelete = false,
  canUpdate = false,
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
}: CashDevicesProps) => {
  const organizationSlug = organization?.slug ?? "";

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

  const dateFilterOperators = useDateFilterOperators();
  const enumFilterOperators = useEnumFilterOperators();
  const stringFilterOperators = useStringFilterOperators();

  const format = useFormatter();

  const apiRef = useGridApiRef();

  const tCashDevices = useTranslations("cashDevices");
  const tCommon = useTranslations("common");

  const enumOptions = useMemo(
    () => getCashDeviceEnumOptions(tCashDevices),
    [tCashDevices],
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
      `/api/organizations/${organizationSlug}/cash-devices`,
      filterModel.items[0]?.field,
      filterModel.items[0]?.operator,
      filterModel.items[0]?.value,
      filterModel.quickFilterValues,
      paginationModel.page,
      paginationModel.pageSize,
      sortModel,
    ],
    async () =>
      fetcher<CashDeviceListResponse>(
        `/api/organizations/${organizationSlug}/cash-devices?${getDataGridSearchParams(paginationModel, filterModel, sortModel, enumOptions)}`,
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

  const handleCreateCashDevice = useCallback(() => {
    setDialog({
      content: (
        <CashDeviceDialog
          cashDevice={null}
          mutate={mutate}
          organizationSlug={organizationSlug}
        />
      ),
      formId: "cash-device-form",
      open: true,
      title: tCashDevices("actions.create.title"),
    });
  }, [mutate, organizationSlug, setDialog, tCashDevices]);

  const handleUpdateCashDevice = useCallback(
    (cashDevice: CashDevice) => {
      setDialog({
        content: (
          <CashDeviceDialog
            cashDevice={cashDevice}
            mutate={mutate}
            organizationSlug={organizationSlug}
          />
        ),
        formId: "cash-device-form",
        open: true,
        title: tCashDevices("actions.update.title"),
      });
    },
    [mutate, organizationSlug, setDialog, tCashDevices],
  );

  const handleDeleteCashDevice = useCallback(
    ({ id, name }: CashDevice) => {
      setDialog({
        content: (
          <DialogContentText>
            {tCashDevices.rich("actions.delete.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              name,
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          try {
            await fetcher(
              `/api/organizations/${organizationSlug}/cash-devices/${id}`,
              { method: "DELETE" },
            );

            enqueueSnackbar(tCashDevices("actions.delete.success"), {
              variant: "success",
            });

            mutate();
          } catch (error) {
            enqueueSnackbar(getErrorMessage(error), { variant: "error" });
          }
        },
        open: true,
        title: tCashDevices("actions.delete.title"),
      });
    },
    [mutate, organizationSlug, setDialog, tCashDevices],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      ...(canUpdate || canDelete
        ? [
            {
              disableColumnMenu: true,
              disableExport: true,
              field: "actions",
              filterable: false,
              headerName: tCashDevices("actions.label"),
              renderCell: ({ row }: GridRenderCellParams<CashDevice>) => (
                <ActionsStack direction="row">
                  {canUpdate && (
                    <Tooltip title={tCashDevices("actions.update.title")}>
                      <IconButton
                        onClick={() => handleUpdateCashDevice(row)}
                        size="small"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {canDelete && (
                    <Tooltip title={tCashDevices("actions.delete.title")}>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteCashDevice(row)}
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
        field: "name",
        filterOperators: stringFilterOperators,
        headerName: tCashDevices("name.label"),
      },
      {
        field: "vendor",
        filterOperators: stringFilterOperators,
        headerName: `${tCashDevices("vendor.label")} ${tCommon("optional")}`,
        renderCell: renderEmptyableCell,
      },
      {
        field: "model",
        filterOperators: stringFilterOperators,
        headerName: `${tCashDevices("model.label")} ${tCommon("optional")}`,
        renderCell: renderEmptyableCell,
      },
      {
        field: "status",
        filterOperators: enumFilterOperators,
        headerName: tCashDevices("status.label"),
        renderCell: ({ row: { status } }: GridRenderCellParams<CashDevice>) => (
          <Chip
            color={status === "active" ? "success" : "default"}
            label={tCashDevices(`status.${status}`)}
            size="small"
            variant="outlined"
          />
        ),
        type: "singleSelect",
        valueOptions: enumOptions.status,
      },
      {
        field: "lastSeenAt",
        filterOperators: dateFilterOperators,
        headerName: tCashDevices("lastSeenAt"),
        renderCell: renderEmptyableCell,
        valueFormatter: (value: string | null) =>
          value ? format.dateTime(new Date(value), "short") : "",
      },
      {
        field: "createdAt",
        filterOperators: dateFilterOperators,
        headerName: tCashDevices("createdAt"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "short"),
      },
      {
        field: "updatedAt",
        filterOperators: dateFilterOperators,
        headerName: tCashDevices("updatedAt"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "short"),
      },
    ],
    [
      canDelete,
      canUpdate,
      dateFilterOperators,
      enumFilterOperators,
      enumOptions,
      format,
      handleDeleteCashDevice,
      handleUpdateCashDevice,
      stringFilterOperators,
      tCashDevices,
      tCommon,
    ],
  );

  return (
    <>
      {canCreate && (
        <ToolbarStack direction="row">
          <Button
            onClick={handleCreateCashDevice}
            size="small"
            startIcon={<Add />}
            variant="contained"
          >
            {tCashDevices("actions.create.title")}
          </Button>
        </ToolbarStack>
      )}
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

export default CashDevices;
