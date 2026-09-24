"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import IngredientDialog from "./IngredientDialog";
import StockCell from "./StockCell";

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

import { arrayMove } from "@dnd-kit/helpers";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { isSortableOperation } from "@dnd-kit/react/sortable";

import {
  useDateFilterOperators,
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
  Error as ErrorIcon,
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
import type { Organization } from "@/types/organizations";
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
  formatUnitPrice,
} from "@/utils/ingredients";
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

const StyledIconButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== "visible",
})<{ visible: boolean }>(({ visible }) => ({
  visibility: visible ? "visible" : "hidden",
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

const StockStack = styled(Stack, {
  shouldForwardProp: (prop) => prop !== "isLowStock" && prop !== "isOutOfStock",
})<{ isLowStock: boolean; isOutOfStock: boolean }>(
  ({ isLowStock, isOutOfStock, theme }) => ({
    height: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: theme.spacing(1),

    ...(isLowStock && {
      color: theme.vars.palette.warning.main,
    }),
    ...(isOutOfStock && {
      color: theme.vars.palette.error.main,
    }),
  }),
);

const ToolbarStack = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  alignItems: "center",
  gap: theme.spacing(2),
}));

interface IngredientsProps {
  organization: Organization;
  suppliers: Supplier[];
  canRecordTransaction: boolean;
  canViewAuditLog: boolean;
  canViewPurchasing: boolean;
  canWrite: boolean;
  filterField?: IngredientFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  rowCount: number;
  rows: Ingredient[];
  sortBy?: IngredientSortField;
  sortDirection?: SortDirection;
}

