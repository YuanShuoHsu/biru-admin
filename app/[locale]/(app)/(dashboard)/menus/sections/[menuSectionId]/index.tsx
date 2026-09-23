"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import CreateMenuItemDialog from "./CreateMenuItemDialog";
import UpdateMenuItemDialog from "./UpdateMenuItemDialog";

import AuditLogButton from "@/components/AuditLogButton";
import EmptyCell, { renderEmptyableCell } from "@/components/EmptyCell";
import { DragHandle, Sortable } from "@/components/Sortable";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import {
  DEFAULT_PAGINATION_QUERY,
  getPageSizeOptions,
} from "@/constants/pagination";

import { ITEM_AVAILABILITY_COLOR_MAP } from "@/constants/itemAvailability";
import {
  SERVING_TEMPERATURE_COLOR_MAP,
  SERVING_TEMPERATURE_OF_LEVEL,
  SWEETNESS_COLOR_MAP,
} from "@/constants/menus";
import { MODE_COLORS } from "@/constants/orderMode";

import { arrayMove } from "@dnd-kit/helpers";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { isSortableOperation } from "@dnd-kit/react/sortable";

import {
  useDateFilterOperators,
  useEnumFilterOperators,
  useNumberFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
import { useFormatMoney } from "@/hooks/useFormatMoney";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { useRouter } from "@/i18n/navigation";

import {
  Add,
  Cancel,
  Delete,
  Edit,
  Save,
  Sort,
  Widgets,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  DialogContentText,
  IconButton,
  Stack,
  styled,
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

import { orderModeValues } from "@/types/api";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type {
  MenuItem,
  MenuItemFilterField,
  MenuItemSortField,
} from "@/types/menus";

import {
  getDataGridSearchParams,
  getFilterItemParams,
  isFilteredOrSorted,
} from "@/utils/dataGrid";
import { getMenuEnumOptions } from "@/utils/enumOptions";
import { fetcher } from "@/utils/fetcher";
import { localize } from "@/utils/locale";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

const ActionsStack = styled(Stack)(({ theme }) => ({
  height: "100%",
  alignItems: "center",
  gap: theme.spacing(1),
}));

const ImageStack = styled(Stack)({
  height: "100%",
  flexDirection: "row",
  alignItems: "center",
});

const StyledBox = styled(Box)(({ theme }) => ({
  position: "relative",
  width: theme.spacing(4),
  height: theme.spacing(4),
  borderRadius: theme.shape.borderRadius,
  overflow: "hidden",
}));

const ChipsStack = styled(Stack)(({ theme }) => ({
  alignItems: "center",
  gap: theme.spacing(0.5),
  height: "100%",
}));

const ToolbarStack = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  alignItems: "center",
  gap: theme.spacing(2),
}));

interface MenusMenuIdSectionIdProps {
  canUpdateAvailability: boolean;
  canViewAuditLog: boolean;
  canWrite: boolean;
  filterField?: MenuItemFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  openingHours?: string | null;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  rowCount: number;
  rows: MenuItem[];
  menuSectionId: string;
  sortBy?: MenuItemSortField;
  sortDirection?: SortDirection;
}

