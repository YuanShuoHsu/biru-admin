"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import StorePhotoDialog from "./StorePhotoDialog";

import AuditLogButton from "@/components/AuditLogButton";
import {
  CustomizedDialogActions,
  CustomizedDialogContent,
} from "@/components/CustomizedDialogs";
import DataGrid from "@/components/DataGrid";
import { DragHandle, Sortable } from "@/components/Sortable";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import { DEFAULT_PAGE_SIZE, getPageSizeOptions } from "@/constants/pagination";

import { arrayMove } from "@dnd-kit/helpers";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { isSortableOperation } from "@dnd-kit/react/sortable";

import {
  useBooleanFilterOperators,
  useDateFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
import { useRowSelection } from "@/hooks/useRowSelection";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { Add, Cancel, Delete, Edit, Save, Sort } from "@mui/icons-material";
import {
  Avatar,
  Button,
  Chip,
  DialogContentText,
  IconButton,
  List,
  ListItem,
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

import type {
  StorePhoto,
  StorePhotoFilterField,
  StorePhotoSortField,
} from "@/types/storePhotos";
import type {
  FilterOperator,
  SortDirection,
  ToolbarMode,
} from "@/types/dataGrid";

import {
  getDataGridSearchParams,
  getFilterItemParams,
  isFilteredOrSorted,
} from "@/utils/dataGrid";
import { getStorePhotoEnumOptions } from "@/utils/enumOptions";
import { fetcher } from "@/utils/fetcher";
import { localize } from "@/utils/locale";

const ConfirmStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(1),
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: theme.spacing(10),
  height: "auto",
  aspectRatio: "4/3",
}));

const ActionsStack = styled(Stack)(({ theme }) => ({
  height: "100%",
  alignItems: "center",
  gap: theme.spacing(1),
}));

const ImageStack = styled(Stack)({
  height: "100%",
  alignItems: "center",
});

const ToolbarStack = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  alignItems: "center",
  gap: theme.spacing(2),
}));

interface StorePhotosProps {
  filterField?: StorePhotoFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  loading?: boolean;
  page?: number;
  pageSize?: number;
  quickFilterValue?: string;
  rowCount?: number;
  rows?: StorePhoto[];
  sortBy?: StorePhotoSortField;
  sortDirection?: SortDirection;
}

