"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import RecipeIngredientDialog from "./RecipeIngredientDialog";

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

import { usePathname, useRouter } from "@/i18n/navigation";

import { Add, Delete, Edit } from "@mui/icons-material";
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
  Recipe,
  RecipeIngredient,
  RecipeIngredientFilterField,
  RecipeIngredientSortField,
} from "@/types/inventory";
import type { MenuItem } from "@/types/menus";

import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { fetcher } from "@/utils/fetcher";
import { localize } from "@/utils/locale";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface RecipeIngredientsProps {
  canCreate: boolean;
  canDelete: boolean;
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
  recipe,
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

  const locale = useLocale();

  const tCommon = useTranslations("common");
  const tInventory = useTranslations("inventory");

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

  // 分頁後格線只有當前頁，成本摘要與「哪些食材已用過」都要靠 SSR 的 recipe 一起更新
  const handleMutate = useCallback(() => {
    mutate();
    router.refresh();
  }, [mutate, router]);

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

  const handleCreateRecipe = useCallback(() => {
    if (!menuItem || !organizationSlug) return;

    setDialog({
      content: (
        <RecipeDialog
          defaultMenuItemId={menuItem.id}
          defaultName={menuItem.name}
          menuItems={[menuItem]}
          mutate={() => router.refresh()}
          organizationSlug={organizationSlug}
          recipe={null}
        />
      ),
      formId: "recipe-form",
      open: true,
      title: tInventory("recipes.actions.createRecipe.title"),
    });
  }, [menuItem, organizationSlug, router, setDialog, tInventory]);

  const handleUpdateRecipe = useCallback(() => {
    if (!menuItem || !organizationSlug || !recipe) return;

    setDialog({
      content: (
        <RecipeDialog
          defaultMenuItemId={null}
          defaultName={null}
          menuItems={[menuItem]}
          mutate={() => router.refresh()}
          organizationSlug={organizationSlug}
          recipe={recipe}
        />
      ),
      formId: "recipe-form",
      open: true,
      title: tInventory("recipes.actions.updateRecipe.title"),
    });
  }, [menuItem, organizationSlug, recipe, router, setDialog, tInventory]);

  const handleDeleteRecipe = useCallback(() => {
    if (!recipe) return;

    setDialog({
      content: (
        <DialogContentText>
          {tInventory.rich("recipes.actions.deleteRecipe.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
            name: localize(recipe.name, locale),
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        try {
          await fetcher(`/api/recipes/${recipe.id}`, { method: "DELETE" });

          enqueueSnackbar(tInventory("recipes.actions.deleteRecipe.success"), {
            variant: "success",
          });

          router.refresh();
        } catch {
          enqueueSnackbar(tInventory("recipes.actions.deleteRecipe.error"), {
            variant: "error",
          });
        }
      },
      open: true,
      title: tInventory("recipes.actions.deleteRecipe.title"),
    });
  }, [locale, recipe, router, setDialog, tInventory]);

  const handleCreateRecipeIngredient = useCallback(() => {
    if (!recipe) return;

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

  const columns = useMemo<GridColDef[]>(
    () => [
      ...(canWrite
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
      {
        field: "unitPrice",
        filterable: false,
        headerName: tInventory("recipes.ingredients.unitPrice.label"),
        sortable: false,
        valueFormatter: (value: RecipeIngredient["unitPrice"]) =>
          value == null
            ? ""
            : format.number(value, { maximumFractionDigits: 4 }),
      },
      {
        field: "cost",
        filterable: false,
        headerName: tInventory("recipes.ingredients.cost.label"),
        sortable: false,
        valueFormatter: (value: RecipeIngredient["cost"]) =>
          value == null
            ? ""
            : format.number(value, { maximumFractionDigits: 2 }),
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
      canWrite,
      dateFilterOperators,
      format,
      handleDeleteRecipeIngredient,
      handleUpdateRecipeIngredient,
      locale,
      numberFilterOperators,
      recipe,
      stringFilterOperators,
      tCommon,
      tInventory,
    ],
  );

  return (
    <>
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={2}>
        {recipe ? (
          <>
            {canWrite && (
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
            {menuItem && canWrite && (
              <Button
                onClick={handleUpdateRecipe}
                size="small"
                startIcon={<Edit />}
                variant="outlined"
              >
                {tInventory("recipes.actions.updateRecipe.title")}
              </Button>
            )}
            {canDelete && (
              <Button
                color="error"
                onClick={handleDeleteRecipe}
                size="small"
                startIcon={<Delete />}
                variant="outlined"
              >
                {tInventory("recipes.actions.deleteRecipe.title")}
              </Button>
            )}
          </>
        ) : (
          menuItem &&
          canCreate && (
            <Button
              onClick={handleCreateRecipe}
              size="small"
              startIcon={<Add />}
              variant="contained"
            >
              {tInventory("recipes.actions.createRecipe.title")}
            </Button>
          )
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
        rows={materials}
        sortingMode="server"
        sortModel={sortModel}
      />
    </>
  );
};

export default RecipeIngredients;
