"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import {
  CustomizedDialogActions,
  CustomizedDialogContent,
} from "@/components/CustomizedDialogs";
import DataGrid from "@/components/DataGrid";
import EmptyCell, { renderEmptyableCell } from "@/components/EmptyCell";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import { DEFAULT_PAGE_SIZE, getPageSizeOptions } from "@/constants/pagination";

import {
  useDateFilterOperators,
  useEnumFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
import { useRowSelection } from "@/hooks/useRowSelection";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import type { Locale } from "@/i18n/routing";

import { Cancel, Undo } from "@mui/icons-material";
import {
  Button,
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
  DeletedRecordBatch,
  DeletedRecordBatchListResponse,
  DeletedRecordFilterField,
  DeletedRecordSortField,
} from "@/types/deletedRecords";

import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { getDeletedRecordsPath } from "@/utils/deletedRecords";
import { getDeletedRecordEnumOptions } from "@/utils/enumOptions";
import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";
import { localize } from "@/utils/locale";

const ToolbarStack = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  alignItems: "center",
  gap: theme.spacing(1),
}));

const ActionsStack = styled(Stack)({
  height: "100%",
  alignItems: "center",
});

const getLabel = (
  label: DeletedRecordBatch["label"],
  locale: Locale,
): string =>
  typeof label === "string" ? label : localize(label ?? undefined, locale);

interface DeletedRecordsProps {
  filterField?: DeletedRecordFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  loading?: boolean;
  organizationSlug?: string;
  page?: number;
  pageSize?: number;
  quickFilterValue?: string;
  rowCount?: number;
  rows?: DeletedRecordBatch[];
  sortBy?: DeletedRecordSortField;
  sortDirection?: SortDirection;
}

