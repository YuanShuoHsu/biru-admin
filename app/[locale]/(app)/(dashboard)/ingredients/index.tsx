"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import IngredientDialog from "./IngredientDialog";
import TransactionDialog from "./TransactionDialog";

import AuditLogButton from "@/components/AuditLogButton";
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

import { arrayMove } from "@dnd-kit/helpers";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { isSortableOperation } from "@dnd-kit/react/sortable";

import {
  useDateFilterOperators,
  useEnumFilterOperators,
  useNumberFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";

import { usePathname, useRouter } from "@/i18n/navigation";

import {
  Add,
  Cancel,
  Delete,
  Edit,
  Error as ErrorIcon,
  FactCheck,
  Save,
  Sort,
  SwapVert,
  Warning,
} from "@mui/icons-material";
import {
  Box,
  Button,
  DialogContentText,
  IconButton,
  Link,
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

import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type {
  Ingredient,
  IngredientFilterField,
  IngredientSortField,
  Supplier,
} from "@/types/inventory";

import {
  getDataGridSearchParams,
  getFilterItemParams,
  isFilteredOrSorted,
} from "@/utils/dataGrid";
import { getIngredientEnumOptions } from "@/utils/enumOptions";
import { fetcher } from "@/utils/fetcher";
import {
  formatPackagePrice,
  formatPackageQuantity,
  formatStock,
  formatUnitPrice,
} from "@/utils/ingredients";
import { localize } from "@/utils/locale";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

const StyledIconButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== "visible",
})<{ visible: boolean }>(({ visible }) => ({
  visibility: visible ? "visible" : "hidden",
}));

const StyledBox = styled(Box)(({ theme }) => ({
  position: "relative",
  width: theme.spacing(4),
  height: theme.spacing(4),
  borderRadius: theme.shape.borderRadius,
  overflow: "hidden",
}));

interface IngredientsProps {
  suppliers: Supplier[];
  canRecordTransaction: boolean;
  canViewAuditLog: boolean;
  canWrite: boolean;
  filterField?: IngredientFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  ingredients: Ingredient[];
  organizationSlug: string;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  rowCount: number;
  sortBy?: IngredientSortField;
  sortDirection?: SortDirection;
}

