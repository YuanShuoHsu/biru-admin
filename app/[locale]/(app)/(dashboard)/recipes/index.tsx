"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import RecipeDialog from "./RecipeDialog";

import AuditLogButton from "@/components/AuditLogButton";

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

import { Add, Delete, Edit, ListAlt } from "@mui/icons-material";
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
  Recipe,
  RecipeFilterField,
  RecipeSortField,
} from "@/types/inventory";
import type { MenuItem } from "@/types/menus";

import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { fetcher } from "@/utils/fetcher";
import { localize } from "@/utils/locale";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface RecipesProps {
  canViewAuditLog: boolean;
  canWrite: boolean;
  filterField?: RecipeFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  menuItems: MenuItem[];
  organizationSlug: string;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  recipes: Recipe[];
  rowCount: number;
  sortBy?: RecipeSortField;
  sortDirection?: SortDirection;
}

const Recipes = ({
  canViewAuditLog,
  canWrite,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  menuItems,
  organizationSlug,
  page,
  pageSize,
  quickFilterValue: initialQuickFilterValue,
  recipes: initialRecipes,
  rowCount: initialRowCount,
  sortBy,
  sortDirection,
}: RecipesProps) => {
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

  const apiRef = useGridApiRef();

  const locale = useLocale();

  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const organization = searchParams.get("organization");

  const tInventory = useTranslations("inventory");

  const {
    data: { data: recipes, total: rowCount } = {
      data: initialRecipes,
      total: initialRowCount,
    },
    mutate,
    isValidating: loading,
  } = useSWR(
    [
      `/api/organizations/${organizationSlug}/recipes`,
      filterModel.items[0]?.field,
      filterModel.items[0]?.operator,
      filterModel.items[0]?.value,
      filterModel.quickFilterValues,
      paginationModel.page,
      paginationModel.pageSize,
      sortModel,
    ],
    async () =>
      fetcher<{ data: Recipe[]; total: number }>(
        `/api/organizations/${organizationSlug}/recipes?${getDataGridSearchParams(paginationModel, filterModel, sortModel)}`,
      ),
    {
      fallbackData: { data: initialRecipes, total: initialRowCount },
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

  const handleCreateRecipe = useCallback(() => {
    setDialog({
      content: (
        <RecipeDialog
          menuItems={menuItems}
          mutate={mutate}
          organizationSlug={organizationSlug}
          recipe={null}
        />
      ),
      formId: "recipe-form",
      open: true,
      title: tInventory("recipes.actions.createRecipe.title"),
    });
  }, [menuItems, mutate, organizationSlug, setDialog, tInventory]);

  const handleUpdateRecipe = useCallback(
    (recipe: Recipe) => {
      setDialog({
        content: (
          <RecipeDialog
            menuItems={menuItems}
            mutate={mutate}
            organizationSlug={organizationSlug}
            recipe={recipe}
          />
        ),
        formId: "recipe-form",
        open: true,
        title: tInventory("recipes.actions.updateRecipe.title"),
      });
    },
    [menuItems, mutate, organizationSlug, setDialog, tInventory],
  );

  const handleViewIngredients = useCallback(
    ({ id }: Recipe) => {
      const params = new URLSearchParams({
        ...(organization && { organization }),
      });

      router.push(`/recipes/${id}?${params.toString()}`);
    },
    [organization, router],
  );

  const handleDeleteRecipe = useCallback(
    ({ id, name }: Recipe) => {
      setDialog({
        content: (
          <DialogContentText>
            {tInventory.rich("recipes.actions.deleteRecipe.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              name: localize(name, locale),
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          try {
            await fetcher(`/api/recipes/${id}`, { method: "DELETE" });

            enqueueSnackbar(
              tInventory("recipes.actions.deleteRecipe.success"),
              { variant: "success" },
            );

            mutate();
          } catch {
            enqueueSnackbar(tInventory("recipes.actions.deleteRecipe.error"), {
              variant: "error",
            });
          }
        },
        open: true,
        title: tInventory("recipes.actions.deleteRecipe.title"),
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
        headerName: tInventory("recipes.actions.label"),
        renderCell: ({ row }: GridRenderCellParams<Recipe>) => (
          <Stack height="100%" direction="row" alignItems="center" gap={1}>
            <Tooltip
              title={tInventory("recipes.actions.viewIngredients.title")}
            >
              <IconButton
                onClick={() => handleViewIngredients(row)}
                size="small"
              >
                <ListAlt fontSize="small" />
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
            {canWrite && (
              <Tooltip title={tInventory("recipes.actions.deleteRecipe.title")}>
                <IconButton
                  color="error"
                  onClick={() => handleDeleteRecipe(row)}
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
        headerName: tInventory("recipes.name.label"),
        valueGetter: (_value: unknown, row: Recipe) =>
          localize(row.name, locale),
      },
      {
        field: "menuItemName",
        filterable: false,
        headerName: tInventory("recipes.menuItemId.label"),
        sortable: false,
        valueGetter: (_value: unknown, row: Recipe) =>
          localize(row.menuItemName, locale),
      },
      {
        field: "recipeYield",
        filterOperators: numberFilterOperators,
        headerName: tInventory("recipes.recipeYield.label"),
        type: "number",
      },
      {
        field: "cost",
        filterable: false,
        headerName: tInventory("recipes.cost.label"),
        sortable: false,
        valueFormatter: (value: number) => format.number(Math.round(value)),
      },
      {
        field: "costPerServing",
        filterable: false,
        headerName: tInventory("recipes.costPerServing.label"),
        sortable: false,
        valueGetter: (_value: unknown, row: Recipe) =>
          format.number(Math.round(row.cost / row.recipeYield)),
      },
      {
        field: "price",
        filterable: false,
        headerName: tInventory("recipes.price.label"),
        sortable: false,
        valueFormatter: (value: Recipe["price"]) =>
          value == null ? "" : format.number(value),
      },
      {
        field: "margin",
        filterable: false,
        headerName: tInventory("recipes.margin.label"),
        sortable: false,
        valueGetter: (_value: unknown, row: Recipe) =>
          row.price
            ? format.number(
                (row.price - row.cost / row.recipeYield) / row.price,
                { style: "percent" },
              )
            : "",
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
      canViewAuditLog,
      canWrite,
      dateFilterOperators,
      format,
      handleDeleteRecipe,
      handleUpdateRecipe,
      handleViewIngredients,
      locale,
      numberFilterOperators,
      stringFilterOperators,
      tInventory,
    ],
  );

  return (
    <>
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={2}>
        {canWrite && (
          <Button
            onClick={handleCreateRecipe}
            size="small"
            startIcon={<Add />}
            variant="contained"
          >
            {tInventory("recipes.actions.createRecipe.title")}
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
        rows={recipes}
        sortingMode="server"
        sortModel={sortModel}
      />
    </>
  );
};

export default Recipes;
