"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import IngredientDialog from "./IngredientDialog";
import TransactionDialog from "./TransactionDialog";

import AuditLogButton from "@/components/AuditLogButton";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import {
  DEFAULT_PAGINATION_QUERY,
  getPageSizeOptions,
} from "@/constants/pagination";

import {
  useDateFilterOperators,
  useEnumFilterOperators,
  useNumberFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";

import { usePathname, useRouter } from "@/i18n/navigation";

import {
  Add,
  Delete,
  Edit,
  Inventory,
  Sell,
  SwapVert,
} from "@mui/icons-material";
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
  Ingredient,
  IngredientFilterField,
  IngredientSortField,
} from "@/types/inventory";

import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { getIngredientEnumOptions } from "@/utils/enumOptions";
import { fetcher } from "@/utils/fetcher";
import { localize } from "@/utils/locale";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface IngredientsProps {
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
}: IngredientsProps) => {
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

  const handleCreateIngredient = useCallback(() => {
    setDialog({
      content: (
        <IngredientDialog
          ingredient={null}
          mutate={mutate}
          organizationSlug={organizationSlug}
        />
      ),
      formId: "ingredient-form",
      open: true,
      title: tInventory("ingredients.actions.createIngredient.title"),
    });
  }, [mutate, organizationSlug, setDialog, tInventory]);

  const handleUpdateIngredient = useCallback(
    (ingredient: Ingredient) => {
      setDialog({
        content: (
          <IngredientDialog
            ingredient={ingredient}
            mutate={mutate}
            organizationSlug={organizationSlug}
          />
        ),
        formId: "ingredient-form",
        open: true,
        title: tInventory("ingredients.actions.updateIngredient.title"),
      });
    },
    [mutate, organizationSlug, setDialog, tInventory],
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

  const handleViewOffers = useCallback(
    ({ id }: Ingredient) => {
      const params = new URLSearchParams({
        ...(organization && { organization }),
      });

      router.push(`/ingredients/${id}/offers?${params.toString()}`);
    },
    [organization, router],
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
              tInventory("ingredients.actions.deleteIngredient.success"),
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
      {
        disableColumnMenu: true,
        field: "actions",
        filterable: false,
        headerName: tInventory("ingredients.actions.label"),
        renderCell: ({ row }: GridRenderCellParams<Ingredient>) => (
          <Stack height="100%" direction="row" alignItems="center" gap={1}>
            <Tooltip title={tInventory("ingredients.actions.viewOffers.title")}>
              <IconButton onClick={() => handleViewOffers(row)} size="small">
                <Sell fontSize="small" />
              </IconButton>
            </Tooltip>
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
                <IconButton
                  onClick={() => handleRecordTransaction(row)}
                  size="small"
                >
                  <Inventory fontSize="small" />
                </IconButton>
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
        field: "inventoryLevel",
        filterOperators: numberFilterOperators,
        headerName: tInventory("ingredients.inventoryLevel.label"),
        renderCell: ({
          row: { inventoryLevel, lowStockThreshold, unitCode },
        }: GridRenderCellParams<Ingredient>) => {
          const isLowStock =
            lowStockThreshold != null &&
            Number(inventoryLevel) <= Number(lowStockThreshold);

          return (
            <Chip
              color={isLowStock ? "warning" : "default"}
              label={`${format.number(Number(inventoryLevel))} ${tInventory(`units.${unitCode}`)}`}
              size="small"
              variant="outlined"
            />
          );
        },
        type: "number",
      },
      {
        field: "unitCode",
        filterOperators: enumFilterOperators,
        headerName: tInventory("ingredients.unitCode.label"),
        type: "singleSelect",
        valueFormatter: (value: Ingredient["unitCode"]) =>
          tInventory(`units.${value}`),
        valueOptions: enumOptions.unitCode,
      },
      {
        field: "unitPrice",
        filterable: false,
        headerName: tInventory("ingredients.unitPrice.label"),
        sortable: false,
        valueFormatter: (value: Ingredient["unitPrice"]) =>
          value == null
            ? ""
            : format.number(value, { maximumFractionDigits: 4 }),
      },
      {
        field: "lowStockThreshold",
        filterOperators: numberFilterOperators,
        headerName: `${tInventory("ingredients.lowStockThreshold.label")} ${tCommon("optional")}`,
        type: "number",
        valueFormatter: (value: Ingredient["lowStockThreshold"]) =>
          value == null ? "" : format.number(Number(value)),
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
      enumOptions.unitCode,
      format,
      handleDeleteIngredient,
      handleRecordTransaction,
      handleUpdateIngredient,
      handleViewOffers,
      handleViewTransactions,
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
        {canWrite && (
          <Button
            onClick={handleCreateIngredient}
            size="small"
            startIcon={<Add />}
            variant="contained"
          >
            {tInventory("ingredients.actions.createIngredient.title")}
          </Button>
        )}
      </Stack>
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
        sortingMode="server"
        sortModel={sortModel}
      />
    </>
  );
};

export default Ingredients;