const MenusMenuIdSectionId = ({
  canUpdateAvailability,
  canViewAuditLog,
  canWrite,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  openingHours,
  page,
  pageSize,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount,
  rows: initialRows,
  menuSectionId,
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
  const numberFilterOperators = useNumberFilterOperators();
  const stringFilterOperators = useStringFilterOperators();

  const format = useFormatter();

  const formatMoney = useFormatMoney();

  const apiRef = useGridApiRef();

  const locale = useLocale();

  const router = useRouter();

  const searchParams = useSearchParams();

  const tCommon = useTranslations("common");
  const tMenus = useTranslations("menus");
  const tOrder = useTranslations("order");

  const updateQuery = useUpdateQuery();

  const enumOptions = useMemo(
    () => getMenuEnumOptions(tMenus, tOrder),
    [tMenus, tOrder],
  );

  const {
    data: { data: rows, total: rowCount } = {
      data: initialRows,
      total: initialRowCount,
    },
    mutate,
    isValidating: loading,
  } = useSWR(
    [
      `/api/menu-sections/${menuSectionId}/menu-items`,
      filterModel.items[0]?.field,
      filterModel.items[0]?.operator,
      filterModel.items[0]?.value,
      filterModel.quickFilterValues,
      paginationModel.page,
      paginationModel.pageSize,
      sortModel,
    ],
    async () => {
      return fetcher<{ data: MenuItem[]; total: number }>(
        `/api/menu-sections/${menuSectionId}/menu-items?${getDataGridSearchParams(paginationModel, filterModel, sortModel, enumOptions)}`,
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

  const handleEnterReorderMode = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tMenus.rich("items.actions.reorderItem.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
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
          {tMenus.rich("items.actions.reorderItem.save.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        try {
          await fetcher(
            `/api/menu-sections/${menuSectionId}/menu-items/reorder`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ids: rows.map(({ id }) => id),
                offset: paginationModel.page * paginationModel.pageSize,
              }),
            },
          );

          setIsReorderMode(false);

          setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);

          enqueueSnackbar(tMenus("items.actions.reorderItem.save.success"), {
            variant: "success",
          });
        } catch {
          mutate();

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
    rows,
    mutate,
    paginationModel.page,
    paginationModel.pageSize,
    menuSectionId,
    setDialog,
    tMenus,
  ]);

  const handleCancelReorder = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tMenus.rich("items.actions.reorderItem.cancel.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        setIsReorderMode(false);

        mutate();
      },
      open: true,
      title: tMenus("items.actions.reorderItem.cancel.label"),
    });
  }, [mutate, setDialog, tMenus]);

  const handleDragEnd = ({ operation }: DragEndEvent) => {
    if (!isSortableOperation(operation)) return;

    const { canceled, source } = operation;
    if (canceled || !source) return;

    const fromIndex = source.initialIndex;
    const toIndex = source.index;
    if (fromIndex === toIndex) return;

    const newItems = arrayMove(rows, fromIndex, toIndex);
    mutate({ data: newItems, total: rowCount }, false);
  };

  const handleManageItem = useCallback(
    ({ id }: MenuItem) => {
      const params = new URLSearchParams({
        ...Object.fromEntries(searchParams),
        ...DEFAULT_PAGINATION_QUERY,
      });
      router.push(
        `/menus/sections/${menuSectionId}/${id}/modifier-groups?${params.toString()}`,
      );
    },
    [router, searchParams, menuSectionId],
  );

  const handleCreateItem = useCallback(() => {
    setDialog({
      content: (
        <CreateMenuItemDialog
          mutate={mutate}
          menuSectionId={menuSectionId}
          openingHours={openingHours}
        />
      ),
      formId: "create-menu-item-form",
      open: true,
      title: tMenus("items.actions.createItem.title"),
    });
  }, [mutate, menuSectionId, openingHours, setDialog, tMenus]);

  const handleUpdateItem = useCallback(
    (item: MenuItem) => {
      setDialog({
        content: (
          <UpdateMenuItemDialog
            canWrite={canWrite}
            item={item}
            mutate={mutate}
            openingHours={openingHours}
          />
        ),
        formId: "update-menu-item-form",
        open: true,
        title: tMenus("items.actions.updateItem.title"),
      });
    },
    [canWrite, mutate, openingHours, setDialog, tMenus],
  );

  const handleDeleteItem = useCallback(
    ({ id, name }: MenuItem) => {
      const localizedName = localize(name, locale);

      setDialog({
        content: (
          <DialogContentText>
            {tMenus.rich("items.actions.deleteItem.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              name: localizedName,
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          try {
            await fetcher(`/api/menu-items/${id}`, { method: "DELETE" });

            enqueueSnackbar(
              tMenus("items.actions.deleteItem.success", {
                name: localizedName,
              }),
              { variant: "success" },
            );

            mutate();
          } catch {
            enqueueSnackbar(
              tMenus("items.actions.deleteItem.error", { name: localizedName }),
              { variant: "error" },
            );
          }
        },
        open: true,
        title: tMenus("items.actions.deleteItem.title"),
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
      ...((canWrite || canUpdateAvailability || canViewAuditLog) &&
      !isReorderMode
        ? [
            {
              disableColumnMenu: true,
              disableExport: true,
              field: "actions",
              filterable: false,
              headerName: tMenus("items.actions.label"),
              renderCell: ({ row }: GridRenderCellParams<MenuItem>) => (
                <ActionsStack direction="row">
                  <Tooltip title={tMenus("items.actions.manageItem.title")}>
                    <IconButton
                      onClick={(event) => {
                        event.stopPropagation();

                        handleManageItem(row);
                      }}
                      size="small"
                    >
                      <Widgets fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {(canWrite || (canUpdateAvailability && !!row.offer)) && (
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
                  )}
                  {canViewAuditLog && <AuditLogButton resourceId={row.id} />}
                  {canWrite && (
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
                  )}
                </ActionsStack>
              ),
              resizable: false,
              sortable: false,
            },
          ]
        : []),
      {
        field: "image",
        filterable: false,
        headerName: tMenus("items.image.label"),
        renderCell: ({ value }: { value?: string | null }) =>
          value && (
            <ImageStack>
              <StyledBox>
                <Image
                  alt={value}
                  fill
                  sizes="32px"
                  src={value}
                  style={{ objectFit: "cover" }}
                />
              </StyledBox>
            </ImageStack>
          ),
        resizable: false,
        sortable: false,
      },
      {
        field: "name",
        filterOperators: stringFilterOperators,
        headerName: tMenus("items.name.label"),
        valueGetter: (_value: unknown, row: MenuItem) =>
          localize(row.name, locale),
      },
      {
        field: "description",
        filterOperators: stringFilterOperators,
        headerName: `${tMenus("items.description.label")} ${tCommon("optional")}`,
        maxWidth: 320,
        renderCell: renderEmptyableCell,
        valueGetter: (_value: unknown, row: MenuItem) =>
          localize(row.description, locale),
      },
      {
        field: "servingTemperatures",
        filterOperators: enumFilterOperators,
        headerName: tMenus("items.servingTemperatures.label"),
        type: "singleSelect",
        valueOptions: enumOptions.servingTemperatures,
        renderCell: ({
          row: { recommendedServingTemperatureLevel, servingTemperatures },
        }: GridRenderCellParams<MenuItem>) =>
          servingTemperatures.length ? (
            <ChipsStack direction="row">
              {servingTemperatures.map((value) => (
                <Chip
                  color={SERVING_TEMPERATURE_COLOR_MAP[value]}
                  key={value}
                  label={
                    recommendedServingTemperatureLevel &&
                    SERVING_TEMPERATURE_OF_LEVEL[
                      recommendedServingTemperatureLevel
                    ] === value
                      ? `${tMenus(`items.servingTemperatures.options.${value}`)}${tCommon("parenthesisOpen")}${tOrder("menuItem.recommended")}${tCommon("colon")}${tOrder(`menuItem.servingTemperatureLevels.${recommendedServingTemperatureLevel}`)}${tCommon("parenthesisClose")}`
                      : tMenus(`items.servingTemperatures.options.${value}`)
                  }
                  size="small"
                  variant="outlined"
                />
              ))}
            </ChipsStack>
          ) : (
            <EmptyCell />
          ),
      },
      {
        field: "sweetness",
        filterOperators: enumFilterOperators,
        headerName: tMenus("items.sweetness.label"),
        renderCell: ({
          row: { fixedSweetnessLevel, recommendedSweetnessLevel, sweetness },
        }: GridRenderCellParams<MenuItem>) =>
          sweetness === "NotApplicable" ? (
            <EmptyCell />
          ) : (
            <Chip
              color={SWEETNESS_COLOR_MAP[sweetness]}
              label={
                sweetness === "Fixed" && fixedSweetnessLevel
                  ? `${tMenus("items.sweetness.options.Fixed")}${tCommon("parenthesisOpen")}${tOrder(`menuItem.sweetnessLevels.${fixedSweetnessLevel}`)}${tCommon("parenthesisClose")}`
                  : sweetness === "Adjustable" && recommendedSweetnessLevel
                    ? `${tMenus("items.sweetness.options.Adjustable")}${tCommon("parenthesisOpen")}${tOrder("menuItem.recommended")}${tCommon("colon")}${tOrder(`menuItem.sweetnessLevels.${recommendedSweetnessLevel}`)}${tCommon("parenthesisClose")}`
                    : tMenus(`items.sweetness.options.${sweetness}`)
              }
              size="small"
              variant="outlined"
            />
          ),
        type: "singleSelect",
        valueOptions: enumOptions.sweetness,
      },
      {
        field: "price",
        filterOperators: numberFilterOperators,
        headerName: tMenus("items.offers.price.label"),
        renderCell: renderEmptyableCell,
        valueGetter: (_value: unknown, { offer }: MenuItem) =>
          offer?.price == null
            ? ""
            : formatMoney(Number(offer.price), offer.priceCurrency),
      },
      {
        field: "availability",
        filterOperators: enumFilterOperators,
        headerName: tMenus("availability.label"),
        renderCell: ({ row: { offer } }: GridRenderCellParams<MenuItem>) =>
          offer?.availability ? (
            <Chip
              color={ITEM_AVAILABILITY_COLOR_MAP[offer.availability]}
              label={tMenus(`availability.options.${offer.availability}`)}
              size="small"
              variant="outlined"
            />
          ) : (
            <EmptyCell />
          ),
        type: "singleSelect",
        valueGetter: (_value: unknown, { offer }: MenuItem) =>
          offer?.availability,
        valueOptions: enumOptions.availability,
      },
      {
        field: "availableModes",
        filterOperators: enumFilterOperators,
        headerName: tMenus("availableModes.label"),
        // 陣列欄位沒有可解釋的排序,後端也不接受
        sortable: false,
        type: "singleSelect",
        valueOptions: enumOptions.availableModes,
        renderCell: ({
          row: { availableModes },
        }: GridRenderCellParams<MenuItem>) => (
          <ChipsStack direction="row">
            {orderModeValues
              .filter((mode) => availableModes.includes(mode))
              .map((mode) => (
                <Chip
                  color={MODE_COLORS[mode]}
                  key={mode}
                  label={tOrder(`mode.${mode}.label`)}
                  size="small"
                  variant="outlined"
                />
              ))}
          </ChipsStack>
        ),
      },
      {
        field: "inventoryLevel",
        filterOperators: numberFilterOperators,
        headerName: `${tMenus("items.offers.inventoryLevel.value.label")} ${tCommon("optional")}`,
        renderCell: renderEmptyableCell,
        valueGetter: (_value: unknown, { offer }: MenuItem) =>
          [
            offer?.inventoryLevel?.value == null
              ? ""
              : format.number(offer.inventoryLevel.value),
            offer?.inventoryLevel?.unitText,
          ]
            .join(" ")
            .trim(),
      },
      {
        field: "deliveryLeadTimeMinutes",
        filterOperators: numberFilterOperators,
        headerName: `${tMenus("items.offers.deliveryLeadTimeMinutes.label")} ${tCommon("optional")}`,
        renderCell: renderEmptyableCell,
        valueGetter: (_value: unknown, { offer }: MenuItem) =>
          offer?.deliveryLeadTimeMinutes == null
            ? ""
            : `${format.number(offer.deliveryLeadTimeMinutes)} ${tMenus("items.offers.deliveryLeadTimeMinutes.unit")}`,
      },
      {
        field: "priceSpecification",
        filterOperators: numberFilterOperators,
        headerName: `${tMenus("items.offers.priceSpecification.price.label")} ${tCommon("optional")}`,
        renderCell: renderEmptyableCell,
        valueGetter: (_value: unknown, { offer }: MenuItem) =>
          offer?.priceSpecification?.price == null
            ? ""
            : formatMoney(
                Number(offer.priceSpecification.price),
                offer.priceCurrency,
              ),
      },
      {
        field: "priceSpecificationValidFrom",
        filterOperators: dateFilterOperators,
        headerName: `${tMenus("items.offers.priceSpecification.validFrom.label")} ${tCommon("optional")}`,
        renderCell: renderEmptyableCell,
        valueGetter: (_value: unknown, { offer }: MenuItem) =>
          offer?.priceSpecification?.validFrom,
      },
      {
        field: "priceSpecificationValidThrough",
        filterOperators: dateFilterOperators,
        headerName: `${tMenus("items.offers.priceSpecification.validThrough.label")} ${tCommon("optional")}`,
        renderCell: renderEmptyableCell,
        valueGetter: (_value: unknown, { offer }: MenuItem) =>
          offer?.priceSpecification?.validThrough,
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
      canUpdateAvailability,
      canViewAuditLog,
      canWrite,
      dateFilterOperators,
      enumFilterOperators,
      enumOptions,
      format,
      formatMoney,
      handleDeleteItem,
      handleManageItem,
      handleUpdateItem,
      isReorderMode,
      locale,
      numberFilterOperators,
      stringFilterOperators,
      tCommon,
      tMenus,
      tOrder,
    ],
  );

  return (
    <>
      <ToolbarStack direction="row">
        {!isReorderMode ? (
          <>
            {canWrite && (
              <Button
                onClick={handleCreateItem}
                size="small"
                startIcon={<Add />}
                variant="contained"
              >
                {tMenus("items.actions.createItem.title")}
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
                {tMenus("items.actions.reorderItem.title")}
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
      </ToolbarStack>
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

export default MenusMenuIdSectionId;
