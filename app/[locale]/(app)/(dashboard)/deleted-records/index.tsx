"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import EmptyCell, { renderEmptyableCell } from "@/components/EmptyCell";
import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";
import { getPageSizeOptions } from "@/constants/pagination";

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
  GridPaginationModel,
  GridRenderCellParams,
} from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  DeletedRecordBatch,
  DeletedRecordTable,
} from "@/types/deletedRecords";

import { attendanceErrorKey } from "@/utils/attendance";
import { getDeletedRecordsPath } from "@/utils/deletedRecords";
import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";
import { localize } from "@/utils/locale";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

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
  organizationSlug?: string;
  page: number;
  pageSize: number;
  rowCount: number;
  rows: DeletedRecordBatch[];
}

const DeletedRecords = ({
  organizationSlug,
  page,
  pageSize,
  rowCount: initialRowCount,
  rows: initialRows,
}: DeletedRecordsProps) => {
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: page - 1,
    pageSize,
  });

  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const locale = useLocale();

  const apiRef = useGridApiRef();

  const tAttendance = useTranslations("attendance");
  const tDeletedRecords = useTranslations("deletedRecords");

  const updateQuery = useUpdateQuery();

  const {
    data: { data: rows, total: rowCount } = {
      data: initialRows,
      total: initialRowCount,
    },
    mutate,
    isValidating: loading,
  } = useSWR(
    [
      getDeletedRecordsPath(organizationSlug),
      paginationModel.page,
      paginationModel.pageSize,
    ],
    () =>
      fetcher<{ data: DeletedRecordBatch[]; total: number }>(
        `${getDeletedRecordsPath(organizationSlug)}?${new URLSearchParams({
          limit: String(paginationModel.pageSize),
          offset: String(paginationModel.page * paginationModel.pageSize),
        }).toString()}`,
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

  const restoreErrorMessage = useCallback(
    (error: unknown) => {
      const attendanceKey = attendanceErrorKey(error);

      return attendanceKey === "errors.error"
        ? getErrorMessage(error)
        : tAttendance(attendanceKey);
    },
    [tAttendance],
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
          <DialogContentText>
            {tDeletedRecords.rich("restore.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              count: relatedCount,
              name,
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          try {
            await restoreBatches([batchId]);

            enqueueSnackbar(tDeletedRecords("restore.success", { name }), {
              variant: "success",
            });

            mutate();
          } catch (error) {
            enqueueSnackbar(restoreErrorMessage(error), { variant: "error" });
          }
        },
        open: true,
        title: tDeletedRecords("restore.title"),
      });
    },
    [
      locale,
      mutate,
      restoreBatches,
      restoreErrorMessage,
      setDialog,
      tDeletedRecords,
    ],
  );

  const handleEnterDeletedRecordBatchRestoreMode = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tDeletedRecords.rich("batchRestore.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </DialogContentText>
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
        <DialogContentText>
          {tDeletedRecords.rich("batchRestore.submit.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
            count,
          })}
        </DialogContentText>
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
          enqueueSnackbar(restoreErrorMessage(error), { variant: "error" });
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
    restoreErrorMessage,
    selectedRows,
    setDialog,
    tDeletedRecords,
  ]);

  const handleCancelDeletedRecordBatchRestore = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tDeletedRecords.rich("batchRestore.cancel.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </DialogContentText>
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
        headerName: tDeletedRecords("columns.deletedAt"),
        sortable: false,
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "short"),
      },
      {
        field: "tableName",
        headerName: tDeletedRecords("columns.resource"),
        sortable: false,
        valueFormatter: (value: DeletedRecordTable) =>
          tDeletedRecords(`table.${value}`),
      },
      {
        field: "label",
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
              headerName: tDeletedRecords("columns.organization"),
              renderCell: renderEmptyableCell,
              sortable: false,
            },
          ]),
      {
        field: "relatedCount",
        headerName: tDeletedRecords("columns.related"),
        renderCell: ({
          value,
        }: GridRenderCellParams<DeletedRecordBatch, number>) =>
          value ? tDeletedRecords("related", { count: value }) : <EmptyCell />,
        sortable: false,
      },
      {
        field: "deletedBy",
        headerName: tDeletedRecords("columns.deletedBy"),
        renderCell: renderEmptyableCell,
        sortable: false,
      },
    ],
    [
      format,
      handleRestore,
      isSelectMode,
      locale,
      organizationSlug,
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
        disableColumnFilter
        getRowId={({ batchId }) => batchId}
        loading={loading}
        onPaginationModelChange={handlePaginationModelChange}
        pageSizeOptions={getPageSizeOptions(paginationModel.pageSize)}
        paginationMode="server"
        paginationModel={paginationModel}
        rowCount={rowCount}
        rows={rows}
      />
    </>
  );
};

export default DeletedRecords;
