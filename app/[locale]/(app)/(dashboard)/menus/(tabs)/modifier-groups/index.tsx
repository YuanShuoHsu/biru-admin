"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import CreateModifierGroupDialog from "./CreateModifierGroupDialog";
import UpdateModifierGroupDialog from "./UpdateModifierGroupDialog";

import AuditLogButton from "@/components/AuditLogButton";
import DataGrid from "@/components/DataGrid";
import { DragHandle, Sortable } from "@/components/Sortable";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGINATION_QUERY,
  getPageSizeOptions,
} from "@/constants/pagination";

import { arrayMove } from "@dnd-kit/helpers";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { isSortableOperation } from "@dnd-kit/react/sortable";

import {
  useDateFilterOperators,
  useNumberFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
import { useRowSelection } from "@/hooks/useRowSelection";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { useRouter } from "@/i18n/navigation";

import {
  Add,
  Cancel,
  Checklist,
  Delete,
  Edit,
  Save,
  Sort,
} from "@mui/icons-material";
import {
  Button,
  DialogContentText,
  IconButton,
  List,
  ListItem,
  ListItemText,
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
  FilterOperator,
  SortDirection,
  ToolbarMode,
} from "@/types/dataGrid";
import type {
  Menu,
  ModifierGroup,
  ModifierGroupFilterField,
  ModifierGroupSortField,
} from "@/types/menus";

import {
  getDataGridSearchParams,
  getFilterItemParams,
  isFilteredOrSorted,
} from "@/utils/dataGrid";
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

const ToolbarStack = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  alignItems: "center",
  gap: theme.spacing(2),
}));

interface ModifierGroupsProps {
  canViewAuditLog?: boolean;
  canWrite?: boolean;
  filterField?: ModifierGroupFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  loading?: boolean;
  menu?: Menu;
  page?: number;
  pageSize?: number;
  quickFilterValue?: string;
  rowCount?: number;
  rows?: ModifierGroup[];
  sortBy?: ModifierGroupSortField;
  sortDirection?: SortDirection;
}

