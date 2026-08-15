"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import AttachModifierGroupDialog from "./AttachModifierGroupDialog";

import AuditLogButton from "@/components/AuditLogButton";
import { DragHandle, Sortable } from "@/components/Sortable";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import { getPageSizeOptions } from "@/constants/pagination";

import {
  useDateFilterOperators,
  useNumberFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";

import { arrayMove } from "@dnd-kit/helpers";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { isSortableOperation } from "@dnd-kit/react/sortable";

import { usePathname, useRouter } from "@/i18n/navigation";

import { Add, Cancel, Delete, Save, Sort } from "@mui/icons-material";
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
  MenuItemModifierGroup,
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

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface MenuItemModifierGroupsProps {
  canViewAuditLog: boolean;
  canWrite: boolean;
  filterField?: ModifierGroupFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  links: MenuItemModifierGroup[];
  menuId: string;
  menuItemId: string;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  rowCount: number;
  sortBy?: ModifierGroupSortField;
  sortDirection?: SortDirection;
}

const MenuItemModifierGroups = ({
  canViewAuditLog,
  canWrite,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  links: initialLinks,
  menuId,
  menuItemId,
  page,
  pageSize,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount,
  sortBy,
  sortDirection,
}: MenuItemModifierGroupsProps) => {
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

  const format = useFormatter();
  const locale = useLocale();
  const tMenus = useTranslations("menus");
  const stringFilterOperators = useStringFilterOperators();
  const dateFilterOperators = useDateFilterOperators();
  const numberFilterOperators = useNumberFilterOperators();

  const apiRef = useGridApiRef();

  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    data: { data: links, total: rowCount } = {
      data: initialLinks,
      total: initialRowCount,
    },
    mutate,
    isValidating: loading,
  } = useSWR(
    [
      `/api/menu-items/${menuItemId}/modifier-groups`,
      filterModel.items[0]?.field,
      filterModel.items[0]?.operator,
      filterModel.items[0]?.value,
      filterModel.quickFilterValues,
      paginationModel.page,
      paginationModel.pageSize,
      sortModel,
    ],
    async () => {
      return fetcher<{ data: MenuItemModifierGroup[]; total: number }>(
        `/api/menu-items/${menuItemId}/modifier-groups?${getDataGridSearchParams(paginationModel, filterModel, sortModel)}`,
      );
    },
    {
      fallbackData: { data: initialLinks, total: initialRowCount },
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

      const params = new URLSearchParams(searchParams);
      params.set("page", String(newModel.page + 1));
      params.set("pageSize", String(newModel.pageSize));

      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const handleSortModelChange = useCallback(
    (newModel: GridSortModel) => {
      setSortModel(newModel);
      setPaginationModel((prev) => ({ ...prev, page: 0 }));

      const sortItem = newModel[0];
      const params = new URLSearchParams(searchParams);
      params.delete("sortBy");
      params.delete("sortDirection");
      params.set("page", "1");
      if (sortItem?.field) params.set("sortBy", sortItem.field);
      if (sortItem?.sort) params.set("sortDirection", sortItem.sort);

      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const handleFilterModelChange = useCallback(
    (newModel: GridFilterModel) => {
      setFilterModel(newModel);
      setPaginationModel((prev) => ({ ...prev, page: 0 }));

      const filterItem = newModel.items[0];
      const newQuickFilterValue = (newModel.quickFilterValues || [])
        .join(" ")
        .trim();
      const params = new URLSearchParams(searchParams);
      const { filterField, filterOperator, filterValue } =
        getFilterItemParams(filterItem);
      params.delete("filterField");
      params.delete("filterOperator");
      params.delete("filterValue");
      params.delete("quickFilterValue");
      params.set("page", "1");
      if (filterField) params.set("filterField", filterField);
      if (filterOperator) params.set("filterOperator", filterOperator);
      if (filterValue) params.set("filterValue", filterValue);
      if (newQuickFilterValue)
        params.set("quickFilterValue", newQuickFilterValue);

      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const handleAttach = useCallback(() => {
    setDialog({
      content: (
        <AttachModifierGroupDialog
          menuId={menuId}
          menuItemId={menuItemId}
          mutate={mutate}
        />
      ),
      formId: "attach-modifier-group-form",
      open: true,
      title: tMenus("items.modifierGroups.actions.attach.title"),
    });
  }, [menuId, menuItemId, mutate, setDialog, tMenus]);

  const handleDetach = useCallback(
    ({ id, modifierGroup }: MenuItemModifierGroup) => {
      const displayName = localize(modifierGroup?.displayName, locale);

      setDialog({
        content: (
          <DialogContentText>
            {tMenus.rich("items.modifierGroups.actions.detach.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              name: displayName,
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          try {
            await fetcher(
              `/api/menu-items/${menuItemId}/modifier-groups/${id}`,
              { method: "DELETE" },
            );

            enqueueSnackbar(
              tMenus("items.modifierGroups.actions.detach.success", {
                name: displayName,
              }),
              { variant: "success" },
            );

            mutate();
          } catch {
            enqueueSnackbar(
              tMenus("items.modifierGroups.actions.detach.error", {
                name: displayName,
              }),
              { variant: "error" },
            );
          }
        },
        open: true,
        title: tMenus("items.modifierGroups.actions.detach.title"),
      });
    },
    [locale, menuItemId, mutate, setDialog, tMenus],
  );

  const handleEnterReorderMode = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tMenus.rich("items.modifierGroups.actions.reorder.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        setIsReorderMode(true);
        setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
      },
      open: true,
      title: tMenus("items.modifierGroups.actions.reorder.title"),
    });
  }, [apiRef, setDialog, tMenus]);

  const handleSaveReorder = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tMenus.rich("items.modifierGroups.actions.reorder.save.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        try {
          await fetcher(
            `/api/menu-items/${menuItemId}/modifier-groups/reorder`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ids: links.map(({ id }) => id),
                offset: paginationModel.page * paginationModel.pageSize,
              }),
            },
          );

          setIsReorderMode(false);
          setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);

          enqueueSnackbar(
            tMenus("items.modifierGroups.actions.reorder.save.success"),
            { variant: "success" },
          );
        } catch {
          mutate();

          enqueueSnackbar(
            tMenus("items.modifierGroups.actions.reorder.save.error"),
            { variant: "error" },
          );
        }
      },
      open: true,
      title: tMenus("items.modifierGroups.actions.reorder.save.label"),
    });
  }, [
    apiRef,
    links,
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
          {tMenus.rich("items.modifierGroups.actions.reorder.cancel.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        setIsReorderMode(false);
        mutate();
      },
      open: true,
      title: tMenus("items.modifierGroups.actions.reorder.cancel.label"),
    });
  }, [mutate, setDialog, tMenus]);

  const handleDragEnd = ({ operation }: DragEndEvent) => {
    if (!isSortableOperation(operation)) return;

    const { canceled, source } = operation;
    if (canceled || !source) return;

    const fromIndex = source.initialIndex;
    const toIndex = source.index;
    if (fromIndex === toIndex) return;

    const newLinks = arrayMove(links, fromIndex, toIndex);
    mutate({ data: newLinks, total: rowCount }, false);
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
              field: "actions",
              filterable: false,
              headerName: tMenus("items.modifierGroups.actions.label"),
              renderCell: ({
                row,
              }: GridRenderCellParams<MenuItemModifierGroup>) => (
                <Stack
                  height="100%"
                  direction="row"
                  alignItems="center"
                  gap={1}
                >
                  {canViewAuditLog && <AuditLogButton resourceId={row.id} />}
                  {canWrite && (
                    <Tooltip
                      title={tMenus(
                        "items.modifierGroups.actions.detach.title",
                      )}
                    >
                      <IconButton
                        color="error"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDetach(row);
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
        field: "displayName",
        filterOperators: stringFilterOperators,
        headerName: tMenus("modifierGroups.displayName.label"),
        valueGetter: (
          _value: unknown,
          { modifierGroup }: MenuItemModifierGroup,
        ) => localize(modifierGroup?.displayName, locale),
      },
      {
        field: "minSelectionCount",
        filterOperators: numberFilterOperators,
        headerName: tMenus("modifierGroups.minSelectionCount.label"),
        valueGetter: (
          _value: unknown,
          { modifierGroup }: MenuItemModifierGroup,
        ) => modifierGroup?.minSelectionCount,
      },
      {
        field: "maxSelectionCount",
        filterOperators: numberFilterOperators,
        headerName: tMenus("modifierGroups.maxSelectionCount.label"),
        valueGetter: (
          _value: unknown,
          { modifierGroup }: MenuItemModifierGroup,
        ) =>
          modifierGroup?.maxSelectionCount ??
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
      handleDetach,
      isReorderMode,
      locale,
      numberFilterOperators,
      stringFilterOperators,
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
                onClick={handleAttach}
                size="small"
                startIcon={<Add />}
                variant="contained"
              >
                {tMenus("items.modifierGroups.actions.attach.title")}
              </Button>
              <Button
                disabled={isReorderDisabled}
                onClick={handleEnterReorderMode}
                size="small"
                startIcon={<Sort />}
                variant="outlined"
              >
                {tMenus("items.modifierGroups.actions.reorder.title")}
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
              {tMenus("items.modifierGroups.actions.reorder.cancel.label")}
            </Button>
            <Button
              onClick={handleSaveReorder}
              size="small"
              startIcon={<Save />}
              variant="contained"
            >
              {tMenus("items.modifierGroups.actions.reorder.save.label")}
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
          rows={links}
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

export default MenuItemModifierGroups;
