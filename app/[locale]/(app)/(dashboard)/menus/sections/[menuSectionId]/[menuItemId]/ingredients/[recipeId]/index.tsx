"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import RecipeIngredientDialog from "../RecipeIngredientDialog";

import { renderEmptyableCell } from "@/components/EmptyCell";
import { DragHandle, Sortable } from "@/components/Sortable";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import { getPageSizeOptions } from "@/constants/pagination";

import { arrayMove } from "@dnd-kit/helpers";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { isSortableOperation } from "@dnd-kit/react/sortable";

import {
  useDateFilterOperators,
  useNumberFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
import { useFormatMoney } from "@/hooks/useFormatMoney";

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
  GridPaginationModel,
  GridRenderCellParams,
  GridSortModel,
} from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type {
  Ingredient,
  MenuItemRecipeDetail,
  Recipe,
  RecipeIngredient,
  RecipeIngredientFilterField,
  RecipeIngredientSortField,
} from "@/types/inventory";
import type { MenuItem } from "@/types/menus";

import {
  getDataGridSearchParams,
  getFilterItemParams,
  isFilteredOrSorted,
} from "@/utils/dataGrid";
import { fetcher } from "@/utils/fetcher";
import { formatUnitPriceOf } from "@/utils/ingredients";
import { localize } from "@/utils/locale";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface RecipeIngredientsProps {
  canCreate: boolean;
  canDelete: boolean;
  canViewPurchasing: boolean;
  canWrite: boolean;
  filterField?: RecipeIngredientFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  ingredients: Ingredient[];
  materials: RecipeIngredient[];
  menuItem: MenuItem;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  recipe: Recipe;
  rowCount: number;
  sortBy?: RecipeIngredientSortField;
  sortDirection?: SortDirection;
}

