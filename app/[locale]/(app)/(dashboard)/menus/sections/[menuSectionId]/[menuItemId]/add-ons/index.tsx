"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import CreateAddOnDialog from "./CreateAddOnDialog";
import UpdateAddOnDialog from "./UpdateAddOnDialog";

import AuditLogButton from "@/components/AuditLogButton";
import { renderEmptyableCell } from "@/components/EmptyCell";
import { DragHandle, Sortable } from "@/components/Sortable";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import { getPageSizeOptions } from "@/constants/pagination";

import {
  useDateFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { arrayMove } from "@dnd-kit/helpers";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { isSortableOperation } from "@dnd-kit/react/sortable";

import { Add, Cancel, Delete, Edit, Save, Sort } from "@mui/icons-material";
import {
  Button,
  DialogContentText,
  IconButton,
  Stack,
  Tooltip,
} from "@mui/material";
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
  AddOnFilterField,
  AddOnSortField,
  MenuItemAddOn,
} from "@/types/menus";

import {
  getDataGridSearchParams,
  getFilterItemParams,
  isFilteredOrSorted,
} from "@/utils/dataGrid";
import { fetcher } from "@/utils/fetcher";
import { localize } from "@/utils/locale";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface MenuItemAddOnsProps {
  canViewAuditLog: boolean;
  canWrite: boolean;
  filterField?: AddOnFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  menuId: string;
  menuItemId: string;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  rowCount: number;
  rows: MenuItemAddOn[];
  sortBy?: AddOnSortField;
  sortDirection?: SortDirection;
}

