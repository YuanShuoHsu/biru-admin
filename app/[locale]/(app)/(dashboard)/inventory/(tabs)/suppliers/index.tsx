"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import SupplierDialog from "./SupplierDialog";

import AuditLogButton from "@/components/AuditLogButton";
import DataGrid from "@/components/DataGrid";
import EmptyCell, { renderEmptyableCell } from "@/components/EmptyCell";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";
import { DEFAULT_PAGE_SIZE, getPageSizeOptions } from "@/constants/pagination";

import { useDataGridQueryState } from "@/hooks/useDataGridQueryState";
import {
  useDateFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
import { useRowSelection } from "@/hooks/useRowSelection";

import { Add, Cancel, Delete, Edit } from "@mui/icons-material";
import {
  Button,
  Chip,
  DialogContentText,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemText,
  Stack,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type {
  Supplier,
  SupplierFilterField,
  SupplierListResponse,
  SupplierSortField,
} from "@/types/inventory";
import type { Organization } from "@/types/organizations";

import { getDataGridSearchParams } from "@/utils/dataGrid";
import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";
import { localize } from "@/utils/locale";

const ConfirmStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(1),
}));

const ActionsStack = styled(Stack)(({ theme }) => ({
  height: "100%",
  alignItems: "center",
  gap: theme.spacing(1),
}));

const ChipsStack = styled(Stack)(({ theme }) => ({
  alignItems: "center",
  gap: theme.spacing(0.5),
  height: "100%",
}));

const ToolbarStack = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  alignItems: "center",
  gap: theme.spacing(2),
}));

interface SuppliersProps {
  canViewAuditLog?: boolean;
  canWrite?: boolean;
  filterField?: SupplierFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  loading?: boolean;
  organization?: Organization;
  page?: number;
  pageSize?: number;
  quickFilterValue?: string;
  rowCount?: number;
  rows?: Supplier[];
  sortBy?: SupplierSortField;
  sortDirection?: SortDirection;
}

