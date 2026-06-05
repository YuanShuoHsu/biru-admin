"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import { DATE_FILTER_OPERATORS, STRING_FILTER_OPERATORS } from "./constants";
import CreateModifierGroupDialog from "./CreateModifierGroupDialog";
import UpdateModifierGroupDialog from "./UpdateModifierGroupDialog";

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

import {
  Add,
  Cancel,
  Delete,
  Edit,
  ListAlt,
  Save,
  Sort,
} from "@mui/icons-material";
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

import type { Menu, ModifierGroup } from "@/types/menus";

import { isFilteredOrSorted } from "@/utils/dataGrid";
import { fetcher } from "@/utils/fetcher";
import { localize } from "@/utils/locale";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface ModifierGroupsProps {
  canWrite: boolean;
  filterField?: string;
  filterOperator?: string;
  filterValue?: string;
  groups: ModifierGroup[];
  menu: Menu;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  rowCount: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

const ModifierGroups = ({
  canWrite,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  groups: initialGroups,
  menu,
  page,
  pageSize,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount,
  sortBy,
  sortDirection,
}: ModifierGroupsProps) => {
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

  const apiRef = useGridApiRef();

  const locale = useLocale();

  const pathname = usePathname();

  const router = useRouter();

  const searchParams = useSearchParams();
  const organization = searchParams.get("organization");

  const {
    data: { data: groups, total: rowCount } = {
      data: initialGroups,
      total: initialRowCount,
    },
    mutate,
    isValidating: loading,
  } = useSWR(
    [
      `/api/menus/${menu.id}/modifier-groups`,
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

      return fetcher<{ data: ModifierGroup[]; total: number }>(
        `/api/menus/${menu.id}/modifier-groups?${new URLSearchParams({
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
      fallbackData: { data: initialGroups, total: initialRowCount },
      onSuccess: () => {
        setTimeout(() => {
          apiRef.current?.autosizeColumns(autosizeOptions);
        }, 0);
      },
    },
  );

  const isReorderDisabled =
    rowCount < 2 || isFilteredOrSorted(filterModel, sortModel);

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
        setIsReorderMode(true);
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
          await fetcher(`/api/menus/${menu.id}/modifier-groups/reorder`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ids: groups.map(({ id }) => id),
              offset: paginationModel.page * paginationModel.pageSize,
            }),
          });

          setIsReorderMode(false);

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
    groups,
    menu.id,
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
        setIsReorderMode(false);

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

    const newGroups = arrayMove(groups, fromIndex, toIndex);
    mutate({ data: newGroups, total: rowCount }, false);
  };

  const handleCreateModifierGroup = useCallback(() => {
    setDialog({
      content: <CreateModifierGroupDialog menuId={menu.id} mutate={mutate} />,
      formId: "create-modifier-group-form",
      open: true,
      title: tMenus("modifierGroups.actions.createGroup.title"),
    });
  }, [menu.id, mutate, setDialog, tMenus]);

  const handleViewModifiers = useCallback(
    (group: ModifierGroup) => {
      const params = new URLSearchParams({
        ...(organization ? { organization } : {}),
        page: "1",
        pageSize: "10",
      });
      router.push(
        `/menus/${menu.id}/modifier-groups/${group.id}?${params.toString()}`,
      );
    },
    [menu.id, organization, router],
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
        headerName: tMenus("modifierGroups.actions.label"),
        renderCell: ({ row }: GridRenderCellParams<ModifierGroup>) => (
          <Stack height="100%" direction="row" alignItems="center" gap={1}>
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
                <ListAlt fontSize="small" />
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
          </Stack>
        ),
        resizable: false,
        sortable: false,
      },
      {
        field: "displayName",
        filterOperators: stringFilterOperators,
        headerName: tMenus("modifierGroups.displayName.label"),
        valueGetter: (_value: unknown, { displayName }: ModifierGroup) =>
          localize(displayName, locale),
      },
      {
        field: "minSelectionCount",
        filterable: false,
        headerName: tMenus("modifierGroups.minSelectionCount.label"),
        sortable: false,
      },
      {
        field: "maxSelectionCount",
        filterable: false,
        headerName: tMenus("modifierGroups.maxSelectionCount.label"),
        renderCell: ({
          row: { maxSelectionCount },
        }: GridRenderCellParams<ModifierGroup>) =>
          maxSelectionCount ??
          tMenus("modifierGroups.maxSelectionCount.unlimited"),
        sortable: false,
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
      handleDeleteModifierGroup,
      handleUpdateModifierGroup,
      handleViewModifiers,
      isReorderMode,
      locale,
      stringFilterOperators,
      tMenus,
    ],
  );

  return (
    <>
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={2}>
        {!isReorderMode ? (
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
          </>
        ) : (
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
      </Stack>
      <DragDropProvider onDragEnd={handleModifierGroupDragEnd}>
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
          rows={groups}
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
