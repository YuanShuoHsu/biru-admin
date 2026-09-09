"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import RecipeIngredientDialog from "./RecipeIngredientDialog";

import AuditLogButton from "@/components/AuditLogButton";
import { renderEmptyableCell } from "@/components/EmptyCell";
import RecipeDialog from "@/components/RecipeDialog";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import { getPageSizeOptions } from "@/constants/pagination";

import {
  useDateFilterOperators,
  useNumberFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
import { useFormatMoney } from "@/hooks/useFormatMoney";

import { usePathname, useRouter } from "@/i18n/navigation";

import { Add, Delete, Edit } from "@mui/icons-material";
import {
  Button,
  DialogContentText,
  IconButton,
  Stack,
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

import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { fetcher } from "@/utils/fetcher";
import { formatUnitPriceOf } from "@/utils/ingredients";
import {
  costPerServing,
  grossMargin,
  grossProfitPerServing,
} from "@/utils/recipes";
import { localize } from "@/utils/locale";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface RecipeIngredientsProps {
  canCreate: boolean;
  canDelete: boolean;
  canViewAuditLog: boolean;
  canViewPurchasing: boolean;
  canWrite: boolean;
  filterField?: RecipeIngredientFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  ingredients: Ingredient[];
  materials: RecipeIngredient[];
  menuItem: MenuItem | null;
  organizationSlug: string | null;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  recipe: Recipe | null;
  rowCount: number;
  sortBy?: RecipeIngredientSortField;
  sortDirection?: SortDirection;
}

const RecipeIngredients = ({
  canCreate,
  canDelete,
  canViewAuditLog,
  canViewPurchasing,
  canWrite,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  ingredients,
  materials: initialMaterials,
  menuItem,
  organizationSlug,
  page,
  pageSize,
  quickFilterValue: initialQuickFilterValue,
  recipe: initialRecipe,
  rowCount: initialRowCount,
  sortBy,
  sortDirection,
}: RecipeIngredientsProps) => {
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

  const priceCurrency = menuItem?.offer?.priceCurrency;

  const locale = useLocale();

  const tCommon = useTranslations("common");
  const tInventory = useTranslations("inventory");

  const { data: recipe, mutate: mutateRecipe } = useSWR(
    menuItem ? `/api/menu-items/${menuItem.id}/recipe` : null,
    (url: string) =>
      fetcher<MenuItemRecipeDetail>(url).then(({ recipe }) => recipe),
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
    recipe && [
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

  const handleUpdateRecipe = useCallback(() => {
    if (!recipe) return;

    setDialog({
      content: <RecipeDialog mutate={mutateRecipe} recipe={recipe} />,
      formId: "recipe-form",
      open: true,
      title: tInventory("recipes.actions.updateRecipe.title"),
    });
  }, [mutateRecipe, recipe, setDialog, tInventory]);

  const handleCreateRecipeIngredient = useCallback(async () => {
    if (!menuItem || !organizationSlug) return;

    let targetRecipe = recipe;

    // 食譜對使用者不是獨立的東西，第一次加材料時才隱式建立；份量由後端預設帶 1
    if (!targetRecipe) {
      try {
        targetRecipe = await fetcher<Recipe>(
          `/api/organizations/${organizationSlug}/recipes`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              menuItemId: menuItem.id,
              name: menuItem.name,
            }),
          },
        );

        mutateRecipe(targetRecipe);
      } catch {
        enqueueSnackbar(tInventory("recipes.actions.createRecipe.error"), {
          variant: "error",
        });

        return;
      }
    }

    setDialog({
      content: (
        <RecipeIngredientDialog
          ingredients={ingredients}
          material={null}
          materials={targetRecipe.recipeIngredients || []}
          mutate={handleMutate}
          recipe={targetRecipe}
        />
      ),
      formId: "recipe-ingredient-form",
      open: true,
      title: tInventory(
        "recipes.ingredients.actions.createRecipeIngredient.title",
      ),
    });
  }, [
    handleMutate,
    ingredients,
    menuItem,
    mutateRecipe,
    organizationSlug,
    recipe,
    setDialog,
    tInventory,
  ]);

  const handleUpdateRecipeIngredient = useCallback(
    (material: RecipeIngredient) => {
      if (!recipe) return;

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
      if (!recipe) return;

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

  const summaryItems = useMemo<
    { color?: string; label: string; value: string }[]
  >(() => {
    if (!recipe) return [];

    const unavailable = tInventory("recipes.cost.unavailable");
    const money = (value: number | null) =>
      value == null
        ? unavailable
        : formatMoney(value, priceCurrency, { maximumFractionDigits: 2 });
    const loss = (value: number | null) =>
      value != null && value < 0 ? { color: "error.main" } : {};
    const price = Number(recipe.price);
    const profit = grossProfitPerServing(recipe, price);
    const margin = grossMargin(recipe, price);

    return [
      {
        label: tInventory("recipes.recipeYield.label"),
        value: `${format.number(recipe.recipeYield)} ${tInventory("recipes.recipeYield.unit")}`,
      },
      ...(canViewPurchasing
        ? [
            {
              label: tInventory("recipes.cost.label"),
              value: money(recipe.cost ?? null),
            },
            {
              label: tInventory("recipes.costPerServing.label"),
              value: money(costPerServing(recipe)),
            },
            {
              ...loss(profit),
              label: tInventory("recipes.grossProfitPerServing.label"),
              value: money(profit),
            },
            {
              ...loss(margin),
              label: tInventory("recipes.margin.label"),
              value:
                margin == null
                  ? unavailable
                  : format.number(margin, {
                      maximumFractionDigits: 1,
                      style: "percent",
                    }),
            },
          ]
        : []),
    ];
  }, [
    canViewPurchasing,
    format,
    formatMoney,
    priceCurrency,
    recipe,
    tInventory,
  ]);

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
      ...(canWrite || canDelete
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
        headerName: recipe
          ? `${tInventory("recipes.ingredients.requiredQuantity.label")}${tCommon("parenthesisOpen")}${format.number(recipe.recipeYield)} ${tInventory("recipes.recipeYield.unit")}${tCommon("parenthesisClose")}`
          : tInventory("recipes.ingredients.requiredQuantity.label"),
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
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={2}>
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
        {recipe && (
          <>
            {canWrite && (
              <Button
                onClick={handleUpdateRecipe}
                size="small"
                startIcon={<Edit />}
                variant="outlined"
              >
                {tInventory("recipes.actions.updateRecipe.title")}
              </Button>
            )}
            {canViewAuditLog && <AuditLogButton resourceId={recipe.id} />}
          </>
        )}
      </Stack>
      {summaryItems.length > 0 && (
        <Stack direction="row" flexWrap="wrap" alignItems="center" gap={2}>
          {summaryItems.map(({ color, label, value }) => (
            <Typography color="text.secondary" key={label} variant="body2">
              {label}
              {tCommon("colon")}
              <Typography
                component="span"
                color={color ?? "text.primary"}
                variant="body2"
              >
                {value}
              </Typography>
            </Typography>
          ))}
        </Stack>
      )}
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
        sortingMode="server"
        sortModel={sortModel}
      />
    </>
  );
};

export default RecipeIngredients;