const Suppliers = ({
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
}: SuppliersProps) => {
  const organizationSlug = organization?.slug ?? "";

  const [isSelectMode, setIsSelectMode] = useState(false);
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
  const stringFilterOperators = useStringFilterOperators();

  const format = useFormatter();

  const locale = useLocale();

  const apiRef = useGridApiRef();

  const tCommon = useTranslations("common");
  const tInventory = useTranslations("inventory");

  const {
    data: { data: rows, total: rowCount } = {
      data: initialRows,
      total: initialRowCount,
    },
    mutate,
    isValidating,
  } = useSWR(
    !loading && [
      `/api/organizations/${organizationSlug}/suppliers`,
      filterModel.items[0]?.field,
      filterModel.items[0]?.operator,
      filterModel.items[0]?.value,
      filterModel.quickFilterValues,
      paginationModel.page,
      paginationModel.pageSize,
      sortModel,
    ],
    async () =>
      fetcher<SupplierListResponse>(
        `/api/organizations/${organizationSlug}/suppliers?${getDataGridSearchParams(paginationModel, filterModel, sortModel)}`,
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

  const {
    clearRowSelection,
    hasSelectableRows,
    rowSelectionProps,
    selectedRows,
  } = useRowSelection({ enabled: isSelectMode, rows });

  const handleCreateSupplier = useCallback(() => {
    setDialog({
      content: (
        <SupplierDialog
          mutate={mutate}
          organizationSlug={organizationSlug}
          supplier={null}
        />
      ),
      formId: "supplier-form",
      open: true,
      title: tInventory("suppliers.actions.createSupplier.title"),
    });
  }, [mutate, organizationSlug, setDialog, tInventory]);

  const handleUpdateSupplier = useCallback(
    (supplier: Supplier) => {
      setDialog({
        content: (
          <SupplierDialog
            mutate={mutate}
            organizationSlug={organizationSlug}
            supplier={supplier}
          />
        ),
        formId: "supplier-form",
        open: true,
        title: tInventory("suppliers.actions.updateSupplier.title"),
      });
    },
    [mutate, organizationSlug, setDialog, tInventory],
  );

  const handleDeleteSupplier = useCallback(
    ({ id, name }: Supplier) => {
      setDialog({
        content: (
          <DialogContentText>
            {tInventory.rich("suppliers.actions.deleteSupplier.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              name,
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          try {
            await fetcher(`/api/suppliers/${id}`, { method: "DELETE" });

            enqueueSnackbar(
              tInventory("suppliers.actions.deleteSupplier.success"),
              { variant: "success" },
            );

            mutate();
          } catch (error) {
            enqueueSnackbar(getErrorMessage(error), { variant: "error" });
          }
        },
        open: true,
        title: tInventory("suppliers.actions.deleteSupplier.title"),
      });
    },
    [mutate, setDialog, tInventory],
  );

  const handleEnterSupplierBatchDeleteMode = useCallback(() => {
    setIsSelectMode(true);
    setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
  }, [apiRef]);

  const handleSubmitSupplierBatchDelete = useCallback(() => {
    const count = selectedRows.length;

    setDialog({
      content: (
        <ConfirmStack>
          <DialogContentText>
            {tInventory.rich(
              "suppliers.actions.batchDeleteSupplier.submit.confirm",
              {
                bold: (chunks) => <strong>{chunks}</strong>,
                count,
              },
            )}
          </DialogContentText>
          <List dense disablePadding>
            {selectedRows.map(({ id, name }) => (
              <ListItem disableGutters key={id}>
                <ListItemText primary={name} />
              </ListItem>
            ))}
          </List>
        </ConfirmStack>
      ),
      onConfirm: async () => {
        try {
          await fetcher(`/api/organizations/${organizationSlug}/suppliers`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: selectedRows.map(({ id }) => id) }),
          });

          setIsSelectMode(false);
          clearRowSelection();

          setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);

          enqueueSnackbar(
            tInventory("suppliers.actions.batchDeleteSupplier.submit.success", {
              count,
            }),
            {
              variant: "success",
            },
          );
        } catch (error) {
          enqueueSnackbar(getErrorMessage(error), { variant: "error" });
        }

        mutate();
      },
      open: true,
      title: tInventory("suppliers.actions.batchDeleteSupplier.submit.label", {
        count,
      }),
    });
  }, [
    apiRef,
    clearRowSelection,
    mutate,
    organizationSlug,
    selectedRows,
    setDialog,
    tInventory,
  ]);

  const handleCancelSupplierBatchDelete = useCallback(() => {
    setIsSelectMode(false);
    clearRowSelection();

    setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
  }, [apiRef, clearRowSelection]);

  const columns = useMemo<GridColDef[]>(
    () => [
      ...((canWrite || canViewAuditLog) && !isSelectMode
        ? [
            {
              disableColumnMenu: true,
              disableExport: true,
              field: "actions",
              filterable: false,
              headerName: tInventory("suppliers.actions.label"),
              renderCell: ({ row }: GridRenderCellParams<Supplier>) => (
                <ActionsStack direction="row">
                  {canWrite && (
                    <Tooltip
                      title={tInventory(
                        "suppliers.actions.updateSupplier.title",
                      )}
                    >
                      <IconButton
                        onClick={() => handleUpdateSupplier(row)}
                        size="small"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {canViewAuditLog && <AuditLogButton resourceId={row.id} />}
                  {canWrite && (
                    <Tooltip
                      title={tInventory(
                        "suppliers.actions.deleteSupplier.title",
                      )}
                    >
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteSupplier(row)}
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
        headerName: tInventory("suppliers.name.label"),
      },
      {
        field: "telephone",
        filterOperators: stringFilterOperators,
        headerName: `${tInventory("suppliers.telephone.label")} ${tCommon("optional")}`,
        renderCell: renderEmptyableCell,
      },
      {
        field: "url",
        filterOperators: stringFilterOperators,
        headerName: `${tInventory("suppliers.url.label")} ${tCommon("optional")}`,
        renderCell: ({ row: { url } }: GridRenderCellParams<Supplier>) =>
          url ? (
            <Link href={url} rel="noopener" target="_blank">
              {url}
            </Link>
          ) : (
            <EmptyCell />
          ),
      },
      {
        field: "uniformInvoice",
        filterable: false,
        headerName: tInventory("suppliers.uniformInvoice.column"),
        renderCell: ({ value }: GridRenderCellParams<Supplier>) => (
          <Chip
            color={value ? "success" : "default"}
            label={tInventory(
              value
                ? "suppliers.uniformInvoice.yes"
                : "suppliers.uniformInvoice.no",
            )}
            size="small"
            variant="outlined"
          />
        ),
        sortable: false,
        type: "boolean",
      },
      {
        field: "ingredients",
        filterable: false,
        headerName: `${tInventory("suppliers.ingredients.label")} ${tCommon("optional")}`,
        sortable: false,
        renderCell: ({
          row: { ingredients: supplied },
        }: GridRenderCellParams<Supplier>) => (
          <ChipsStack direction="row">
            {supplied.map(({ id, name }) => (
              <Chip
                key={id}
                label={localize(name, locale)}
                size="small"
                variant="outlined"
              />
            ))}
          </ChipsStack>
        ),
      },
      {
        field: "note",
        filterOperators: stringFilterOperators,
        headerName: `${tInventory("suppliers.note.label")} ${tCommon("optional")}`,
        maxWidth: 320,
        renderCell: renderEmptyableCell,
      },
      {
        field: "createdAt",
        filterOperators: dateFilterOperators,
        headerName: tInventory("createdAt"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "short"),
      },
      {
        field: "updatedAt",
        filterOperators: dateFilterOperators,
        headerName: tInventory("updatedAt"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "short"),
      },
    ],
    [
      canViewAuditLog,
      canWrite,
      dateFilterOperators,
      format,
      handleDeleteSupplier,
      handleUpdateSupplier,
      isSelectMode,
      locale,
      stringFilterOperators,
      tCommon,
      tInventory,
    ],
  );

  return (
    <>
      <ToolbarStack direction="row">
        {!isSelectMode && (
          <>
            {canWrite && (
              <Button
                onClick={handleCreateSupplier}
                size="small"
                startIcon={<Add />}
                variant="contained"
              >
                {tInventory("suppliers.actions.createSupplier.title")}
              </Button>
            )}
            {canWrite && (
              <Button
                disabled={!hasSelectableRows}
                onClick={handleEnterSupplierBatchDeleteMode}
                size="small"
                startIcon={<Delete />}
                variant="outlined"
              >
                {tInventory("suppliers.actions.batchDeleteSupplier.title")}
              </Button>
            )}
          </>
        )}
        {isSelectMode && (
          <>
            <Button
              onClick={handleCancelSupplierBatchDelete}
              size="small"
              startIcon={<Cancel />}
              variant="outlined"
            >
              {tInventory("suppliers.actions.batchDeleteSupplier.cancel.label")}
            </Button>
            <Button
              color="error"
              disabled={!selectedRows.length}
              onClick={handleSubmitSupplierBatchDelete}
              size="small"
              startIcon={<Delete />}
              variant="contained"
            >
              {tInventory(
                "suppliers.actions.batchDeleteSupplier.submit.label",
                { count: selectedRows.length },
              )}
            </Button>
          </>
        )}
      </ToolbarStack>
      <DataGrid
        {...DATA_GRID_PROPS}
        {...rowSelectionProps}
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

export default Suppliers;
