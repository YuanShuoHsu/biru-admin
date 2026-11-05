"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import AuditLogButton from "@/components/AuditLogButton";
import DataGrid from "@/components/DataGrid";
import { renderEmptyableCell } from "@/components/EmptyCell";
import RecipeDialog from "@/components/RecipeDialog";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGINATION_QUERY,
  getPageSizeOptions,
} from "@/constants/pagination";

import {
  useDateFilterOperators,
  useNumberFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
import { useFormatMoney } from "@/hooks/useFormatMoney";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { useRouter } from "@/i18n/navigation";

import { Add, Delete, Edit, Scale } from "@mui/icons-material";
import {
  Button,
  DialogContentText,
  IconButton,
  Stack,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
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
  RecipeListResponse,
  RecipeSortField,
} from "@/types/inventory";
import type { Organization } from "@/types/organizations";

import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";
import { getHref } from "@/utils/href";
import { localize } from "@/utils/locale";

const ActionsStack = styled(Stack)(({ theme }) => ({
  height: "100%",
  alignItems: "center",
  gap: theme.spacing(1),
}));

const ToolbarStack = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  alignItems: "center",
  gap: theme.spacing(2),
}));

interface RecipesProps {
  canCreate?: boolean;
  canDelete?: boolean;
  canViewAuditLog?: boolean;
  canViewPurchasing?: boolean;
  canWrite?: boolean;
  filterField?: RecipeFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  loading?: boolean;
  organization?: Organization;
  page?: number;
  pageSize?: number;
  quickFilterValue?: string;
  rowCount?: number;
  rows?: Recipe[];
  sortBy?: RecipeSortField;
  sortDirection?: SortDirection;
}

const Recipes = ({
  canCreate = false,
  canDelete = false,
  canViewAuditLog = false,
  canViewPurchasing = false,
  canWrite = false,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  loading = false,
  organization,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount = 0,
  rows: initialRows = [],
  sortBy,
  sortDirection,
}: RecipesProps) => {
  const currency = organization?.currency ?? "";
  const organizationSlug = organization?.slug ?? "";

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

  const locale = useLocale();

  const router = useRouter();

  const apiRef = useGridApiRef();

  const tInventory = useTranslations("inventory");

  const updateQuery = useUpdateQuery();

  const {
    data: { data: rows, total: rowCount } = {
      data: initialRows,
      total: initialRowCount,
    },
    mutate,
    isValidating,
  } = useSWR(
    !loading && [
      `/api/organizations/${organizationSlug}/recipes`,
      filterModel.items[0]?.field,
      filterModel.items[0]?.operator,
      filterModel.items[0]?.value,
      filterModel.quickFilterValues,
      paginationModel.page,
      paginationModel.pageSize,
      sortModel,
    ],
    async () => {
      const params = getDataGridSearchParams(
        paginationModel,
        filterModel,
        sortModel,
      );

      params.set("hasMenuItem", "false");

      return fetcher<RecipeListResponse>(
        `/api/organizations/${organizationSlug}/recipes?${params}`,
      );
    },
    {
      fallbackData: { data: initialRows, total: initialRowCount },
      keepPreviousData: true,
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

  const handleViewRecipeIngredients = useCallback(
    ({ id }: Recipe) =>
      router.push(
        getHref(`/inventory/recipes/${id}`, {
          organization: organizationSlug,
          ...DEFAULT_PAGINATION_QUERY,
        }),
      ),
    [organizationSlug, router],
  );

  const handleCreateRecipe = useCallback(() => {
    setDialog({
      content: (
        <RecipeDialog
          mutate={mutate}
          organizationSlug={organizationSlug}
          recipe={null}
        />
      ),
      formId: "recipe-form",
      open: true,
      title: tInventory("recipes.actions.createRecipe.title"),
    });
  }, [mutate, organizationSlug, setDialog, tInventory]);

  const handleUpdateRecipe = useCallback(
    (recipe: Recipe) => {
      setDialog({
        content: <RecipeDialog mutate={mutate} recipe={recipe} />,
        formId: "recipe-form",
        open: true,
        title: tInventory("recipes.actions.editRecipe.title"),
      });
    },
    [mutate, setDialog, tInventory],
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
          } catch (error) {
            enqueueSnackbar(getErrorMessage(error), { variant: "error" });
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
        disableExport: true,
        field: "actions",
        filterable: false,
        headerName: tInventory("recipes.actions.label"),
        renderCell: ({ row }: GridRenderCellParams<Recipe>) => (
          <ActionsStack direction="row">
            <Tooltip
              title={tInventory("recipes.actions.viewRecipeIngredients.title")}
            >
              <IconButton
                onClick={() => handleViewRecipeIngredients(row)}
                size="small"
              >
                <Scale fontSize="small" />
              </IconButton>
            </Tooltip>
            {canWrite && (
              <Tooltip title={tInventory("recipes.actions.editRecipe.title")}>
                <IconButton
                  onClick={() => handleUpdateRecipe(row)}
                  size="small"
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canViewAuditLog && <AuditLogButton resourceId={row.id} />}
            {canDelete && (
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
          </ActionsStack>
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
        field: "recipeYield",
        filterOperators: numberFilterOperators,
        headerName: tInventory("recipes.recipeYield.label"),
        valueFormatter: (value: number) =>
          `${format.number(value)} ${tInventory("recipes.recipeYield.unit")}`,
      },
      {
        field: "recipeYieldQuantity",
        filterable: false,
        headerName: tInventory("recipes.recipeYieldQuantity.label"),
        renderCell: renderEmptyableCell,
        sortable: false,
        valueGetter: (_value: unknown, row: Recipe) =>
          row.recipeYieldQuantity && row.recipeYieldUnitCode
            ? `${format.number(Number(row.recipeYieldQuantity))} ${tInventory(`units.${row.recipeYieldUnitCode}`)}`
            : "",
      },
      ...(canViewPurchasing
        ? [
            {
              field: "cost",
              filterable: false,
              headerName: tInventory("recipes.cost.label"),
              sortable: false,
              valueFormatter: (value: Recipe["cost"]) =>
                value == null
                  ? tInventory("recipes.cost.unavailable")
                  : formatMoney(value, currency, { maximumFractionDigits: 2 }),
            },
          ]
        : []),
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
      canDelete,
      canViewAuditLog,
      canViewPurchasing,
      canWrite,
      currency,
      dateFilterOperators,
      format,
      formatMoney,
      handleDeleteRecipe,
      handleUpdateRecipe,
      handleViewRecipeIngredients,
      locale,
      numberFilterOperators,
      stringFilterOperators,
      tInventory,
    ],
  );

  return (
    <>
      {canCreate && (
        <ToolbarStack direction="row">
          <Button
            onClick={handleCreateRecipe}
            size="small"
            startIcon={<Add />}
            variant="contained"
          >
            {tInventory("recipes.actions.createRecipe.title")}
          </Button>
        </ToolbarStack>
      )}
      <DataGrid
        {...DATA_GRID_PROPS}
        apiRef={apiRef}
        columns={columns}
        filterMode="server"
        filterModel={filterModel}
        loading={loading || isValidating}
        onFilterModelChange={handleFilterModelChange}
        onPaginationModelChange={handlePaginationModelChange}
        onSortModelChange={handleSortModelChange}
        pageSizeOptions={getPageSizeOptions(paginationModel.pageSize)}
        paginationMode="server"
        paginationModel={paginationModel}
        rowCount={rowCount}
        rows={rows}
        sortingMode="server"
        sortModel={sortModel}
      />
    </>
  );
};

export default Recipes;
