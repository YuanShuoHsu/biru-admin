"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import {
  DATE_FILTER_OPERATORS,
  NO_VALUE_FILTER_OPERATORS,
  STRING_FILTER_OPERATORS,
} from "./constants";
import CreateMenuItemDialog from "./CreateMenuItemDialog";
import UpdateMenuItemDialog from "./UpdateMenuItemDialog";

import { DragHandle, Sortable } from "@/components/Sortable";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";

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
import { GridFilterInputValue, useGridApiRef } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { MenuItem } from "@/types/menus";

import { fetcher } from "@/utils/fetcher";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

const DateFilterInputValue = (
  props: React.ComponentProps<typeof GridFilterInputValue>,
) => <GridFilterInputValue {...props} type="date" />;

interface MenusMenuIdSectionIdProps {
  filterField?: string;
  filterOperator?: string;
  filterValue?: string;
  items: MenuItem[];
  page: number;
  pageSize: number;
  rowCount: number;
  sectionId: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

const MenusMenuIdSectionId = ({
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  items: initialItems,
  page,
  pageSize,
  rowCount: initialRowCount,
  sectionId,
  sortBy,
  sortDirection,
}: MenusMenuIdSectionIdProps) => {
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
              value: initialFilterValue,
            },
          ]
        : [],
  });

  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const apiRef = useGridApiRef();

  const pathname = usePathname();

  const router = useRouter();

  const searchParams = useSearchParams();

  const {
    data: { data: items, total: rowCount } = {
      data: initialItems,
      total: initialRowCount,
    },
    mutate: mutateItems,
    isValidating,
  } = useSWR(
    [
      `/api/menu-sections/${sectionId}/menu-items`,
      filterModel.items[0]?.field,
      filterModel.items[0]?.operator,
      filterModel.items[0]?.value,
      paginationModel.page,
      paginationModel.pageSize,
      sortModel,
    ],
    async ([
      url,
      filterField,
      filterOperator,
      filterValue,
      page,
      pageSize,
      sortModel,
    ]: [
      string,
      string | undefined,
      string | undefined,
      string | undefined,
      number,
      number,
      GridSortModel,
    ]) =>
      fetcher<{ data: MenuItem[]; total: number }>(
        `${url}?${new URLSearchParams({
          limit: String(pageSize),
          offset: String(page * pageSize),
          ...(filterField &&
            filterOperator &&
            (filterValue ||
              NO_VALUE_FILTER_OPERATORS.includes(filterOperator)) && {
              filterField,
              filterOperator,
              ...(filterValue && { filterValue }),
            }),
          ...(sortModel[0]?.field && { sortBy: sortModel[0].field }),
          ...(sortModel[0]?.sort && { sortDirection: sortModel[0].sort }),
        })}`,
      ),
    {
      fallbackData: { data: initialItems, total: initialRowCount },
      onSuccess: () => {
        setTimeout(() => {
          apiRef.current?.autosizeColumns(autosizeOptions);
        }, 0);
      },
    },
  );

  const tMenus = useTranslations("menus");
  const tToolbar = useTranslations("dataGrid.toolbar");

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

  const stringFilterOperators = useMemo<GridFilterOperator[]>(
    () =>
      STRING_FILTER_OPERATORS.map((value) => ({
        getApplyFilterFn: () => null,
        ...(NO_VALUE_FILTER_OPERATORS.includes(value)
          ? { requiresFilterValue: false }
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
          ? { requiresFilterValue: false }
          : { InputComponent: DateFilterInputValue }),
        label: tToolbar(`filter.operator.${value}`),
        value,
      })),
    [tToolbar],
  );

  const handleFilterModelChange = useCallback(
    (newModel: GridFilterModel) => {
      setFilterModel(newModel);
      setPaginationModel((prev) => ({ ...prev, page: 0 }));

      const filterItem = newModel.items[0];
      const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        filterField: _filterField,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        filterOperator: _filterOperator,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        filterValue: _filterValue,
        ...rest
      } = Object.fromEntries(searchParams);

      const params = new URLSearchParams({
        ...rest,
        page: "1",
        ...(filterItem?.field &&
          filterItem?.operator &&
          (filterItem?.value ||
            NO_VALUE_FILTER_OPERATORS.includes(filterItem.operator)) && {
            filterField: filterItem.field,
            filterOperator: filterItem.operator,
            ...(filterItem?.value && { filterValue: filterItem.value }),
          }),
      });
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const handleEnterReorderMode = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tMenus("items.actions.reorderItem.confirm")}
        </DialogContentText>
      ),
      onConfirm: async () => {
        setIsReorderMode(true);

        setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
      },
      open: true,
      title: tMenus("items.actions.reorderItem.title"),
    });
  }, [apiRef, setDialog, tMenus]);

  const handleSaveReorder = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tMenus("items.actions.reorderItem.save.confirm")}
        </DialogContentText>
      ),
      onConfirm: async () => {
        try {
          await fetcher(`/api/menu-sections/${sectionId}/menu-items/reorder`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ids: items.map(({ id }) => id),
              offset: paginationModel.page * paginationModel.pageSize,
            }),
          });

          setIsReorderMode(false);

          setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);

          enqueueSnackbar(tMenus("items.actions.reorderItem.save.success"), {
            variant: "success",
          });
        } catch {
          mutateItems();

          enqueueSnackbar(tMenus("items.actions.reorderItem.save.error"), {
            variant: "error",
          });
        }
      },
      open: true,
      title: tMenus("items.actions.reorderItem.save.label"),
    });
  }, [
    apiRef,
    items,
    mutateItems,
    paginationModel.page,
    paginationModel.pageSize,
    sectionId,
    setDialog,
    tMenus,
  ]);

  const handleCancelReorder = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tMenus("items.actions.reorderItem.cancel.confirm")}
        </DialogContentText>
      ),
      onConfirm: async () => {
        setIsReorderMode(false);

        mutateItems();
      },
      open: true,
      title: tMenus("items.actions.reorderItem.cancel.label"),
    });
  }, [mutateItems, setDialog, tMenus]);

  const handleDragEnd = ({ operation }: DragEndEvent) => {
    if (!isSortableOperation(operation)) return;

    const { canceled, source } = operation;
    if (canceled || !source) return;

    const fromIndex = source.initialIndex;
    const toIndex = source.index;
    if (fromIndex === toIndex) return;

    const newItems = arrayMove(items, fromIndex, toIndex);
    mutateItems({ data: newItems, total: rowCount }, false);
  };

  const handleCreateItem = useCallback(() => {
    setDialog({
      content: (
        <CreateMenuItemDialog mutateItems={mutateItems} sectionId={sectionId} />
      ),
      formId: "create-menu-item-form",
      open: true,
      title: tMenus("items.actions.createItem.title"),
    });
  }, [mutateItems, sectionId, setDialog, tMenus]);

  const handleUpdateItem = useCallback(
    (item: MenuItem) => {
      setDialog({
        content: <UpdateMenuItemDialog item={item} mutateItems={mutateItems} />,
        formId: "update-menu-item-form",
        open: true,
        title: tMenus("items.actions.updateItem.title"),
      });
    },
    [mutateItems, setDialog, tMenus],
  );

  const handleDeleteItem = useCallback(
    ({ id, name }: MenuItem) => {
      setDialog({
        content: (
          <DialogContentText>
            {tMenus.rich("items.actions.deleteItem.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              name,
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          try {
            await fetcher(`/api/menu-items/${id}`, { method: "DELETE" });

            enqueueSnackbar(
              tMenus("items.actions.deleteItem.success", { name }),
              { variant: "success" },
            );

            mutateItems();
          } catch {
            enqueueSnackbar(
              tMenus("items.actions.deleteItem.error", { name }),
              { variant: "error" },
            );
          }
        },
        open: true,
        title: tMenus("items.actions.deleteItem.title"),
      });
    },
    [mutateItems, setDialog, tMenus],
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
      {
        disableColumnMenu: true,
        field: "actions",
        filterable: false,
        headerName: tMenus("items.actions.label"),
        renderCell: ({ row }: GridRenderCellParams<MenuItem>) => (
          <Stack height="100%" direction="row" alignItems="center" gap={1}>
            <Tooltip title={tMenus("items.actions.updateItem.title")}>
              <IconButton
                onClick={(event) => {
                  event.stopPropagation();

                  handleUpdateItem(row);
                }}
                size="small"
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={tMenus("items.actions.deleteItem.title")}>
              <IconButton
                color="error"
                onClick={(event) => {
                  event.stopPropagation();

                  handleDeleteItem(row);
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
      {
        field: "name",
        filterOperators: stringFilterOperators,
        headerName: tMenus("items.name.label"),
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
      dateFilterOperators,
      format,
      handleDeleteItem,
      handleUpdateItem,
      isReorderMode,
      stringFilterOperators,
      tMenus,
    ],
  );

  return (
    <>
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={2}>
        {!isReorderMode ? (
          <>
            <Button
              onClick={handleCreateItem}
              size="small"
              startIcon={<Add />}
              variant="contained"
            >
              {tMenus("items.actions.createItem.title")}
            </Button>
            <Button
              disabled={rowCount < 2}
              onClick={handleEnterReorderMode}
              size="small"
              startIcon={<Sort />}
              variant="outlined"
            >
              {tMenus("items.actions.reorderItem.title")}
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={handleCancelReorder}
              size="small"
              startIcon={<Cancel />}
              variant="outlined"
            >
              {tMenus("items.actions.reorderItem.cancel.label")}
            </Button>
            <Button
              onClick={handleSaveReorder}
              size="small"
              startIcon={<Save />}
              variant="contained"
            >
              {tMenus("items.actions.reorderItem.save.label")}
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
          loading={isValidating}
          onFilterModelChange={handleFilterModelChange}
          onPaginationModelChange={handlePaginationModelChange}
          onSortModelChange={handleSortModelChange}
          paginationMode="server"
          paginationModel={paginationModel}
          rowCount={rowCount}
          rows={items}
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

export default MenusMenuIdSectionId;