const Ingredients = ({
  canRecordTransaction,
  canViewAuditLog,
  canViewPurchasing,
  canWrite,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  organization: { currency = "", slug: organizationSlug },
  page,
  pageSize,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount,
  rows: initialRows,
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
  const numberFilterOperators = useNumberFilterOperators();
  const stringFilterOperators = useStringFilterOperators();

  const format = useFormatter();

  const formatMoney = useFormatMoney();

  const apiRef = useGridApiRef();

  const locale = useLocale();

  const router = useRouter();
  const searchParams = useSearchParams();
  const organization = searchParams.get("organization");

  const tCommon = useTranslations("common");
  const tInventory = useTranslations("inventory");

  const updateQuery = useUpdateQuery();

  const enumOptions = useMemo(
    () => getIngredientEnumOptions(tInventory),
    [tInventory],
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
      fallbackData: { data: initialRows, total: initialRowCount },
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
                ids: rows.map(({ id }) => id),
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
    rows,
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
      { data: arrayMove(rows, fromIndex, toIndex), total: rowCount },
      false,
    );
  };

  const handleCreateIngredient = useCallback(() => {
    setDialog({
      content: (
        <IngredientDialog
          canRecordTransaction={canRecordTransaction}
          canViewPurchasing={canViewPurchasing}
          canWrite={canWrite}
          currency={currency}
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
  }, [
    canRecordTransaction,
    canViewPurchasing,
    canWrite,
    currency,
    mutate,
    organizationSlug,
    setDialog,
    suppliers,
    tInventory,
  ]);

  const handleUpdateIngredient = useCallback(
    (ingredient: Ingredient) => {
      setDialog({
        content: (
          <IngredientDialog
            canRecordTransaction={canRecordTransaction}
            canViewPurchasing={canViewPurchasing}
            canWrite={canWrite}
            currency={currency}
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
    [
      canRecordTransaction,
      canViewPurchasing,
      canWrite,
      currency,
      mutate,
      organizationSlug,
      setDialog,
      suppliers,
      tInventory,
    ],
  );

  const handleViewTransactions = useCallback(
    ({ id }: Ingredient) => {
      const params = new URLSearchParams({
        ...(organization && { organization }),
        ...DEFAULT_PAGINATION_QUERY,
      });

      router.push(
        `/inventory/ingredients/${id}/transactions?${params.toString()}`,
      );
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
        disableExport: true,
        field: "actions",
        filterable: false,
        headerName: tInventory("ingredients.actions.label"),
        renderCell: ({ row }: GridRenderCellParams<Ingredient>) => (
          <ActionsStack direction="row">
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
            {(canWrite || canRecordTransaction) && (
              <Tooltip
                title={tInventory("ingredients.actions.updateIngredient.title")}
              >
                <StyledIconButton
                  onClick={() => {
                    if (canWrite || row.packageBaseQuantity)
                      handleUpdateIngredient(row);
                  }}
                  size="small"
                  visible={canWrite || !!row.packageBaseQuantity}
                >
                  <Edit fontSize="small" />
                </StyledIconButton>
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
          </ActionsStack>
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
        headerName: tInventory("ingredients.name.label"),
        valueGetter: (_value: unknown, row: Ingredient) =>
          localize(row.name, locale),
      },
      {
        field: "brand",
        filterOperators: stringFilterOperators,
        headerName: `${tInventory("ingredients.brand.label")} ${tCommon("optional")}`,
        renderCell: renderEmptyableCell,
      },
      ...(canViewPurchasing
        ? [
            {
              field: "price",
              filterable: false,
              headerName: tInventory("ingredients.price.label"),
              renderCell: renderEmptyableCell,
              valueGetter: (_value: unknown, row: Ingredient) =>
                formatPackagePrice(row, {
                  format,
                  formatMoney,
                  tCommon,
                  tInventory,
                }),
            },
          ]
        : []),
      {
        field: "eligibleQuantity",
        filterable: false,
        headerName: tInventory("ingredients.eligibleQuantity.label"),
        renderCell: renderEmptyableCell,
        valueGetter: (_value: unknown, row: Ingredient) =>
          formatPackageQuantity(row, {
            format,
            tCommon,
            tInventory,
          }),
      },
      ...(canViewPurchasing
        ? [
            {
              field: "unitPrice",
              filterable: false,
              headerName: tInventory("ingredients.unitPrice.label"),
              renderCell: renderEmptyableCell,
              valueGetter: (_value: unknown, row: Ingredient) =>
                formatUnitPrice(row, {
                  format,
                  formatMoney,
                  tCommon,
                  tInventory,
                }),
            },
          ]
        : []),
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
              <StockStack
                direction="row"
                isLowStock={isLowStock}
                isOutOfStock={isOutOfStock}
              >
                {isOutOfStock ? (
                  <ErrorIcon fontSize="small" />
                ) : (
                  isLowStock && <Warning fontSize="small" />
                )}
                <StockCell ingredient={row} quantity={level} />
              </StockStack>
            </Tooltip>
          );
        },
        type: "number",
      },
      {
        field: "lowStockThreshold",
        filterOperators: numberFilterOperators,
        headerName: `${tInventory("ingredients.lowStockThreshold.label")} ${tCommon("optional")}`,
        renderCell: ({ row }: GridRenderCellParams<Ingredient>) =>
          row.lowStockThreshold == null ? (
            <EmptyCell />
          ) : (
            <StockCell
              ingredient={row}
              quantity={Number(row.lowStockThreshold)}
            />
          ),
        type: "number",
      },
      ...(canViewPurchasing
        ? [
            {
              field: "supplierName",
              filterOperators: stringFilterOperators,
              headerName: `${tInventory("ingredients.supplierId.label")} ${tCommon("optional")}`,
              renderCell: renderEmptyableCell,
            },
            {
              field: "url",
              filterable: false,
              headerName: tInventory("ingredients.url.label"),
              sortable: false,
              renderCell: ({
                row: { url },
              }: GridRenderCellParams<Ingredient>) =>
                url ? (
                  <Link href={url} rel="noopener" target="_blank">
                    {url}
                  </Link>
                ) : (
                  <EmptyCell />
                ),
            },
          ]
        : []),
      {
        field: "note",
        filterOperators: stringFilterOperators,
        headerName: `${tInventory("ingredients.note.label")} ${tCommon("optional")}`,
        maxWidth: 320,
        renderCell: renderEmptyableCell,
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
      canViewPurchasing,
      canWrite,
      dateFilterOperators,
      format,
      formatMoney,
      handleDeleteIngredient,
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
      {canWrite && (
        <ToolbarStack direction="row">
          {!isReorderMode ? (
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
          ) : (
            <>
              <Button
                onClick={handleCancelReorder}
                size="small"
                startIcon={<Cancel />}
                variant="outlined"
              >
                {tInventory(
                  "ingredients.actions.reorderIngredient.cancel.label",
                )}
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
        </ToolbarStack>
      )}
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

export default Ingredients;