const MenuItemAddOns = ({
  canViewAuditLog,
  canWrite,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  menuId,
  menuItemId,
  page,
  pageSize,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount,
  rows: initialRows,
  sortBy,
  sortDirection,
}: MenuItemAddOnsProps) => {
  const [isReorderMode, setIsReorderMode] = useState(false);
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
  const stringFilterOperators = useStringFilterOperators();

  const format = useFormatter();

  const apiRef = useGridApiRef();

  const locale = useLocale();

  const tCommon = useTranslations("common");
  const tMenus = useTranslations("menus");

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
      `/api/menu-items/${menuItemId}/add-ons`,
      filterModel.items[0]?.field,
      filterModel.items[0]?.operator,
      filterModel.items[0]?.value,
      filterModel.quickFilterValues,
      paginationModel.page,
      paginationModel.pageSize,
      sortModel,
    ],
    async () => {
      return fetcher<{
        data: MenuItemAddOn[];
        total: number;
      }>(
        `/api/menu-items/${menuItemId}/add-ons?${getDataGridSearchParams(paginationModel, filterModel, sortModel)}`,
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

  const handleCreateAddOn = useCallback(() => {
    setDialog({
      content: (
        <CreateAddOnDialog
          menuId={menuId}
          menuItemId={menuItemId}
          mutate={mutate}
        />
      ),
      formId: "create-add-on-form",
      open: true,
      title: tMenus("items.addOns.actions.createAddOn.title"),
    });
  }, [menuId, menuItemId, mutate, setDialog, tMenus]);

  const handleUpdateAddOn = useCallback(
    (addOn: MenuItemAddOn) => {
      setDialog({
        content: (
          <UpdateAddOnDialog addOn={addOn} menuId={menuId} mutate={mutate} />
        ),
        formId: "update-add-on-form",
        open: true,
        title: tMenus("items.addOns.actions.updateAddOn.title"),
      });
    },
    [menuId, mutate, setDialog, tMenus],
  );

  const handleDeleteAddOn = useCallback(
    ({
      id,
      addOnMenuItemName,
      addOnMenuItemSectionName,
      addOnMenuSectionName,
    }: MenuItemAddOn) => {
      const displayName = addOnMenuItemName
        ? tMenus("items.addOns.displayName.menuItem", {
            menuSection: localize(addOnMenuItemSectionName, locale),
            menuItem: localize(addOnMenuItemName, locale),
          })
        : tMenus("items.addOns.displayName.menuSection", {
            menuSection: localize(addOnMenuSectionName, locale),
          });

      setDialog({
        content: (
          <DialogContentText>
            {tMenus.rich("items.addOns.actions.deleteAddOn.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              name: displayName,
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          try {
            await fetcher(`/api/menu-items/${menuItemId}/add-ons/${id}`, {
              method: "DELETE",
            });

            enqueueSnackbar(
              tMenus("items.addOns.actions.deleteAddOn.success", {
                name: displayName,
              }),
              { variant: "success" },
            );

            mutate();
          } catch {
            enqueueSnackbar(
              tMenus("items.addOns.actions.deleteAddOn.error", {
                name: displayName,
              }),
              { variant: "error" },
            );
          }
        },
        open: true,
        title: tMenus("items.addOns.actions.deleteAddOn.title"),
      });
    },
    [locale, menuItemId, mutate, setDialog, tMenus],
  );

  const handleEnterReorderMode = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tMenus.rich("items.addOns.actions.reorderAddOn.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        setIsReorderMode(true);
        setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
      },
      open: true,
      title: tMenus("items.addOns.actions.reorderAddOn.title"),
    });
  }, [apiRef, setDialog, tMenus]);

  const handleSaveReorder = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tMenus.rich("items.addOns.actions.reorderAddOn.save.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        try {
          await fetcher(`/api/menu-items/${menuItemId}/add-ons/reorder`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ids: rows.map(({ id }) => id),
              offset: paginationModel.page * paginationModel.pageSize,
            }),
          });

          setIsReorderMode(false);
          setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);

          enqueueSnackbar(
            tMenus("items.addOns.actions.reorderAddOn.save.success"),
            {
              variant: "success",
            },
          );
        } catch {
          mutate();

          enqueueSnackbar(
            tMenus("items.addOns.actions.reorderAddOn.save.error"),
            {
              variant: "error",
            },
          );
        }
      },
      open: true,
      title: tMenus("items.addOns.actions.reorderAddOn.save.label"),
    });
  }, [
    rows,
    apiRef,
    menuItemId,
    mutate,
    paginationModel.page,
    paginationModel.pageSize,
    setDialog,
    tMenus,
  ]);

  const handleCancelReorder = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tMenus.rich("items.addOns.actions.reorderAddOn.cancel.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        setIsReorderMode(false);
        mutate();
      },
      open: true,
      title: tMenus("items.addOns.actions.reorderAddOn.cancel.label"),
    });
  }, [mutate, setDialog, tMenus]);

  const handleDragEnd = ({ operation }: DragEndEvent) => {
    if (!isSortableOperation(operation)) return;

    const { canceled, source } = operation;
    if (canceled || !source) return;

    const fromIndex = source.initialIndex;
    const toIndex = source.index;
    if (fromIndex === toIndex) return;

    const newAddOns = arrayMove(rows, fromIndex, toIndex);
    mutate({ data: newAddOns, total: rowCount }, false);
  };

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
      ...((canWrite || canViewAuditLog) && !isReorderMode
        ? [
            {
              disableColumnMenu: true,
              disableExport: true,
              field: "actions",
              filterable: false,
              headerName: tMenus("items.addOns.actions.label"),
              renderCell: ({ row }: GridRenderCellParams<MenuItemAddOn>) => (
                <Stack
                  height="100%"
                  direction="row"
                  alignItems="center"
                  gap={1}
                >
                  {canWrite && (
                    <Tooltip
                      title={tMenus("items.addOns.actions.updateAddOn.title")}
                    >
                      <IconButton
                        onClick={(event) => {
                          event.stopPropagation();
                          handleUpdateAddOn(row);
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
                      title={tMenus("items.addOns.actions.deleteAddOn.title")}
                    >
                      <IconButton
                        color="error"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeleteAddOn(row);
                        }}
                        size="small"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              ),
              resizable: false,
              sortable: false,
            },
          ]
        : []),
      {
        field: "addOnMenuSectionName",
        filterOperators: stringFilterOperators,
        headerName: `${tMenus("items.addOns.addOnMenuSectionId.label")} ${tCommon("optional")}`,
        renderCell: renderEmptyableCell,
        valueGetter: (
          _value: unknown,
          { addOnMenuSectionName, addOnMenuItemSectionName }: MenuItemAddOn,
        ) => localize(addOnMenuSectionName || addOnMenuItemSectionName, locale),
      },
      {
        field: "addOnMenuItemName",
        filterOperators: stringFilterOperators,
        headerName: `${tMenus("items.addOns.addOnMenuItemId.label")} ${tCommon("optional")}`,
        renderCell: renderEmptyableCell,
        valueGetter: (_value: unknown, { addOnMenuItemName }: MenuItemAddOn) =>
          localize(addOnMenuItemName, locale),
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
      handleDeleteAddOn,
      handleUpdateAddOn,
      isReorderMode,
      locale,
      stringFilterOperators,
      tCommon,
      tMenus,
    ],
  );

  return (
    <>
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={2}>
        {!isReorderMode ? (
          canWrite && (
            <>
              <Button
                onClick={handleCreateAddOn}
                size="small"
                startIcon={<Add />}
                variant="contained"
              >
                {tMenus("items.addOns.actions.createAddOn.title")}
              </Button>
              <Button
                disabled={isReorderDisabled}
                onClick={handleEnterReorderMode}
                size="small"
                startIcon={<Sort />}
                variant="outlined"
              >
                {tMenus("items.addOns.actions.reorderAddOn.title")}
              </Button>
            </>
          )
        ) : (
          <>
            <Button
              onClick={handleCancelReorder}
              size="small"
              startIcon={<Cancel />}
              variant="outlined"
            >
              {tMenus("items.addOns.actions.reorderAddOn.cancel.label")}
            </Button>
            <Button
              onClick={handleSaveReorder}
              size="small"
              startIcon={<Save />}
              variant="contained"
            >
              {tMenus("items.addOns.actions.reorderAddOn.save.label")}
            </Button>
          </>
        )}
      </Stack>
      <DragDropProvider onDragEnd={handleDragEnd}>
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

export default MenuItemAddOns;