const RecipeIngredients = ({
  canCreate,
  canDelete,
  canViewPurchasing,
  canWrite,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  ingredients,
  materials: initialMaterials,
  menuItem,
  page,
  pageSize,
  quickFilterValue: initialQuickFilterValue,
  recipe: initialRecipe,
  rowCount: initialRowCount,
  sortBy,
  sortDirection,
}: RecipeIngredientsProps) => {
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

  const apiRef = useGridApiRef();

  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const format = useFormatter();

  const formatMoney = useFormatMoney();

  const priceCurrency = menuItem.offer?.priceCurrency;

  const locale = useLocale();

  const tCommon = useTranslations("common");
  const tInventory = useTranslations("inventory");

  const { data: recipe, mutate: mutateRecipe } = useSWR(
    `/api/menu-items/${menuItem.id}/recipe`,
    (url: string) =>
      fetcher<MenuItemRecipeDetail>(url).then(
        ({ recipe }) => recipe ?? initialRecipe,
      ),
    { fallbackData: initialRecipe },
  );

  const {
    data: { data: materials, total: rowCount } = {
      data: initialMaterials,
      total: initialRowCount,
    },
    mutate,
    isValidating: loading,
  } = useSWR(
    [
      `/api/recipes/${recipe.id}/recipe-ingredients`,
      filterModel.items[0]?.field,
      filterModel.items[0]?.operator,
      filterModel.items[0]?.value,
      filterModel.quickFilterValues,
      paginationModel.page,
      paginationModel.pageSize,
      sortModel,
    ],
    async ([url]) =>
      fetcher<{ data: RecipeIngredient[]; total: number }>(
        `${url}?${getDataGridSearchParams(paginationModel, filterModel, sortModel)}`,
      ),
    {
      fallbackData: { data: initialMaterials, total: initialRowCount },
      onSuccess: () => {
        setTimeout(() => {
          apiRef.current?.autosizeColumns(autosizeOptions);
        }, 0);
      },
    },
  );

  const handleMutate = useCallback(() => {
    mutate();
    mutateRecipe();
  }, [mutate, mutateRecipe]);

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
          {tInventory.rich(
            "recipes.ingredients.actions.reorderRecipeIngredient.confirm",
            { bold: (chunks) => <strong>{chunks}</strong> },
          )}
        </DialogContentText>
      ),
      onConfirm: async () => {
        setIsReorderMode(true);

        setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
      },
      open: true,
      title: tInventory(
        "recipes.ingredients.actions.reorderRecipeIngredient.title",
      ),
    });
  }, [apiRef, setDialog, tInventory]);

  const handleSaveReorder = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tInventory.rich(
            "recipes.ingredients.actions.reorderRecipeIngredient.save.confirm",
            { bold: (chunks) => <strong>{chunks}</strong> },
          )}
        </DialogContentText>
      ),
      onConfirm: async () => {
        try {
          await fetcher(
            `/api/recipes/${recipe.id}/recipe-ingredients/reorder`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ids: materials.map(({ id }) => id),
                offset: paginationModel.page * paginationModel.pageSize,
              }),
            },
          );

          setIsReorderMode(false);

          setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);

          enqueueSnackbar(
            tInventory(
              "recipes.ingredients.actions.reorderRecipeIngredient.save.success",
            ),
            { variant: "success" },
          );
        } catch {
          mutate();

          enqueueSnackbar(
            tInventory(
              "recipes.ingredients.actions.reorderRecipeIngredient.save.error",
            ),
            { variant: "error" },
          );
        }
      },
      open: true,
      title: tInventory(
        "recipes.ingredients.actions.reorderRecipeIngredient.save.label",
      ),
    });
  }, [
    apiRef,
    materials,
    mutate,
    paginationModel.page,
    paginationModel.pageSize,
    recipe,
    setDialog,
    tInventory,
  ]);

  const handleCancelReorder = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tInventory.rich(
            "recipes.ingredients.actions.reorderRecipeIngredient.cancel.confirm",
            { bold: (chunks) => <strong>{chunks}</strong> },
          )}
        </DialogContentText>
      ),
      onConfirm: async () => {
        setIsReorderMode(false);

        mutate();
      },
      open: true,
      title: tInventory(
        "recipes.ingredients.actions.reorderRecipeIngredient.cancel.label",
      ),
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
      { data: arrayMove(materials, fromIndex, toIndex), total: rowCount },
      false,
    );
  };

  const handleCreateRecipeIngredient = useCallback(() => {
    setDialog({
      content: (
        <RecipeIngredientDialog
          ingredients={ingredients}
          material={null}
          materials={recipe.recipeIngredients || []}
          mutate={handleMutate}
          recipe={recipe}
        />
      ),
      formId: "recipe-ingredient-form",
      open: true,
      title: tInventory(
        "recipes.ingredients.actions.createRecipeIngredient.title",
      ),
    });
  }, [handleMutate, ingredients, recipe, setDialog, tInventory]);

  const handleUpdateRecipeIngredient = useCallback(
    (material: RecipeIngredient) => {
      setDialog({
        content: (
          <RecipeIngredientDialog
            ingredients={ingredients}
            material={material}
            materials={recipe.recipeIngredients || []}
            mutate={handleMutate}
            recipe={recipe}
          />
        ),
        formId: "recipe-ingredient-form",
        open: true,
        title: tInventory(
          "recipes.ingredients.actions.updateRecipeIngredient.title",
        ),
      });
    },
    [handleMutate, ingredients, recipe, setDialog, tInventory],
  );

  const handleDeleteRecipeIngredient = useCallback(
    ({ id, ingredientName }: RecipeIngredient) => {
      setDialog({
        content: (
          <DialogContentText>
            {tInventory.rich(
              "recipes.ingredients.actions.deleteRecipeIngredient.confirm",
              {
                bold: (chunks) => <strong>{chunks}</strong>,
                name: localize(ingredientName, locale),
              },
            )}
          </DialogContentText>
        ),
        onConfirm: async () => {
          try {
            await fetcher(
              `/api/recipes/${recipe.id}/recipe-ingredients/${id}`,
              { method: "DELETE" },
            );

            enqueueSnackbar(
              tInventory(
                "recipes.ingredients.actions.deleteRecipeIngredient.success",
              ),
              { variant: "success" },
            );

            handleMutate();
          } catch {
            enqueueSnackbar(
              tInventory(
                "recipes.ingredients.actions.deleteRecipeIngredient.error",
              ),
              { variant: "error" },
            );
          }
        },
        open: true,
        title: tInventory(
          "recipes.ingredients.actions.deleteRecipeIngredient.title",
        ),
      });
    },
    [handleMutate, locale, recipe, setDialog, tInventory],
  );

  const columns = useMemo<GridColDef[]>(() => {
    const costColumns: GridColDef[] = [
      {
        field: "unitPrice",
        filterable: false,
        headerName: tInventory("recipes.ingredients.unitPrice.label"),
        renderCell: renderEmptyableCell,
        valueFormatter: (
          value: RecipeIngredient["unitPrice"],
          row: RecipeIngredient,
        ) =>
          value == null
            ? ""
            : formatUnitPriceOf(
                value,
                { priceCurrency, unitCode: row.unitCode },
                { format, formatMoney, tCommon, tInventory },
              ),
      },
      {
        field: "cost",
        filterable: false,
        headerName: tInventory("recipes.ingredients.cost.label"),
        renderCell: renderEmptyableCell,
        valueFormatter: (value: RecipeIngredient["cost"]) =>
          value == null
            ? ""
            : formatMoney(value, priceCurrency, {
                maximumFractionDigits: 2,
              }),
      },
    ];

    return [
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
      ...((canWrite || canDelete) && !isReorderMode
        ? [
            {
              disableColumnMenu: true,
              field: "actions",
              filterable: false,
              headerName: tInventory("recipes.ingredients.actions.label"),
              renderCell: ({ row }: GridRenderCellParams<RecipeIngredient>) => (
                <Stack
                  height="100%"
                  direction="row"
                  alignItems="center"
                  gap={1}
                >
                  {canWrite && (
                    <Tooltip
                      title={tInventory(
                        "recipes.ingredients.actions.updateRecipeIngredient.title",
                      )}
                    >
                      <IconButton
                        onClick={() => handleUpdateRecipeIngredient(row)}
                        size="small"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {canDelete && (
                    <Tooltip
                      title={tInventory(
                        "recipes.ingredients.actions.deleteRecipeIngredient.title",
                      )}
                    >
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteRecipeIngredient(row)}
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
        field: "ingredientName",
        filterOperators: stringFilterOperators,
        headerName: tInventory("recipes.ingredients.ingredientId.label"),
        valueGetter: (_value: unknown, row: RecipeIngredient) =>
          localize(row.ingredientName, locale),
      },
      {
        field: "requiredQuantity",
        filterOperators: numberFilterOperators,
        headerName: `${tInventory("recipes.ingredients.requiredQuantity.label")}${tCommon("parenthesisOpen")}${format.number(recipe.recipeYield)} ${tInventory("recipes.recipeYield.unit")}${tCommon("parenthesisClose")}`,
        valueGetter: (_value: unknown, row: RecipeIngredient) =>
          `${format.number(Number(row.requiredQuantity))} ${tInventory(`units.${row.unitCode}`)}`,
      },
      ...(canViewPurchasing ? costColumns : []),
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
    ];
  }, [
    canDelete,
    canViewPurchasing,
    canWrite,
    dateFilterOperators,
    format,
    formatMoney,
    handleDeleteRecipeIngredient,
    handleUpdateRecipeIngredient,
    isReorderMode,
    locale,
    numberFilterOperators,
    priceCurrency,
    recipe,
    stringFilterOperators,
    tCommon,
    tInventory,
  ]);

  return (
    <>
      {(canCreate || canWrite) && (
        <Stack direction="row" flexWrap="wrap" alignItems="center" gap={2}>
          {!isReorderMode ? (
            <>
              {canCreate && (
                <Button
                  onClick={handleCreateRecipeIngredient}
                  size="small"
                  startIcon={<Add />}
                  variant="contained"
                >
                  {tInventory(
                    "recipes.ingredients.actions.createRecipeIngredient.title",
                  )}
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
                  {tInventory(
                    "recipes.ingredients.actions.reorderRecipeIngredient.title",
                  )}
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
                {tInventory(
                  "recipes.ingredients.actions.reorderRecipeIngredient.cancel.label",
                )}
              </Button>
              <Button
                onClick={handleSaveReorder}
                size="small"
                startIcon={<Save />}
                variant="contained"
              >
                {tInventory(
                  "recipes.ingredients.actions.reorderRecipeIngredient.save.label",
                )}
              </Button>
            </>
          )}
        </Stack>
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
          rows={materials}
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

export default RecipeIngredients;