const StorePhotos = ({
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  loading = false,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount = 0,
  rows: initialRows = [],
  sortBy,
  sortDirection,
}: StorePhotosProps) => {
  const [toolbarMode, setToolbarMode] = useState<ToolbarMode>(null);
  const isReorderMode = toolbarMode === "reorder";
  const isSelectMode = toolbarMode === "select";
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

  const booleanFilterOperators = useBooleanFilterOperators();
  const dateFilterOperators = useDateFilterOperators();
  const stringFilterOperators = useStringFilterOperators();

  const format = useFormatter();

  const locale = useLocale();

  const apiRef = useGridApiRef();

  const tStorePhotos = useTranslations("storePhotos");

  const updateQuery = useUpdateQuery();

  const enumOptions = useMemo(
    () => getStorePhotoEnumOptions(tStorePhotos),
    [tStorePhotos],
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
      "/api/store-photos",
      filterModel.items[0]?.field,
      filterModel.items[0]?.operator,
      filterModel.items[0]?.value,
      filterModel.quickFilterValues,
      paginationModel.page,
      paginationModel.pageSize,
      sortModel,
    ],
    async () =>
      fetcher<{ data: StorePhoto[]; total: number }>(
        `/api/store-photos?${getDataGridSearchParams(paginationModel, filterModel, sortModel, enumOptions)}`,
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

  const {
    clearRowSelection,
    hasSelectableRows,
    rowSelectionProps,
    selectedRows,
  } = useRowSelection({ enabled: isSelectMode, rows });

  const isReorderDisabled =
    rowCount < 2 || isFilteredOrSorted(filterModel, sortModel);

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

  const handleEnterReorderMode = useCallback(() => {
    setDialog({
      content: (
        <>
          <CustomizedDialogContent>
            <DialogContentText>
              {tStorePhotos.rich("actions.reorderStorePhoto.confirm", {
                bold: (chunks) => <strong>{chunks}</strong>,
              })}
            </DialogContentText>
          </CustomizedDialogContent>
          <CustomizedDialogActions />
        </>
      ),
      onConfirm: async () => {
        setToolbarMode("reorder");
        setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
      },
      open: true,
      title: tStorePhotos("actions.reorderStorePhoto.title"),
    });
  }, [apiRef, setDialog, tStorePhotos]);

  const handleSaveReorder = useCallback(() => {
    setDialog({
      content: (
        <>
          <CustomizedDialogContent>
            <DialogContentText>
              {tStorePhotos.rich("actions.reorderStorePhoto.save.confirm", {
                bold: (chunks) => <strong>{chunks}</strong>,
              })}
            </DialogContentText>
          </CustomizedDialogContent>
          <CustomizedDialogActions />
        </>
      ),
      onConfirm: async () => {
        try {
          await fetcher("/api/store-photos/reorder", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ids: rows.map(({ id }) => id),
              offset: paginationModel.page * paginationModel.pageSize,
            }),
          });

          setToolbarMode(null);

          setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);

          enqueueSnackbar(
            tStorePhotos("actions.reorderStorePhoto.save.success"),
            {
              variant: "success",
            },
          );
        } catch {
          mutate();

          enqueueSnackbar(
            tStorePhotos("actions.reorderStorePhoto.save.error"),
            {
              variant: "error",
            },
          );
        }
      },
      open: true,
      title: tStorePhotos("actions.reorderStorePhoto.save.label"),
    });
  }, [
    apiRef,
    rows,
    mutate,
    paginationModel.page,
    paginationModel.pageSize,
    setDialog,
    tStorePhotos,
  ]);

  const handleCancelReorder = useCallback(() => {
    setDialog({
      content: (
        <>
          <CustomizedDialogContent>
            <DialogContentText>
              {tStorePhotos.rich("actions.reorderStorePhoto.cancel.confirm", {
                bold: (chunks) => <strong>{chunks}</strong>,
              })}
            </DialogContentText>
          </CustomizedDialogContent>
          <CustomizedDialogActions />
        </>
      ),
      onConfirm: async () => {
        setToolbarMode(null);

        mutate();
      },
      open: true,
      title: tStorePhotos("actions.reorderStorePhoto.cancel.label"),
    });
  }, [mutate, setDialog, tStorePhotos]);

  const handleDragEnd = ({ operation }: DragEndEvent) => {
    if (!isSortableOperation(operation)) return;

    const { canceled, source } = operation;
    if (canceled || !source) return;

    const fromIndex = source.initialIndex;
    const toIndex = source.index;
    if (fromIndex === toIndex) return;

    const newStorePhotos = arrayMove(rows, fromIndex, toIndex);
    mutate({ data: newStorePhotos, total: rowCount }, false);
  };

  const handleCreateStorePhoto = useCallback(() => {
    setDialog({
      content: <StorePhotoDialog storePhoto={null} mutate={mutate} />,
      formId: "store-photo-form",
      open: true,
      title: tStorePhotos("actions.createStorePhoto.title"),
    });
  }, [mutate, setDialog, tStorePhotos]);

  const handleUpdateStorePhoto = useCallback(
    (storePhoto: StorePhoto) => {
      setDialog({
        content: <StorePhotoDialog storePhoto={storePhoto} mutate={mutate} />,
        formId: "store-photo-form",
        open: true,
        title: tStorePhotos("actions.updateStorePhoto.title"),
      });
    },
    [mutate, setDialog, tStorePhotos],
  );

  const handleDeleteStorePhoto = useCallback(
    ({ id }: StorePhoto) => {
      setDialog({
        content: (
          <>
            <CustomizedDialogContent>
              <DialogContentText>
                {tStorePhotos.rich("actions.deleteStorePhoto.confirm", {
                  bold: (chunks) => <strong>{chunks}</strong>,
                })}
              </DialogContentText>
            </CustomizedDialogContent>
            <CustomizedDialogActions />
          </>
        ),
        onConfirm: async () => {
          try {
            await fetcher(`/api/store-photos/${id}`, { method: "DELETE" });

            enqueueSnackbar(tStorePhotos("actions.deleteStorePhoto.success"), {
              variant: "success",
            });

            mutate();
          } catch {
            enqueueSnackbar(tStorePhotos("actions.deleteStorePhoto.error"), {
              variant: "error",
            });
          }
        },
        open: true,
        title: tStorePhotos("actions.deleteStorePhoto.title"),
      });
    },
    [mutate, setDialog, tStorePhotos],
  );

  const handleEnterBatchDeleteMode = useCallback(() => {
    setToolbarMode("select");
    setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
  }, [apiRef]);

  const handleSubmitBatchDelete = useCallback(() => {
    const count = selectedRows.length;

    setDialog({
      content: (
        <>
          <CustomizedDialogContent>
            <ConfirmStack>
              <DialogContentText>
                {tStorePhotos.rich(
                  "actions.batchDeleteStorePhoto.submit.confirm",
                  {
                    bold: (chunks) => <strong>{chunks}</strong>,
                    count,
                  },
                )}
              </DialogContentText>
              <List dense disablePadding>
                {selectedRows.map(({ alt, id, image }) => (
                  <ListItem disableGutters key={id}>
                    <StyledAvatar
                      alt={localize(alt, locale)}
                      src={image}
                      variant="rounded"
                    />
                  </ListItem>
                ))}
              </List>
            </ConfirmStack>
          </CustomizedDialogContent>
          <CustomizedDialogActions />
        </>
      ),
      onConfirm: async () => {
        try {
          await fetcher("/api/store-photos", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: selectedRows.map(({ id }) => id) }),
          });

          setToolbarMode(null);
          clearRowSelection();

          setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);

          enqueueSnackbar(
            tStorePhotos("actions.batchDeleteStorePhoto.submit.success", {
              count,
            }),
            {
              variant: "success",
            },
          );
        } catch {
          enqueueSnackbar(
            tStorePhotos("actions.batchDeleteStorePhoto.submit.error"),
            {
              variant: "error",
            },
          );
        }

        mutate();
      },
      open: true,
      title: tStorePhotos("actions.batchDeleteStorePhoto.submit.label", {
        count,
      }),
    });
  }, [
    apiRef,
    clearRowSelection,
    locale,
    mutate,
    selectedRows,
    setDialog,
    tStorePhotos,
  ]);

  const handleCancelBatchDelete = useCallback(() => {
    setToolbarMode(null);
    clearRowSelection();

    setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
  }, [apiRef, clearRowSelection]);

  const columns = useMemo<GridColDef[]>(
    () => [
      ...(isReorderMode
        ? [
            {
              disableColumnMenu: true,
              field: "reorder",
              filterable: false,
              headerName: tStorePhotos("reorder"),
              renderCell: () => <DragHandle />,
              resizable: false,
              sortable: false,
            },
          ]
        : []),
      ...(!toolbarMode
        ? [
            {
              disableColumnMenu: true,
              disableExport: true,
              field: "actions",
              filterable: false,
              headerName: tStorePhotos("actions.label"),
              renderCell: ({ row }: GridRenderCellParams<StorePhoto>) => (
                <ActionsStack direction="row">
                  <Tooltip
                    title={tStorePhotos("actions.updateStorePhoto.title")}
                  >
                    <IconButton
                      onClick={(event) => {
                        event.stopPropagation();

                        handleUpdateStorePhoto(row);
                      }}
                      size="small"
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <AuditLogButton resourceId={row.id} />
                  <Tooltip
                    title={tStorePhotos("actions.deleteStorePhoto.title")}
                  >
                    <IconButton
                      color="error"
                      onClick={(event) => {
                        event.stopPropagation();

                        handleDeleteStorePhoto(row);
                      }}
                      size="small"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </ActionsStack>
              ),
              resizable: false,
              sortable: false,
            },
          ]
        : []),
      {
        disableColumnMenu: true,
        field: "image",
        filterable: false,
        headerName: tStorePhotos("image.label"),
        renderCell: ({
          row: { alt, image },
        }: GridRenderCellParams<StorePhoto>) => (
          <ImageStack direction="row">
            <StyledAvatar
              alt={localize(alt, locale)}
              src={image}
              variant="rounded"
            />
          </ImageStack>
        ),
        sortable: false,
      },
      {
        field: "alt",
        filterOperators: stringFilterOperators,
        headerName: tStorePhotos("alt.label"),
        valueGetter: (_value: unknown, { alt }: StorePhoto) =>
          localize(alt, locale),
      },
      {
        field: "isActive",
        filterOperators: booleanFilterOperators,
        headerName: tStorePhotos("isActive.label"),
        renderCell: ({
          row: { isActive },
        }: GridRenderCellParams<StorePhoto>) => (
          <Chip
            color={isActive ? "success" : "default"}
            label={tStorePhotos(
              isActive ? "isActive.active" : "isActive.inactive",
            )}
            size="small"
            variant="outlined"
          />
        ),
        type: "boolean",
      },
      {
        field: "createdAt",
        filterOperators: dateFilterOperators,
        headerName: tStorePhotos("createdAt"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "short"),
      },
      {
        field: "updatedAt",
        filterOperators: dateFilterOperators,
        headerName: tStorePhotos("updatedAt"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "short"),
      },
    ],
    [
      booleanFilterOperators,
      dateFilterOperators,
      format,
      handleDeleteStorePhoto,
      handleUpdateStorePhoto,
      isReorderMode,
      locale,
      stringFilterOperators,
      tStorePhotos,
      toolbarMode,
    ],
  );

  return (
    <>
      <ToolbarStack direction="row">
        {!toolbarMode && (
          <>
            <Button
              disabled={loading}
              onClick={handleCreateStorePhoto}
              size="small"
              startIcon={<Add />}
              variant="contained"
            >
              {tStorePhotos("actions.createStorePhoto.title")}
            </Button>
            <Button
              disabled={isReorderDisabled}
              onClick={handleEnterReorderMode}
              size="small"
              startIcon={<Sort />}
              variant="outlined"
            >
              {tStorePhotos("actions.reorderStorePhoto.title")}
            </Button>
            <Button
              disabled={!hasSelectableRows}
              onClick={handleEnterBatchDeleteMode}
              size="small"
              startIcon={<Delete />}
              variant="outlined"
            >
              {tStorePhotos("actions.batchDeleteStorePhoto.title")}
            </Button>
          </>
        )}
        {isReorderMode && (
          <>
            <Button
              onClick={handleCancelReorder}
              size="small"
              startIcon={<Cancel />}
              variant="outlined"
            >
              {tStorePhotos("actions.reorderStorePhoto.cancel.label")}
            </Button>
            <Button
              onClick={handleSaveReorder}
              size="small"
              startIcon={<Save />}
              variant="contained"
            >
              {tStorePhotos("actions.reorderStorePhoto.save.label")}
            </Button>
          </>
        )}
        {isSelectMode && (
          <>
            <Button
              onClick={handleCancelBatchDelete}
              size="small"
              startIcon={<Cancel />}
              variant="outlined"
            >
              {tStorePhotos("actions.batchDeleteStorePhoto.cancel.label")}
            </Button>
            <Button
              color="error"
              disabled={!selectedRows.length}
              onClick={handleSubmitBatchDelete}
              size="small"
              startIcon={<Delete />}
              variant="contained"
            >
              {tStorePhotos("actions.batchDeleteStorePhoto.submit.label", {
                count: selectedRows.length,
              })}
            </Button>
          </>
        )}
      </ToolbarStack>
      <DragDropProvider onDragEnd={handleDragEnd}>
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
          slots={{
            ...DATA_GRID_PROPS.slots,
            row: isReorderMode ? Sortable : undefined,
          }}
          sortingMode="server"
          sortModel={sortModel}
        />
      </DragDropProvider>
    </>
  );
};

export default StorePhotos;