const ModifierGroups = ({
  canViewAuditLog = false,
  canWrite = false,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  loading = false,
  menu,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount = 0,
  rows: initialRows = [],
  sortBy,
  sortDirection,
}: ModifierGroupsProps) => {
  const menuId = menu?.id ?? "";

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

  const dateFilterOperators = useDateFilterOperators();
  const numberFilterOperators = useNumberFilterOperators();
  const stringFilterOperators = useStringFilterOperators();

  const format = useFormatter();

  const apiRef = useGridApiRef();

  const locale = useLocale();

  const router = useRouter();

  const searchParams = useSearchParams();
  const organization = searchParams.get("organization");

  const tCommon = useTranslations("common");
  const tMenus = useTranslations("menus");

  const updateQuery = useUpdateQuery();

  const {
    data: { data: rows, total: rowCount } = {
      data: initialRows,
      total: initialRowCount,
    },
    mutate,
    isValidating,
  } = useSWR(
    !loading && [
      `/api/menus/${menuId}/modifier-groups`,
      filterModel.items[0]?.field,
      filterModel.items[0]?.operator,
      filterModel.items[0]?.value,
      filterModel.quickFilterValues,
      paginationModel.page,
      paginationModel.pageSize,
      sortModel,
    ],
    async () => {
      return fetcher<{ data: ModifierGroup[]; total: number }>(
        `/api/menus/${menuId}/modifier-groups?${getDataGridSearchParams(paginationModel, filterModel, sortModel)}`,
      );
    },
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

  const handleEnterModifierGroupReorderMode = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tMenus.rich("modifierGroups.actions.reorderGroup.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        setToolbarMode("reorder");
        setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
      },
      open: true,
      title: tMenus("modifierGroups.actions.reorderGroup.title"),
    });
  }, [apiRef, setDialog, tMenus]);

  const handleSaveModifierGroupReorder = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tMenus.rich("modifierGroups.actions.reorderGroup.save.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        try {
          await fetcher(`/api/menus/${menuId}/modifier-groups/reorder`, {
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
            tMenus("modifierGroups.actions.reorderGroup.save.success"),
            { variant: "success" },
          );
        } catch {
          mutate();

          enqueueSnackbar(
            tMenus("modifierGroups.actions.reorderGroup.save.error"),
            { variant: "error" },
          );
        }
      },
      open: true,
      title: tMenus("modifierGroups.actions.reorderGroup.save.label"),
    });
  }, [
    apiRef,
    rows,
    menuId,
    mutate,
    paginationModel.page,
    paginationModel.pageSize,
    setDialog,
    tMenus,
  ]);

  const handleCancelModifierGroupReorder = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tMenus.rich("modifierGroups.actions.reorderGroup.cancel.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        setToolbarMode(null);

        mutate();
      },
      open: true,
      title: tMenus("modifierGroups.actions.reorderGroup.cancel.label"),
    });
  }, [mutate, setDialog, tMenus]);

  const handleModifierGroupDragEnd = ({ operation }: DragEndEvent) => {
    if (!isSortableOperation(operation)) return;

    const { canceled, source } = operation;
    if (canceled || !source) return;

    const fromIndex = source.initialIndex;
    const toIndex = source.index;
    if (fromIndex === toIndex) return;

    const newGroups = arrayMove(rows, fromIndex, toIndex);
    mutate({ data: newGroups, total: rowCount }, false);
  };

  const handleCreateModifierGroup = useCallback(() => {
    setDialog({
      content: <CreateModifierGroupDialog menuId={menuId} mutate={mutate} />,
      formId: "create-modifier-group-form",
      open: true,
      title: tMenus("modifierGroups.actions.createGroup.title"),
    });
  }, [menuId, mutate, setDialog, tMenus]);

  const handleViewModifiers = useCallback(
    (group: ModifierGroup) => {
      const params = new URLSearchParams({
        ...(organization && { organization }),
        ...DEFAULT_PAGINATION_QUERY,
      });
      router.push(`/menus/modifier-groups/${group.id}?${params.toString()}`);
    },
    [organization, router],
  );

  const handleUpdateModifierGroup = useCallback(
    (group: ModifierGroup) => {
      setDialog({
        content: <UpdateModifierGroupDialog group={group} mutate={mutate} />,
        formId: "update-modifier-group-form",
        open: true,
        title: tMenus("modifierGroups.actions.updateGroup.title"),
      });
    },
    [mutate, setDialog, tMenus],
  );

  const handleDeleteModifierGroup = useCallback(
    ({ id, displayName }: ModifierGroup) => {
      const name = localize(displayName, locale);

      setDialog({
        content: (
          <DialogContentText>
            {tMenus.rich("modifierGroups.actions.deleteGroup.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              name,
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          try {
            await fetcher(`/api/modifier-groups/${id}`, { method: "DELETE" });

            enqueueSnackbar(
              tMenus("modifierGroups.actions.deleteGroup.success", {
                name,
              }),
              { variant: "success" },
            );

            mutate();
          } catch {
            enqueueSnackbar(
              tMenus("modifierGroups.actions.deleteGroup.error", {
                name,
              }),
              { variant: "error" },
            );
          }
        },
        open: true,
        title: tMenus("modifierGroups.actions.deleteGroup.title"),
      });
    },
    [locale, mutate, setDialog, tMenus],
  );

  const handleEnterModifierGroupBatchDeleteMode = useCallback(() => {
    setToolbarMode("select");
    setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
  }, [apiRef]);

  const handleSubmitModifierGroupBatchDelete = useCallback(() => {
    const count = selectedRows.length;

    setDialog({
      content: (
        <ConfirmStack>
          <DialogContentText>
            {tMenus.rich(
              "modifierGroups.actions.batchDeleteGroup.submit.confirm",
              {
                bold: (chunks) => <strong>{chunks}</strong>,
                count,
              },
            )}
          </DialogContentText>
          <List dense disablePadding>
            {selectedRows.map(({ displayName, id }) => (
              <ListItem disableGutters key={id}>
                <ListItemText primary={localize(displayName, locale)} />
              </ListItem>
            ))}
          </List>
        </ConfirmStack>
      ),
      onConfirm: async () => {
        try {
          await fetcher(`/api/menus/${menuId}/modifier-groups`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: selectedRows.map(({ id }) => id) }),
          });

          setToolbarMode(null);
          clearRowSelection();

          setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);

          enqueueSnackbar(
            tMenus("modifierGroups.actions.batchDeleteGroup.submit.success", {
              count,
            }),
            {
              variant: "success",
            },
          );
        } catch {
          enqueueSnackbar(
            tMenus("modifierGroups.actions.batchDeleteGroup.submit.error"),
            { variant: "error" },
          );
        }

        mutate();
      },
      open: true,
      title: tMenus("modifierGroups.actions.batchDeleteGroup.submit.label", {
        count,
      }),
    });
  }, [
    apiRef,
    clearRowSelection,
    locale,
    menuId,
    mutate,
    selectedRows,
    setDialog,
    tMenus,
  ]);

  const handleCancelModifierGroupBatchDelete = useCallback(() => {
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
              headerName: tMenus("reorder"),
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
              headerName: tMenus("modifierGroups.actions.label"),
              renderCell: ({ row }: GridRenderCellParams<ModifierGroup>) => (
                <ActionsStack direction="row">
                  <Tooltip
                    title={tMenus("modifierGroups.actions.viewModifiers.title")}
                  >
                    <IconButton
                      onClick={(event) => {
                        event.stopPropagation();

                        handleViewModifiers(row);
                      }}
                      size="small"
                    >
                      <Checklist fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {canWrite && (
                    <Tooltip
                      title={tMenus("modifierGroups.actions.updateGroup.title")}
                    >
                      <IconButton
                        onClick={(event) => {
                          event.stopPropagation();

                          handleUpdateModifierGroup(row);
                        }}
                        size="small"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {canViewAuditLog && <AuditLogButton resourceId={row.id} />}
                  {canWrite && (
                    <Tooltip
                      title={tMenus("modifierGroups.actions.deleteGroup.title")}
                    >
                      <IconButton
                        color="error"
                        onClick={(event) => {
                          event.stopPropagation();

                          handleDeleteModifierGroup(row);
                        }}
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
        field: "displayName",
        filterOperators: stringFilterOperators,
        headerName: tMenus("modifierGroups.displayName.label"),
        valueGetter: (_value: unknown, { displayName }: ModifierGroup) =>
          localize(displayName, locale),
      },
      {
        field: "minSelectionCount",
        filterOperators: numberFilterOperators,
        headerName: `${tMenus("modifierGroups.minSelectionCount.label")} ${tCommon("optional")}`,
      },
      {
        field: "maxSelectionCount",
        filterOperators: numberFilterOperators,
        headerName: `${tMenus("modifierGroups.maxSelectionCount.label")} ${tCommon("optional")}`,
        renderCell: ({
          row: { maxSelectionCount },
        }: GridRenderCellParams<ModifierGroup>) =>
          maxSelectionCount ??
          tMenus("modifierGroups.maxSelectionCount.unlimited"),
      },
      {
        field: "createdAt",
        filterOperators: dateFilterOperators,
        headerName: tMenus("createdAt"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "short"),
      },
      {
        field: "updatedAt",
        filterOperators: dateFilterOperators,
        headerName: tMenus("updatedAt"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "short"),
      },
    ],
    [
      canViewAuditLog,
      canWrite,
      dateFilterOperators,
      format,
      handleDeleteModifierGroup,
      handleUpdateModifierGroup,
      handleViewModifiers,
      isReorderMode,
      locale,
      numberFilterOperators,
      stringFilterOperators,
      tCommon,
      tMenus,
      toolbarMode,
    ],
  );

  return (
    <>
      <ToolbarStack direction="row">
        {!toolbarMode && (
          <>
            {canWrite && (
              <Button
                onClick={handleCreateModifierGroup}
                size="small"
                startIcon={<Add />}
                variant="contained"
              >
                {tMenus("modifierGroups.actions.createGroup.title")}
              </Button>
            )}
            {canWrite && (
              <Button
                disabled={isReorderDisabled}
                onClick={handleEnterModifierGroupReorderMode}
                size="small"
                startIcon={<Sort />}
                variant="outlined"
              >
                {tMenus("modifierGroups.actions.reorderGroup.title")}
              </Button>
            )}
            {canWrite && (
              <Button
                disabled={!hasSelectableRows}
                onClick={handleEnterModifierGroupBatchDeleteMode}
                size="small"
                startIcon={<Delete />}
                variant="outlined"
              >
                {tMenus("modifierGroups.actions.batchDeleteGroup.title")}
              </Button>
            )}
          </>
        )}
        {isReorderMode && (
          <>
            <Button
              onClick={handleCancelModifierGroupReorder}
              size="small"
              startIcon={<Cancel />}
              variant="outlined"
            >
              {tMenus("modifierGroups.actions.reorderGroup.cancel.label")}
            </Button>
            <Button
              onClick={handleSaveModifierGroupReorder}
              size="small"
              startIcon={<Save />}
              variant="contained"
            >
              {tMenus("modifierGroups.actions.reorderGroup.save.label")}
            </Button>
          </>
        )}
        {isSelectMode && (
          <>
            <Button
              onClick={handleCancelModifierGroupBatchDelete}
              size="small"
              startIcon={<Cancel />}
              variant="outlined"
            >
              {tMenus("modifierGroups.actions.batchDeleteGroup.cancel.label")}
            </Button>
            <Button
              color="error"
              disabled={!selectedRows.length}
              onClick={handleSubmitModifierGroupBatchDelete}
              size="small"
              startIcon={<Delete />}
              variant="contained"
            >
              {tMenus("modifierGroups.actions.batchDeleteGroup.submit.label", {
                count: selectedRows.length,
              })}
            </Button>
          </>
        )}
      </ToolbarStack>
      <DragDropProvider onDragEnd={handleModifierGroupDragEnd}>
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

export default ModifierGroups;