const DeletedRecords = ({
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  loading = false,
  organizationSlug,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount = 0,
  rows: initialRows = [],
  sortBy,
  sortDirection,
}: DeletedRecordsProps) => {
  const [isSelectMode, setIsSelectMode] = useState(false);
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

  const { setDialog } = useDialogStore((state) => state);

  const dateFilterOperators = useDateFilterOperators();
  const enumFilterOperators = useEnumFilterOperators();
  const stringFilterOperators = useStringFilterOperators();

  const format = useFormatter();

  const locale = useLocale();

  const apiRef = useGridApiRef();

  const tDeletedRecords = useTranslations("deletedRecords");

  const updateQuery = useUpdateQuery();

  const enumOptions = useMemo(
    () => getDeletedRecordEnumOptions(tDeletedRecords),
    [tDeletedRecords],
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
      getDeletedRecordsPath(organizationSlug),
      paginationModel,
      filterModel,
      sortModel,
    ],
    () =>
      fetcher<DeletedRecordBatchListResponse>(
        `${getDeletedRecordsPath(organizationSlug)}?${getDataGridSearchParams(paginationModel, filterModel, sortModel, enumOptions)}`,
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

  const getDeletedRecordRowId = useCallback(
    ({ batchId }: DeletedRecordBatch) => batchId,
    [],
  );

  const isDeletedRecordSelectable = useCallback(
    ({ canRestore }: DeletedRecordBatch) => canRestore,
    [],
  );

  const {
    clearRowSelection,
    hasSelectableRows,
    rowSelectionProps,
    selectedRows,
  } = useRowSelection({
    enabled: isSelectMode,
    getRowId: getDeletedRecordRowId,
    isRowSelectable: isDeletedRecordSelectable,
    rows,
  });

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

  const restoreBatches = useCallback(
    async (ids: number[]) => {
      await fetcher(`${getDeletedRecordsPath(organizationSlug)}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
    },
    [organizationSlug],
  );

  const handleRestore = useCallback(
    ({ batchId, label, relatedCount, tableName }: DeletedRecordBatch) => {
      const name =
        getLabel(label, locale) || tDeletedRecords(`table.${tableName}`);

      setDialog({
        content: (
          <>
            <CustomizedDialogContent>
              <DialogContentText>
                {tDeletedRecords.rich("restore.confirm", {
                  bold: (chunks) => <strong>{chunks}</strong>,
                  count: relatedCount,
                  name,
                })}
              </DialogContentText>
            </CustomizedDialogContent>
            <CustomizedDialogActions />
          </>
        ),
        onConfirm: async () => {
          try {
            await restoreBatches([batchId]);

            enqueueSnackbar(tDeletedRecords("restore.success", { name }), {
              variant: "success",
            });

            mutate();
          } catch (error) {
            enqueueSnackbar(getErrorMessage(error), { variant: "error" });
          }
        },
        open: true,
        title: tDeletedRecords("restore.title"),
      });
    },
    [locale, mutate, restoreBatches, setDialog, tDeletedRecords],
  );

  const handleEnterDeletedRecordBatchRestoreMode = useCallback(() => {
    setDialog({
      content: (
        <>
          <CustomizedDialogContent>
            <DialogContentText>
              {tDeletedRecords.rich("batchRestore.confirm", {
                bold: (chunks) => <strong>{chunks}</strong>,
              })}
            </DialogContentText>
          </CustomizedDialogContent>
          <CustomizedDialogActions />
        </>
      ),
      onConfirm: async () => {
        setIsSelectMode(true);
        setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
      },
      open: true,
      title: tDeletedRecords("batchRestore.title"),
    });
  }, [apiRef, setDialog, tDeletedRecords]);

  const handleSubmitDeletedRecordBatchRestore = useCallback(() => {
    const count = selectedRows.length;

    setDialog({
      content: (
        <>
          <CustomizedDialogContent>
            <DialogContentText>
              {tDeletedRecords.rich("batchRestore.submit.confirm", {
                bold: (chunks) => <strong>{chunks}</strong>,
                count,
              })}
            </DialogContentText>
          </CustomizedDialogContent>
          <CustomizedDialogActions />
        </>
      ),
      onConfirm: async () => {
        try {
          await restoreBatches(selectedRows.map(({ batchId }) => batchId));

          setIsSelectMode(false);
          clearRowSelection();

          setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);

          enqueueSnackbar(
            tDeletedRecords("batchRestore.submit.success", { count }),
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
      title: tDeletedRecords("batchRestore.submit.label", { count }),
    });
  }, [
    apiRef,
    clearRowSelection,
    mutate,
    restoreBatches,
    selectedRows,
    setDialog,
    tDeletedRecords,
  ]);

  const handleCancelDeletedRecordBatchRestore = useCallback(() => {
    setDialog({
      content: (
        <>
          <CustomizedDialogContent>
            <DialogContentText>
              {tDeletedRecords.rich("batchRestore.cancel.confirm", {
                bold: (chunks) => <strong>{chunks}</strong>,
              })}
            </DialogContentText>
          </CustomizedDialogContent>
          <CustomizedDialogActions />
        </>
      ),
      onConfirm: async () => {
        setIsSelectMode(false);
        clearRowSelection();

        setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
      },
      open: true,
      title: tDeletedRecords("batchRestore.cancel.label"),
    });
  }, [apiRef, clearRowSelection, setDialog, tDeletedRecords]);

  const columns = useMemo<GridColDef[]>(
    () => [
      ...(!isSelectMode
        ? [
            {
              field: "actions",
              filterable: false,
              headerName: tDeletedRecords("columns.actions"),
              renderCell: ({
                row,
              }: GridRenderCellParams<DeletedRecordBatch>) => (
                <ActionsStack direction="row">
                  <Tooltip
                    title={tDeletedRecords(
                      row.canRestore ? "restore.title" : "restore.closed",
                    )}
                  >
                    <span>
                      <IconButton
                        disabled={!row.canRestore}
                        onClick={() => handleRestore(row)}
                        size="small"
                      >
                        <Undo fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </ActionsStack>
              ),
              sortable: false,
            },
          ]
        : []),
      {
        field: "deletedAt",
        filterOperators: dateFilterOperators,
        headerName: tDeletedRecords("columns.deletedAt"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "short"),
      },
      {
        field: "tableName",
        filterOperators: enumFilterOperators,
        headerName: tDeletedRecords("columns.resource"),
        type: "singleSelect",
        valueOptions: enumOptions.tableName,
      },
      {
        field: "label",
        filterable: false,
        headerName: tDeletedRecords("columns.target"),
        renderCell: renderEmptyableCell,
        sortable: false,
        valueFormatter: (value: DeletedRecordBatch["label"]) =>
          getLabel(value, locale),
      },
      ...(organizationSlug
        ? []
        : [
            {
              field: "organizationName",
              filterOperators: stringFilterOperators,
              headerName: tDeletedRecords("columns.organization"),
              renderCell: renderEmptyableCell,
            },
          ]),
      {
        field: "relatedCount",
        filterable: false,
        headerName: tDeletedRecords("columns.related"),
        renderCell: ({
          value,
        }: GridRenderCellParams<DeletedRecordBatch, number>) =>
          value ? tDeletedRecords("related", { count: value }) : <EmptyCell />,
        sortable: false,
      },
      {
        field: "deletedBy",
        filterable: false,
        headerName: tDeletedRecords("columns.deletedBy"),
        renderCell: renderEmptyableCell,
        sortable: false,
      },
    ],
    [
      dateFilterOperators,
      enumFilterOperators,
      enumOptions.tableName,
      format,
      handleRestore,
      isSelectMode,
      locale,
      organizationSlug,
      stringFilterOperators,
      tDeletedRecords,
    ],
  );

  return (
    <>
      <ToolbarStack direction="row">
        {!isSelectMode && (
          <Button
            disabled={!hasSelectableRows}
            onClick={handleEnterDeletedRecordBatchRestoreMode}
            size="small"
            startIcon={<Undo />}
            variant="outlined"
          >
            {tDeletedRecords("batchRestore.title")}
          </Button>
        )}
        {isSelectMode && (
          <>
            <Button
              onClick={handleCancelDeletedRecordBatchRestore}
              size="small"
              startIcon={<Cancel />}
              variant="outlined"
            >
              {tDeletedRecords("batchRestore.cancel.label")}
            </Button>
            <Button
              color="primary"
              disabled={!selectedRows.length}
              onClick={handleSubmitDeletedRecordBatchRestore}
              size="small"
              startIcon={<Undo />}
              variant="contained"
            >
              {tDeletedRecords("batchRestore.submit.label", {
                count: selectedRows.length,
              })}
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
        getRowId={({ batchId }) => batchId}
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

export default DeletedRecords;
