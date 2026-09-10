"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo } from "react";
import useSWR from "swr";

import RecipeIngredientDialog from "./RecipeIngredientDialog";

import AuditLogButton from "@/components/AuditLogButton";
import RecipeDialog from "@/components/RecipeDialog";

import { DATA_GRID_PROPS } from "@/constants/dataGrid";
import { DEFAULT_PAGINATION_QUERY } from "@/constants/pagination";

import { useFormatMoney } from "@/hooks/useFormatMoney";

import { usePathname, useRouter } from "@/i18n/navigation";

import { Add, Edit, Scale } from "@mui/icons-material";
import { Button, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  Ingredient,
  MenuItemRecipeDetail,
  Recipe,
} from "@/types/inventory";
import type { MenuItem } from "@/types/menus";

import { fetcher } from "@/utils/fetcher";
import { getHref } from "@/utils/href";
import {
  costPerServing,
  grossMargin,
  grossProfitPerServing,
} from "@/utils/recipes";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface MenuItemRecipeProps {
  canCreate: boolean;
  canViewAuditLog: boolean;
  canViewPurchasing: boolean;
  canWrite: boolean;
  ingredients: Ingredient[];
  menuItem: MenuItem;
  organizationSlug: string;
  recipe: Recipe | null;
}

const MenuItemRecipe = ({
  canCreate,
  canViewAuditLog,
  canViewPurchasing,
  canWrite,
  ingredients,
  menuItem,
  organizationSlug,
  recipe: initialRecipe,
}: MenuItemRecipeProps) => {
  const { setDialog } = useDialogStore((state) => state);

  const pathname = usePathname();
  const router = useRouter();

  const format = useFormatter();
  const formatMoney = useFormatMoney();

  const tInventory = useTranslations("inventory");

  const priceCurrency = menuItem.offer?.priceCurrency;

  const { data: recipe, mutate: mutateRecipe } = useSWR(
    `/api/menu-items/${menuItem.id}/recipe`,
    (url: string) =>
      fetcher<MenuItemRecipeDetail>(url).then(({ recipe }) => recipe),
    { fallbackData: initialRecipe },
  );

  const handleViewRecipeIngredients = useCallback(
    (id: string) =>
      router.push(
        getHref(`${pathname}/${id}`, {
          organization: organizationSlug,
          ...DEFAULT_PAGINATION_QUERY,
        }),
      ),
    [organizationSlug, pathname, router],
  );

  const handleUpdateRecipe = useCallback(
    (target: Recipe) => {
      setDialog({
        content: <RecipeDialog mutate={mutateRecipe} recipe={target} />,
        formId: "recipe-form",
        open: true,
        title: tInventory("recipes.actions.updateRecipe.title"),
      });
    },
    [mutateRecipe, setDialog, tInventory],
  );

  const handleCreateRecipeIngredient = useCallback(async () => {
    let target = recipe;

    // 食譜對使用者不是獨立的東西，第一次加材料時才隱式建立；份量由後端預設帶 1
    if (!target) {
      try {
        target = await fetcher<Recipe>(
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

        mutateRecipe(target);
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
          materials={target.recipeIngredients || []}
          mutate={mutateRecipe}
          recipe={target}
        />
      ),
      formId: "recipe-ingredient-form",
      open: true,
      title: tInventory(
        "recipes.ingredients.actions.createRecipeIngredient.title",
      ),
    });
  }, [
    ingredients,
    menuItem,
    mutateRecipe,
    organizationSlug,
    recipe,
    setDialog,
    tInventory,
  ]);

  const columns = useMemo<GridColDef[]>(() => {
    const unavailable = tInventory("recipes.cost.unavailable");
    const money = (value: number | null) =>
      value == null
        ? unavailable
        : formatMoney(value, priceCurrency, { maximumFractionDigits: 2 });
    const renderLoss = (value: number | null, text: string) => (
      <Typography
        color={value != null && value < 0 ? "error.main" : "text.primary"}
        component="span"
        variant="body2"
      >
        {text}
      </Typography>
    );

    const costColumns: GridColDef[] = [
      {
        field: "cost",
        headerName: tInventory("recipes.cost.label"),
        valueGetter: (_value: unknown, row: Recipe) => money(row.cost ?? null),
      },
      {
        field: "costPerServing",
        headerName: tInventory("recipes.costPerServing.label"),
        valueGetter: (_value: unknown, row: Recipe) =>
          money(costPerServing(row)),
      },
      {
        field: "grossProfitPerServing",
        headerName: tInventory("recipes.grossProfitPerServing.label"),
        renderCell: ({ row, value }: GridRenderCellParams<Recipe, string>) =>
          renderLoss(
            grossProfitPerServing(row, Number(row.price)),
            value ?? "",
          ),
        valueGetter: (_value: unknown, row: Recipe) =>
          money(grossProfitPerServing(row, Number(row.price))),
      },
      {
        field: "margin",
        headerName: tInventory("recipes.margin.label"),
        renderCell: ({ row, value }: GridRenderCellParams<Recipe, string>) =>
          renderLoss(grossMargin(row, Number(row.price)), value ?? ""),
        valueGetter: (_value: unknown, row: Recipe) => {
          const margin = grossMargin(row, Number(row.price));

          return margin == null
            ? unavailable
            : format.number(margin, {
                maximumFractionDigits: 1,
                style: "percent",
              });
        },
      },
    ];

    return [
      {
        field: "actions",
        headerName: tInventory("recipes.ingredients.actions.label"),
        renderCell: ({ row }: GridRenderCellParams<Recipe>) => (
          <Stack height="100%" direction="row" alignItems="center" gap={1}>
            <Tooltip
              title={tInventory("recipes.actions.viewRecipeIngredients.title")}
            >
              <IconButton
                onClick={() => handleViewRecipeIngredients(row.id)}
                size="small"
              >
                <Scale fontSize="small" />
              </IconButton>
            </Tooltip>
            {canWrite && (
              <Tooltip title={tInventory("recipes.actions.updateRecipe.title")}>
                <IconButton
                  onClick={() => handleUpdateRecipe(row)}
                  size="small"
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canViewAuditLog && <AuditLogButton resourceId={row.id} />}
          </Stack>
        ),
        resizable: false,
      },
      {
        field: "recipeYield",
        headerName: tInventory("recipes.recipeYield.label"),
        valueGetter: (value: number) =>
          `${format.number(value)} ${tInventory("recipes.recipeYield.unit")}`,
      },
      ...(canViewPurchasing ? costColumns : []),
    ];
  }, [
    canViewAuditLog,
    canViewPurchasing,
    canWrite,
    format,
    formatMoney,
    handleUpdateRecipe,
    handleViewRecipeIngredients,
    priceCurrency,
    tInventory,
  ]);

  return (
    <>
      {canCreate && !recipe && (
        <Stack direction="row" flexWrap="wrap" alignItems="center" gap={2}>
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
        </Stack>
      )}
      <DataGrid
        {...DATA_GRID_PROPS}
        columns={columns}
        disableColumnFilter
        disableColumnMenu
        disableColumnSorting
        hideFooter
        rows={recipe ? [recipe] : []}
      />
    </>
  );
};

export default MenuItemRecipe;
