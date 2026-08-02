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

import FlagImage from "@/components/FlagImage";
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

import { arrayMove } from "@dnd-kit/helpers";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { isSortableOperation } from "@dnd-kit/react/sortable";

import {
  useDateFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";

import { usePathname, useRouter } from "@/i18n/navigation";

import {
  Add,
  Cancel,
  Delete,
  Edit,
  Extension,
  Save,
  Sort,
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
  Typography,
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

import { currencies } from "@/constants/currencies";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { MenuFilterField, MenuItem, MenuSortField } from "@/types/menus";

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

const StyledBox = styled(Box)(({ theme }) => ({
  position: "relative",
  width: theme.spacing(4),
  height: theme.spacing(4),
  borderRadius: theme.shape.borderRadius,
  overflow: "hidden",
}));

interface MenusMenuIdSectionIdProps {
  canWrite: boolean;
  filterField?: MenuFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  items: MenuItem[];
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  rowCount: number;
  menuSectionId: string;
  sortBy?: MenuSortField;
  sortDirection?: SortDirection;
}

const MenusMenuIdSectionId = ({
  canWrite,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  items: initialItems,
  page,
  pageSize,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount,
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
    data: { data: items, total: rowCount } = {
      data: initialItems,
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
        `/api/menu-sections/${menuSectionId}/menu-items?${getDataGridSearchParams(paginationModel, filterModel, sortModel)}`,
      );
    },
    {
      fallbackData: { data: initialItems, total: initialRowCount },
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
                ids: items.map(({ id }) => id),
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
    items,
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

    const newItems = arrayMove(items, fromIndex, toIndex);
    mutate({ data: newItems, total: rowCount }, false);
  };

  const handleManageItem = useCallback(
    ({ id }: MenuItem) => {
      const params = new URLSearchParams({
        ...Object.fromEntries(searchParams),
        ...DEFAULT_PAGINATION_QUERY,
      });
      router.push(
        `/menus/sections/${menuSectionId}/${id}/add-ons?${params.toString()}`,
      );
    },
    [router, searchParams, menuSectionId],
  );

  const handleCreateItem = useCallback(() => {
    setDialog({
      content: (
        <CreateMenuItemDialog mutate={mutate} menuSectionId={menuSectionId} />
      ),
      formId: "create-menu-item-form",
      open: true,
      title: tMenus("items.actions.createItem.title"),
    });
  }, [mutate, menuSectionId, setDialog, tMenus]);

  const handleUpdateItem = useCallback(
    (item: MenuItem) => {
      setDialog({
        content: <UpdateMenuItemDialog item={item} mutate={mutate} />,
        formId: "update-menu-item-form",
        open: true,
        title: tMenus("items.actions.updateItem.title"),
      });
    },
    [mutate, setDialog, tMenus],
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
      ...(canWrite
        ? [
            {
              disableColumnMenu: true,
              field: "actions",
              filterable: false,
              headerName: tMenus("items.actions.label"),
              renderCell: ({ row }: GridRenderCellParams<MenuItem>) => (
                <Stack
                  height="100%"
                  direction="row"
                  alignItems="center"
                  gap={1}
                >
                  <Tooltip title={tMenus("items.addOns.label")}>
                    <IconButton
                      onClick={(event) => {
                        event.stopPropagation();

                        handleManageItem(row);
                      }}
                      size="small"
                    >
                      <Extension fontSize="small" />
                    </IconButton>
                  </Tooltip>
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
          ]
        : []),
      {
        field: "image",
        filterable: false,
        headerName: tMenus("items.image.label"),
        renderCell: ({ value }: { value?: string | null }) =>
          value && (
            <Stack height="100%" flexDirection="row" alignItems="center">
              <StyledBox>
                <Image
                  alt={value}
                  fill
                  src={value}
                  style={{ objectFit: "cover" }}
                />
              </StyledBox>
            </Stack>
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
        valueGetter: (_value: unknown, row: MenuItem) =>
          localize(row.description, locale),
      },
      {
        field: "priceCurrency",
        headerName: tMenus("items.offers.priceCurrency.label"),
        sortable: false,
        filterable: false,
        valueGetter: (_value: unknown, { offer }: MenuItem) =>
          offer?.priceCurrency,
        renderCell: ({ value }: { value?: string }) => {
          const currency = currencies.find(
            ({ currency }) => currency === value,
          );
          return (
            <Stack height="100%" direction="row" alignItems="center" gap={1}>
              {currency && (
                <FlagImage code={currency.code} label={currency.label} />
              )}
              <Typography variant="body2">{value}</Typography>
            </Stack>
          );
        },
      },
      {
        field: "price",
        filterable: false,
        headerName: tMenus("items.offers.price.label"),
        sortable: false,
        valueGetter: (_value: unknown, { offer }: MenuItem) =>
          offer?.price && Number(offer.price),
      },
      {
        field: "availability",
        headerName: tMenus("availability.label"),
        sortable: false,
        filterable: false,
        renderCell: ({ row: { offer } }: GridRenderCellParams<MenuItem>) =>
          offer?.availability && (
            <Chip
              color={ITEM_AVAILABILITY_COLOR_MAP[offer.availability]}
              label={tMenus(`availability.options.${offer.availability}`)}
              size="small"
              variant="outlined"
            />
          ),
      },
      {
        field: "availableModes",
        headerName: tMenus("availableModes.label"),
        sortable: false,
        filterable: false,
        valueFormatter: (_value: unknown, { availableModes }: MenuItem) =>
          availableModes
            .map((mode) => tOrder(`mode.${mode}.label`))
            .join(tCommon("delimiter")),
      },
      {
        field: "inventoryLevel",
        headerName: `${tMenus("items.offers.inventoryLevel.value.label")} ${tCommon("optional")}`,
        sortable: false,
        filterable: false,
        valueGetter: (_value: unknown, { offer }: MenuItem) =>
          [offer?.inventoryLevel?.value, offer?.inventoryLevel?.unitText]
            .join(" ")
            .trim(),
      },
      {
        field: "deliveryLeadTime",
        headerName: `${tMenus("items.offers.deliveryLeadTime.value.label")} ${tCommon("optional")}`,
        sortable: false,
        filterable: false,
        valueGetter: (_value: unknown, { offer }: MenuItem) =>
          [offer?.deliveryLeadTime?.value, offer?.deliveryLeadTime?.unitText]
            .join(" ")
            .trim(),
      },
      {
        field: "priceSpecification",
        filterable: false,
        headerName: `${tMenus("items.offers.priceSpecification.price.label")} ${tCommon("optional")}`,
        sortable: false,
        valueGetter: (_value: unknown, { offer }: MenuItem) =>
          offer?.priceSpecification?.price &&
          Number(offer.priceSpecification.price),
      },
      {
        field: "priceSpecificationValidFrom",
        headerName: `${tMenus("items.offers.priceSpecification.validFrom.label")} ${tCommon("optional")}`,
        sortable: false,
        filterable: false,
        valueGetter: (_value: unknown, { offer }: MenuItem) =>
          offer?.priceSpecification?.validFrom,
      },
      {
        field: "priceSpecificationValidThrough",
        headerName: `${tMenus("items.offers.priceSpecification.validThrough.label")} ${tCommon("optional")}`,
        sortable: false,
        filterable: false,
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
      canWrite,
      dateFilterOperators,
      format,
      handleDeleteItem,
      handleManageItem,
      handleUpdateItem,
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