const Ingredients = ({
  canRecordTransaction,
  canViewAuditLog,
  canWrite,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  ingredients: initialIngredients,
  organizationSlug,
  page,
  pageSize,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount,
  sortBy,
  sortDirection,
  suppliers,
}: IngredientsProps) => {
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

  const apiRef = useGridApiRef();

  const locale = useLocale();

  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const organization = searchParams.get("organization");

  const tCommon = useTranslations("common");
  const tInventory = useTranslations("inventory");

  const enumOptions = useMemo(
    () => getIngredientEnumOptions(tInventory),
    [tInventory],
  );

  const {
    data: { data: ingredients, total: rowCount } = {
      data: initialIngredients,
      total: initialRowCount,
    },
    mutate,
    isValidating: loading,
  } = useSWR(
    [
      `/api/organizations/${organizationSlug}/ingredients`,
      filterModel.items[0]?.field,
      filterModel.items[0]?.operator,
      filterModel.items[0]?.value,
      filterModel.quickFilterValues,
      paginationModel.page,
      paginationModel.pageSize,
      sortModel,
    ],
    async () =>
      fetcher<{ data: Ingredient[]; total: number }>(
        `/api/organizations/${organizationSlug}/ingredients?${getDataGridSearchParams(paginationModel, filterModel, sortModel, enumOptions)}`,
      ),
    {
      fallbackData: { data: initialIngredients, total: initialRowCount },
      onSuccess: () => {
        setTimeout(() => {
          apiRef.current?.autosizeColumns(autosizeOptions);
        }, 0);
      },
    },
  );

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

  const isReorderDisabled =
    rowCount < 2 || isFilteredOrSorted(filterModel, sortModel);

  const handleEnterReorderMode = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tInventory.rich("ingredients.actions.reorderIngredient.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        setIsReorderMode(true);

        setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
      },
      open: true,
      title: tInventory("ingredients.actions.reorderIngredient.title"),
    });
  }, [apiRef, setDialog, tInventory]);

  const handleSaveReorder = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tInventory.rich(
            "ingredients.actions.reorderIngredient.save.confirm",
            { bold: (chunks) => <strong>{chunks}</strong> },
          )}
        </DialogContentText>
      ),
      onConfirm: async () => {
        try {
          await fetcher(
            `/api/organizations/${organizationSlug}/ingredients/reorder`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ids: ingredients.map(({ id }) => id),
                offset: paginationModel.page * paginationModel.pageSize,
              }),
            },
          );

          setIsReorderMode(false);

          setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);

          enqueueSnackbar(
            tInventory("ingredients.actions.reorderIngredient.save.success"),
            { variant: "success" },
          );
        } catch {
          mutate();

          enqueueSnackbar(
            tInventory("ingredients.actions.reorderIngredient.save.error"),
            { variant: "error" },
          );
        }
      },
      open: true,
      title: tInventory("ingredients.actions.reorderIngredient.save.label"),
    });
  }, [
    apiRef,
    ingredients,
    mutate,
    organizationSlug,
    paginationModel.page,
    paginationModel.pageSize,
    setDialog,
    tInventory,
  ]);

  const handleCancelReorder = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tInventory.rich(
            "ingredients.actions.reorderIngredient.cancel.confirm",
            { bold: (chunks) => <strong>{chunks}</strong> },
          )}
        </DialogContentText>
      ),
      onConfirm: async () => {
        setIsReorderMode(false);

        mutate();
      },
      open: true,
      title: tInventory("ingredients.actions.reorderIngredient.cancel.label"),
    });
  }, [mutate, setDialog, tInventory]);

  const handleDragEnd = ({ operation }: DragEndEvent) => {
    if (!isSortableOperation(operation)) return;

    const { canceled, source } = operation;
    if (canceled || !source) return;

    const fromIndex = source.initialIndex;
    const toIndex = source.index;
    if (fromIndex === toIndex) return;

    mutate(
      { data: arrayMove(ingredients, fromIndex, toIndex), total: rowCount },
      false,
    );
  };

  const handleCreateIngredient = useCallback(() => {
    setDialog({
      content: (
        <IngredientDialog
          ingredient={null}
          mutate={mutate}
          organizationSlug={organizationSlug}
          suppliers={suppliers}
        />
      ),
      formId: "ingredient-form",
      open: true,
      title: tInventory("ingredients.actions.createIngredient.title"),
    });
  }, [mutate, organizationSlug, setDialog, suppliers, tInventory]);

  const handleUpdateIngredient = useCallback(
    (ingredient: Ingredient) => {
      setDialog({
        content: (
          <IngredientDialog
            ingredient={ingredient}
            mutate={mutate}
            organizationSlug={organizationSlug}
            suppliers={suppliers}
          />
        ),
        formId: "ingredient-form",
        open: true,
        title: tInventory("ingredients.actions.updateIngredient.title"),
      });
    },
    [mutate, organizationSlug, setDialog, suppliers, tInventory],
  );

  const handleRecordTransaction = useCallback(
    (ingredient: Ingredient) => {
      setDialog({
        content: <TransactionDialog ingredient={ingredient} mutate={mutate} />,
        formId: "transaction-form",
        open: true,
        title: tInventory("transactions.actions.recordTransaction.title"),
      });
    },
    [mutate, setDialog, tInventory],
  );

  const handleViewTransactions = useCallback(
    ({ id }: Ingredient) => {
      const params = new URLSearchParams({
        ...(organization && { organization }),
        ...DEFAULT_PAGINATION_QUERY,
      });

      router.push(`/ingredients/${id}/transactions?${params.toString()}`);
    },
    [organization, router],
  );

  const handleDeleteIngredient = useCallback(
    ({ id, name }: Ingredient) => {
      const displayName = localize(name, locale);

      setDialog({
        content: (
          <DialogContentText>
            {tInventory.rich("ingredients.actions.deleteIngredient.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              name: displayName,
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          try {
            await fetcher(`/api/ingredients/${id}`, { method: "DELETE" });

            enqueueSnackbar(
              tInventory("ingredients.actions.deleteIngredient.success", {
                name: displayName,
              }),
              { variant: "success" },
            );

            mutate();
          } catch {
            enqueueSnackbar(
              tInventory("ingredients.actions.deleteIngredient.error"),
              { variant: "error" },
            );
          }
        },
        open: true,
        title: tInventory("ingredients.actions.deleteIngredient.title"),
      });
    },
    [locale, mutate, setDialog, tInventory],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      ...(isReorderMode
        ? [
            {
              disableColumnMenu: true,
              field: "reorder",
              filterable: false,
              headerName: tInventory("reorder"),
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
        headerName: tInventory("ingredients.actions.label"),
        renderCell: ({ row }: GridRenderCellParams<Ingredient>) => (
          <Stack height="100%" direction="row" alignItems="center" gap={1}>
            <Tooltip
              title={tInventory("ingredients.actions.viewTransactions.title")}
            >
              <IconButton
                onClick={() => handleViewTransactions(row)}
                size="small"
              >
                <SwapVert fontSize="small" />
              </IconButton>
            </Tooltip>
            {canRecordTransaction && (
              <Tooltip
                title={tInventory(
                  "transactions.actions.recordTransaction.title",
                )}
              >
                <StyledIconButton
                  onClick={() => {
                    if (row.packageBaseQuantity) handleRecordTransaction(row);
                  }}
                  size="small"
                  visible={!!row.packageBaseQuantity}
                >
                  <FactCheck fontSize="small" />
                </StyledIconButton>
              </Tooltip>
            )}
            {canWrite && (
              <Tooltip
                title={tInventory("ingredients.actions.updateIngredient.title")}
              >
                <IconButton
                  onClick={() => handleUpdateIngredient(row)}
                  size="small"
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canViewAuditLog && <AuditLogButton resourceId={row.id} />}
            {canWrite && (
              <Tooltip
                title={tInventory("ingredients.actions.deleteIngredient.title")}
              >
                <IconButton
                  color="error"
                  onClick={() => handleDeleteIngredient(row)}
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
        field: "image",
        filterable: false,
        headerName: `${tInventory("ingredients.image.label")} ${tCommon("optional")}`,
        renderCell: ({ value }: { value?: string | null }) =>
          value && (
            <Stack height="100%" flexDirection="row" alignItems="center">
              <StyledBox>
                <Image
                  alt={value}
                  fill
                  sizes="32px"
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
        headerName: tInventory("ingredients.name.label"),
        valueGetter: (_value: unknown, row: Ingredient) =>
          localize(row.name, locale),
      },
      {
        field: "brand",
        filterOperators: stringFilterOperators,
        headerName: `${tInventory("ingredients.brand.label")} ${tCommon("optional")}`,
      },
      {
        field: "price",
        filterable: false,
        headerName: tInventory("ingredients.price.label"),
        valueGetter: (_value: unknown, row: Ingredient) =>
          formatPackagePrice(row, { format, tCommon, tInventory }),
      },
      {
        field: "eligibleQuantity",
        filterable: false,
        headerName: tInventory("ingredients.eligibleQuantity.label"),
        valueGetter: (_value: unknown, row: Ingredient) =>
          formatPackageQuantity(row, { format, tCommon, tInventory }),
      },
      {
        field: "unitCode",
        filterOperators: enumFilterOperators,
        headerName: tInventory("ingredients.baseUnitCode.label"),
        type: "singleSelect",
        valueOptions: enumOptions.unitCode,
      },
      {
        field: "unitPrice",
        filterable: false,
        headerName: tInventory("ingredients.unitPrice.label"),
        valueGetter: (_value: unknown, row: Ingredient) =>
          formatUnitPrice(row, { format, tCommon, tInventory }),
      },
      {
        field: "inventoryLevel",
        filterOperators: numberFilterOperators,
        headerName: tInventory("ingredients.inventoryLevel.label"),
        renderCell: ({ row }: GridRenderCellParams<Ingredient>) => {
          const { inventoryLevel, lowStockThreshold } = row;
          const level = Number(inventoryLevel);
          const isOutOfStock = level <= 0;
          const isLowStock =
            lowStockThreshold != null && level <= Number(lowStockThreshold);

          return (
            <Tooltip
              title={
                isOutOfStock
                  ? tInventory("ingredients.outOfStock")
                  : isLowStock
                    ? tInventory("ingredients.lowStock")
                    : ""
              }
            >
              <Stack
                alignItems="center"
                color={
                  isOutOfStock
                    ? "error.main"
                    : isLowStock
                      ? "warning.main"
                      : undefined
                }
                direction="row"
                gap={0.5}
                height="100%"
                justifyContent="flex-end"
              >
                {isOutOfStock ? (
                  <ErrorIcon fontSize="small" />
                ) : (
                  isLowStock && <Warning fontSize="small" />
                )}
                {formatStock(level, row, { format, tCommon, tInventory })}
              </Stack>
            </Tooltip>
          );
        },
        type: "number",
      },
      {
        field: "lowStockThreshold",
        filterOperators: numberFilterOperators,
        headerName: `${tInventory("ingredients.lowStockThreshold.label")} ${tCommon("optional")}`,
        type: "number",
        // 這個數字是拿來跟目前庫存比的，兩欄的寫法必須一致才看得出誰大誰小
        valueGetter: (_value: unknown, row: Ingredient) =>
          row.lowStockThreshold == null
            ? ""
            : formatStock(Number(row.lowStockThreshold), row, {
                format,
                tCommon,
                tInventory,
              }),
      },
      {
        field: "supplierName",
        filterOperators: stringFilterOperators,
        headerName: `${tInventory("ingredients.supplierId.label")} ${tCommon("optional")}`,
      },
      {
        field: "url",
        filterable: false,
        headerName: tInventory("ingredients.url.label"),
        sortable: false,
        renderCell: ({ row: { url } }: GridRenderCellParams<Ingredient>) =>
          url && (
            <Link href={url} rel="noopener" target="_blank">
              {url}
            </Link>
          ),
      },
      {
        field: "createdAt",
        filterOperators: dateFilterOperators,
        headerName: tInventory("createdAt"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "short"),
      },
      {
        field: "updatedAt",
        filterOperators: dateFilterOperators,
        headerName: tInventory("updatedAt"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "short"),
      },
    ],
    [
      canRecordTransaction,
      canViewAuditLog,
      canWrite,
      dateFilterOperators,
      enumFilterOperators,
      enumOptions,
      format,
      handleDeleteIngredient,
      handleRecordTransaction,
      handleUpdateIngredient,
      handleViewTransactions,
      isReorderMode,
      locale,
      numberFilterOperators,
      stringFilterOperators,
      tCommon,
      tInventory,
    ],
  );

  return (
    <>
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={2}>
        {!isReorderMode ? (
          canWrite && (
            <>
              <Button
                onClick={handleCreateIngredient}
                size="small"
                startIcon={<Add />}
                variant="contained"
              >
                {tInventory("ingredients.actions.createIngredient.title")}
              </Button>
              <Button
                disabled={isReorderDisabled}
                onClick={handleEnterReorderMode}
                size="small"
                startIcon={<Sort />}
                variant="outlined"
              >
                {tInventory("ingredients.actions.reorderIngredient.title")}
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
              {tInventory("ingredients.actions.reorderIngredient.cancel.label")}
            </Button>
            <Button
              onClick={handleSaveReorder}
              size="small"
              startIcon={<Save />}
              variant="contained"
            >
              {tInventory("ingredients.actions.reorderIngredient.save.label")}
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
          rows={ingredients}
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

export default Ingredients;
