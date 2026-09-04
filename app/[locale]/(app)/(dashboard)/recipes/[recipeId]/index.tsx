"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo } from "react";
import useSWR from "swr";

import RecipeIngredientDialog from "./RecipeIngredientDialog";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";

import { Add, Delete, Edit } from "@mui/icons-material";
import {
  Button,
  DialogContentText,
  IconButton,
  Stack,
  Tooltip,
} from "@mui/material";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Ingredient, Recipe, RecipeIngredient } from "@/types/inventory";

import { fetcher } from "@/utils/fetcher";
import { localize } from "@/utils/locale";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface RecipeIngredientsProps {
  canWrite: boolean;
  ingredients: Ingredient[];
  recipe: Recipe;
}

const RecipeIngredients = ({
  canWrite,
  ingredients,
  recipe,
}: RecipeIngredientsProps) => {
  const { setDialog } = useDialogStore((state) => state);

  const apiRef = useGridApiRef();

  const format = useFormatter();

  const locale = useLocale();

  const tInventory = useTranslations("inventory");

  const {
    data: materials = recipe.recipeIngredients || [],
    mutate,
    isValidating: loading,
  } = useSWR(
    `/api/recipes/${recipe.id}/recipe-ingredients`,
    async (url) => fetcher<RecipeIngredient[]>(url),
    {
      fallbackData: recipe.recipeIngredients || [],
      onSuccess: () => {
        setTimeout(() => {
          apiRef.current?.autosizeColumns(autosizeOptions);
        }, 0);
      },
    },
  );

  const handleCreateRecipeIngredient = useCallback(() => {
    setDialog({
      content: (
        <RecipeIngredientDialog
          ingredients={ingredients}
          material={null}
          mutate={mutate}
          recipe={recipe}
        />
      ),
      formId: "recipe-ingredient-form",
      open: true,
      title: tInventory(
        "recipes.ingredients.actions.createRecipeIngredient.title",
      ),
    });
  }, [ingredients, mutate, recipe, setDialog, tInventory]);

  const handleUpdateRecipeIngredient = useCallback(
    (material: RecipeIngredient) => {
      setDialog({
        content: (
          <RecipeIngredientDialog
            ingredients={ingredients}
            material={material}
            mutate={mutate}
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
    [ingredients, mutate, recipe, setDialog, tInventory],
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

            mutate();
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
    [locale, mutate, recipe.id, setDialog, tInventory],
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
        headerName: tInventory("recipes.ingredients.ingredientId.label"),
        valueGetter: (_value: unknown, row: RecipeIngredient) =>
          localize(row.ingredientName, locale),
      },
      {
        field: "requiredQuantity",
        headerName: tInventory("recipes.ingredients.requiredQuantity.label"),
        valueGetter: (_value: unknown, row: RecipeIngredient) =>
          `${format.number(Number(row.requiredQuantity))} ${tInventory(`units.${row.unitCode}`)}`,
      },
      {
        field: "unitPrice",
        headerName: tInventory("recipes.ingredients.unitPrice.label"),
        valueFormatter: (value: RecipeIngredient["unitPrice"]) =>
          value == null
            ? ""
            : format.number(value, { maximumFractionDigits: 4 }),
      },
      {
        field: "cost",
        headerName: tInventory("recipes.ingredients.cost.label"),
        valueFormatter: (value: RecipeIngredient["cost"]) =>
          value == null
            ? ""
            : format.number(value, { maximumFractionDigits: 2 }),
      },
    ],
    [
      canWrite,
      format,
      handleDeleteRecipeIngredient,
      handleUpdateRecipeIngredient,
      locale,
      tInventory,
    ],
  );

  return (
    <>
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={2}>
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
      </Stack>
      <DataGrid
        {...DATA_GRID_PROPS}
        apiRef={apiRef}
        columns={columns}
        loading={loading}
        rows={materials}
      />
    </>
  );
};

export default RecipeIngredients;
