"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import CreateAddOnDialog from "./CreateAddOnDialog";
import UpdateAddOnDialog from "./UpdateAddOnDialog";
import { DATE_FILTER_OPERATORS, STRING_FILTER_OPERATORS } from "./constants";

import DateFilterInputValue from "@/components/DateFilterInputValue";
import { DragHandle, Sortable } from "@/components/Sortable";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";

import { arrayMove } from "@dnd-kit/helpers";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { isSortableOperation } from "@dnd-kit/react/sortable";

import { usePathname, useRouter } from "@/i18n/navigation";

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
  GridFilterOperator,
  GridPaginationModel,
  GridRenderCellParams,
  GridSortModel,
} from "@mui/x-data-grid";
import {
  GridFilterInputMultipleValue,
  GridFilterInputValue,
  useGridApiRef,
} from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { MenuItemAddOn } from "@/types/menus";

import { isFilteredOrSorted } from "@/utils/dataGrid";
import { fetcher } from "@/utils/fetcher";
import { localize } from "@/utils/locale";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface MenuItemAddOnsProps {
  addOns: MenuItemAddOn[];
  canWrite: boolean;
  filterField?: string;
  filterOperator?: string;
  filterValue?: string;
  menuId: string;
  menuItemId: string;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  rowCount: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

const MenuItemAddOns = ({
  addOns: initialAddOns,
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

  const format = useFormatter();
  const locale = useLocale();
  const tCommon = useTranslations("common");
  const tMenus = useTranslations("menus");
  const tToolbar = useTranslations("dataGrid.toolbar");

  const apiRef = useGridApiRef();

  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    data: { data: addOns, total: rowCount } = {
      data: initialAddOns,
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
      const filterItem = filterModel.items[0];
      const quickFilterValue = (filterModel.quickFilterValues || [])
        .join(" ")
        .trim();
      const isNoValueOperator =
        filterItem?.operator &&
        NO_VALUE_FILTER_OPERATORS.includes(filterItem.operator);
      const filterValueString = Array.isArray(filterItem?.value)
        ? filterItem.value.join(",")
        : filterItem?.value;
      const hasFilterValue = Array.isArray(filterItem?.value)
        ? filterItem.value.length > 0
        : !!filterItem?.value;

      return fetcher<{
        data: MenuItemAddOn[];
        total: number;
      }>(
        `/api/menu-items/${menuItemId}/add-ons?${new URLSearchParams({
          limit: String(paginationModel.pageSize),
          offset: String(paginationModel.page * paginationModel.pageSize),
          ...(filterItem?.field &&
            filterItem?.operator &&
            (hasFilterValue || isNoValueOperator) && {
              filterField: filterItem.field,
              filterOperator: filterItem.operator,
              ...(filterValueString && { filterValue: filterValueString }),
            }),
          ...(quickFilterValue && { quickFilterValue }),
          ...(sortModel[0]?.field && { sortBy: sortModel[0].field }),
          ...(sortModel[0]?.sort && { sortDirection: sortModel[0].sort }),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        })}`,
      );
    },
    {
      fallbackData: { data: initialAddOns, total: initialRowCount },
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

      const params = new URLSearchParams({
        ...Object.fromEntries(searchParams),
        page: String(newModel.page + 1),
        pageSize: String(newModel.pageSize),
      });
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const handleSortModelChange = useCallback(
    (newModel: GridSortModel) => {
      setSortModel(newModel);
      setPaginationModel((prev) => ({ ...prev, page: 0 }));

      const sortItem = newModel[0];
      const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        sortBy: _sortBy,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        sortDirection: _sortDirection,
        ...rest
      } = Object.fromEntries(searchParams);
      const params = new URLSearchParams({
        ...rest,
        page: "1",
        ...(sortItem?.field && { sortBy: sortItem.field }),
        ...(sortItem?.sort && { sortDirection: sortItem.sort }),
      });

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
      const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        filterField: _filterField,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        filterOperator: _filterOperator,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        filterValue: _filterValue,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        quickFilterValue: _quickFilterValue,
        ...rest
      } = Object.fromEntries(searchParams);

      const filterValueString = Array.isArray(filterItem?.value)
        ? filterItem.value.join(",")
        : filterItem?.value;
      const hasFilterValue = Array.isArray(filterItem?.value)
        ? filterItem.value.length > 0
        : !!filterItem?.value;
      const isNoValueOperator = filterItem?.operator
        ? NO_VALUE_FILTER_OPERATORS.includes(filterItem.operator)
        : false;

      const params = new URLSearchParams({
        ...rest,
        page: "1",
        ...(filterItem?.field &&
          filterItem?.operator &&
          (hasFilterValue || isNoValueOperator) && {
            filterField: filterItem.field,
            filterOperator: filterItem.operator,
            ...(filterValueString && { filterValue: filterValueString }),
          }),
        ...(newQuickFilterValue && { quickFilterValue: newQuickFilterValue }),
      });
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
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
      title: tMenus("addOns.actions.createAddOn.title"),
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
        title: tMenus("addOns.actions.updateAddOn.title"),
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
        ? tMenus("addOns.displayName.menuItem", {
            menuSection: localize(addOnMenuItemSectionName, locale),
            menuItem: localize(addOnMenuItemName, locale),
          })
        : tMenus("addOns.displayName.menuSection", {
            menuSection: localize(addOnMenuSectionName, locale),
          });

      setDialog({
        content: (
          <DialogContentText>
            {tMenus.rich("addOns.actions.deleteAddOn.confirm", {
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
              tMenus("addOns.actions.deleteAddOn.success", {
                name: displayName,
              }),
              { variant: "success" },
            );

            mutate();
          } catch {
            enqueueSnackbar(
              tMenus("addOns.actions.deleteAddOn.error", { name: displayName }),
              { variant: "error" },
            );
          }
        },
        open: true,
        title: tMenus("addOns.actions.deleteAddOn.title"),
      });
    },
    [locale, menuItemId, mutate, setDialog, tMenus],
  );

  const handleEnterReorderMode = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tMenus.rich("addOns.actions.reorderAddOn.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        setIsReorderMode(true);
        setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
      },
      open: true,
      title: tMenus("addOns.actions.reorderAddOn.title"),
    });
  }, [apiRef, setDialog, tMenus]);

  const handleSaveReorder = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tMenus.rich("addOns.actions.reorderAddOn.save.confirm", {
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
              ids: addOns.map(({ id }) => id),
              offset: paginationModel.page * paginationModel.pageSize,
            }),
          });

          setIsReorderMode(false);
          setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);

          enqueueSnackbar(tMenus("addOns.actions.reorderAddOn.save.success"), {
            variant: "success",
          });
        } catch {
          mutate();

          enqueueSnackbar(tMenus("addOns.actions.reorderAddOn.save.error"), {
            variant: "error",
          });
        }
      },
      open: true,
      title: tMenus("addOns.actions.reorderAddOn.save.label"),
    });
  }, [
    addOns,
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
          {tMenus.rich("addOns.actions.reorderAddOn.cancel.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        setIsReorderMode(false);
        mutate();
      },
      open: true,
      title: tMenus("addOns.actions.reorderAddOn.cancel.label"),
    });
  }, [mutate, setDialog, tMenus]);

  const handleDragEnd = ({ operation }: DragEndEvent) => {
    if (!isSortableOperation(operation)) return;

    const { canceled, source } = operation;
    if (canceled || !source) return;

    const fromIndex = source.initialIndex;
    const toIndex = source.index;
    if (fromIndex === toIndex) return;

    const newAddOns = arrayMove(addOns, fromIndex, toIndex);
    mutate({ data: newAddOns, total: rowCount }, false);
  };

  const stringFilterOperators = useMemo<GridFilterOperator[]>(
    () =>
      STRING_FILTER_OPERATORS.map((value) => ({
        getApplyFilterFn: () => null,
        ...(NO_VALUE_FILTER_OPERATORS.includes(value)
          ? { InputComponent: undefined }
          : value === "isAnyOf"
            ? { InputComponent: GridFilterInputMultipleValue }
            : { InputComponent: GridFilterInputValue }),
        label: tToolbar(`filter.operator.${value}`),
        value,
      })),
    [tToolbar],
  );

  const dateFilterOperators = useMemo<GridFilterOperator[]>(
    () =>
      DATE_FILTER_OPERATORS.map((value) => ({
        getApplyFilterFn: () => null,
        ...(NO_VALUE_FILTER_OPERATORS.includes(value)
          ? { InputComponent: undefined }
          : { InputComponent: DateFilterInputValue }),
        label: tToolbar(`filter.operator.${value}`),
        value,
      })),
    [tToolbar],
  );

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
      ...(canWrite && !isReorderMode
        ? [
            {
              disableColumnMenu: true,
              field: "actions",
              filterable: false,
              headerName: tMenus("addOns.actions.label"),
              renderCell: ({ row }: GridRenderCellParams<MenuItemAddOn>) => (
                <Stack
                  height="100%"
                  direction="row"
                  alignItems="center"
                  gap={1}
                >
                  <Tooltip title={tMenus("addOns.actions.updateAddOn.title")}>
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
                  <Tooltip title={tMenus("addOns.actions.deleteAddOn.title")}>
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
        headerName: `${tMenus("addOns.addOnMenuSectionId.label")} ${tCommon("optional")}`,
        valueGetter: (
          _value: unknown,
          { addOnMenuSectionName, addOnMenuItemSectionName }: MenuItemAddOn,
        ) => localize(addOnMenuSectionName || addOnMenuItemSectionName, locale),
      },
      {
        field: "addOnMenuItemName",
        filterOperators: stringFilterOperators,
        headerName: `${tMenus("addOns.addOnMenuItemId.label")} ${tCommon("optional")}`,
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
                {tMenus("addOns.actions.createAddOn.title")}
              </Button>
              <Button
                disabled={isReorderDisabled}
                onClick={handleEnterReorderMode}
                size="small"
                startIcon={<Sort />}
                variant="outlined"
              >
                {tMenus("addOns.actions.reorderAddOn.title")}
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
              {tMenus("addOns.actions.reorderAddOn.cancel.label")}
            </Button>
            <Button
              onClick={handleSaveReorder}
              size="small"
              startIcon={<Save />}
              variant="contained"
            >
              {tMenus("addOns.actions.reorderAddOn.save.label")}
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
          paginationMode="server"
          paginationModel={paginationModel}
          rowCount={rowCount}
          rows={addOns}
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
