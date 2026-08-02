"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import CreateModifierDialog from "./CreateModifierDialog";
import UpdateModifierDialog from "./UpdateModifierDialog";

import { DragHandle, Sortable } from "@/components/Sortable";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import { getPageSizeOptions } from "@/constants/pagination";

import { ITEM_AVAILABILITY_COLOR_MAP } from "@/constants/itemAvailability";

import { arrayMove } from "@dnd-kit/helpers";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { isSortableOperation } from "@dnd-kit/react/sortable";

import {
  useDateFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";

import { usePathname, useRouter } from "@/i18n/navigation";

import { Add, Cancel, Delete, Edit, Save, Sort } from "@mui/icons-material";
import {
  Button,
  Chip,
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
  Modifier,
  ModifierFilterField,
  ModifierGroup,
  ModifierSortField,
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

interface ModifiersProps {
  canWrite: boolean;
  filterField?: ModifierFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  group: ModifierGroup;
  modifiers: Modifier[];
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  rowCount: number;
  sortBy?: ModifierSortField;
  sortDirection?: SortDirection;
}

const Modifiers = ({
  canWrite,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  group,
  modifiers: initialModifiers,
  page,
  pageSize,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount,
  sortBy,
  sortDirection,
}: ModifiersProps) => {
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

  const pathname = usePathname();

  const router = useRouter();

  const searchParams = useSearchParams();

  const tCommon = useTranslations("common");
  const tMenus = useTranslations("menus");
  const tOrder = useTranslations("order");

  const {
    data: { data: modifiers, total: rowCount } = {
      data: initialModifiers,
      total: initialRowCount,
    },
    mutate,
    isValidating: loading,
  } = useSWR(
    [
      `/api/modifier-groups/${group.id}/modifiers`,
      filterModel.items[0]?.field,
      filterModel.items[0]?.operator,
      filterModel.items[0]?.value,
      filterModel.quickFilterValues,
      paginationModel.page,
      paginationModel.pageSize,
      sortModel,
    ],
    async () => {
      return fetcher<{ data: Modifier[]; total: number }>(
        `/api/modifier-groups/${group.id}/modifiers?${getDataGridSearchParams(paginationModel, filterModel, sortModel)}`,
      );
    },
    {
      fallbackData: { data: initialModifiers, total: initialRowCount },
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

      const params = new URLSearchParams({
        ...rest,
        page: "1",
        ...getFilterItemParams(filterItem),
        ...(newQuickFilterValue && { quickFilterValue: newQuickFilterValue }),
      });
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const handleEnterReorderMode = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tMenus.rich("modifiers.actions.reorderModifier.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        setIsReorderMode(true);
        setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
      },
      open: true,
      title: tMenus("modifiers.actions.reorderModifier.title"),
    });
  }, [apiRef, setDialog, tMenus]);

  const handleSaveReorder = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tMenus.rich("modifiers.actions.reorderModifier.save.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        try {
          await fetcher(`/api/modifier-groups/${group.id}/modifiers/reorder`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ids: modifiers.map(({ id }) => id),
              offset: paginationModel.page * paginationModel.pageSize,
            }),
          });

          setIsReorderMode(false);

          setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);

          enqueueSnackbar(
            tMenus("modifiers.actions.reorderModifier.save.success"),
            { variant: "success" },
          );
        } catch {
          mutate();

          enqueueSnackbar(
            tMenus("modifiers.actions.reorderModifier.save.error"),
            { variant: "error" },
          );
        }
      },
      open: true,
      title: tMenus("modifiers.actions.reorderModifier.save.label"),
    });
  }, [
    apiRef,
    group.id,
    modifiers,
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
          {tMenus.rich("modifiers.actions.reorderModifier.cancel.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        setIsReorderMode(false);

        mutate();
      },
      open: true,
      title: tMenus("modifiers.actions.reorderModifier.cancel.label"),
    });
  }, [mutate, setDialog, tMenus]);

  const handleDragEnd = ({ operation }: DragEndEvent) => {
    if (!isSortableOperation(operation)) return;

    const { canceled, source } = operation;
    if (canceled || !source) return;

    const fromIndex = source.initialIndex;
    const toIndex = source.index;
    if (fromIndex === toIndex) return;

    const newModifiers = arrayMove(modifiers, fromIndex, toIndex);
    mutate({ data: newModifiers, total: rowCount }, false);
  };

  const handleCreateModifier = useCallback(() => {
    setDialog({
      content: (
        <CreateModifierDialog modifierGroupId={group.id} mutate={mutate} />
      ),
      formId: "create-modifier-form",
      open: true,
      title: tMenus("modifiers.actions.createModifier.title"),
    });
  }, [group.id, mutate, setDialog, tMenus]);

  const handleUpdateModifier = useCallback(
    (modifier: Modifier) => {
      setDialog({
        content: <UpdateModifierDialog modifier={modifier} mutate={mutate} />,
        formId: "update-modifier-form",
        open: true,
        title: tMenus("modifiers.actions.updateModifier.title"),
      });
    },
    [mutate, setDialog, tMenus],
  );

  const handleDeleteModifier = useCallback(
    ({ id, displayName }: Modifier) => {
      const name = localize(displayName, locale);

      setDialog({
        content: (
          <DialogContentText>
            {tMenus.rich("modifiers.actions.deleteModifier.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              name,
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          try {
            await fetcher(`/api/modifiers/${id}`, { method: "DELETE" });

            enqueueSnackbar(
              tMenus("modifiers.actions.deleteModifier.success", {
                name,
              }),
              { variant: "success" },
            );

            mutate();
          } catch {
            enqueueSnackbar(
              tMenus("modifiers.actions.deleteModifier.error", {
                name,
              }),
              { variant: "error" },
            );
          }
        },
        open: true,
        title: tMenus("modifiers.actions.deleteModifier.title"),
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
        headerName: tMenus("modifiers.actions.label"),
        renderCell: ({ row }: GridRenderCellParams<Modifier>) => (
          <Stack height="100%" direction="row" alignItems="center" gap={1}>
            {canWrite && (
              <Tooltip title={tMenus("modifiers.actions.updateModifier.title")}>
                <IconButton
                  onClick={(event) => {
                    event.stopPropagation();

                    handleUpdateModifier(row);
                  }}
                  size="small"
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canWrite && (
              <Tooltip title={tMenus("modifiers.actions.deleteModifier.title")}>
                <IconButton
                  color="error"
                  onClick={(event) => {
                    event.stopPropagation();

                    handleDeleteModifier(row);
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
        headerName: tMenus("modifiers.displayName.label"),
        valueGetter: (_value: unknown, { displayName }: Modifier) =>
          localize(displayName, locale),
      },
      {
        field: "priceAdjustment",
        filterable: false,
        headerName: tMenus("modifiers.priceAdjustment.label"),
        renderCell: ({
          row: { priceAdjustment },
        }: GridRenderCellParams<Modifier>) => priceAdjustment ?? "—",
        sortable: false,
      },
      {
        field: "availability",
        filterable: false,
        headerName: tMenus("availability.label"),
        renderCell: ({
          row: { availability },
        }: GridRenderCellParams<Modifier>) =>
          availability && (
            <Chip
              color={ITEM_AVAILABILITY_COLOR_MAP[availability]}
              label={tMenus(`availability.options.${availability}`)}
              size="small"
              variant="outlined"
            />
          ),
        sortable: false,
      },
      {
        field: "availableModes",
        filterable: false,
        headerName: tMenus("availableModes.label"),
        valueFormatter: (_value: unknown, { availableModes }: Modifier) =>
          availableModes
            .map((mode) => tOrder(`mode.${mode}.label`))
            .join(tCommon("delimiter")),
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
      handleDeleteModifier,
      handleUpdateModifier,
      isReorderMode,
      locale,
      stringFilterOperators,
      tCommon,
      tMenus,
      tOrder,
    ],
  );

  return (
    <>
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={2}>
        {!isReorderMode ? (
          <>
            {canWrite && (
              <Button
                onClick={handleCreateModifier}
                size="small"
                startIcon={<Add />}
                variant="contained"
              >
                {tMenus("modifiers.actions.createModifier.title")}
              </Button>
            )}
            {canWrite && (
              <Button
                disabled={isReorderDisabled}
                onClick={handleEnterReorderMode}
                size="small"
                startIcon={<Sort />}
                variant="outlined"
              >
                {tMenus("modifiers.actions.reorderModifier.title")}
              </Button>
            )}
          </>
        ) : (
          <>
            <Button
              onClick={handleCancelReorder}
              size="small"
              startIcon={<Cancel />}
              variant="outlined"
            >
              {tMenus("modifiers.actions.reorderModifier.cancel.label")}
            </Button>
            <Button
              onClick={handleSaveReorder}
              size="small"
              startIcon={<Save />}
              variant="contained"
            >
              {tMenus("modifiers.actions.reorderModifier.save.label")}
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
          rows={modifiers}
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

export default Modifiers;
