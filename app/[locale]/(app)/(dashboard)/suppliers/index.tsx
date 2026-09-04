"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import SupplierDialog from "./SupplierDialog";

import AuditLogButton from "@/components/AuditLogButton";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import { getPageSizeOptions } from "@/constants/pagination";

import {
  useDateFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";

import { usePathname, useRouter } from "@/i18n/navigation";

import { Add, Delete, Edit } from "@mui/icons-material";
import {
  Button,
  DialogContentText,
  IconButton,
  Link,
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
  Supplier,
  SupplierFilterField,
  SupplierSortField,
} from "@/types/inventory";

import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { fetcher } from "@/utils/fetcher";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface SuppliersProps {
  canViewAuditLog: boolean;
  canWrite: boolean;
  filterField?: SupplierFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  organizationSlug: string;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  rowCount: number;
  sortBy?: SupplierSortField;
  sortDirection?: SortDirection;
  suppliers: Supplier[];
}

const Suppliers = ({
  canViewAuditLog,
  canWrite,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  organizationSlug,
  page,
  pageSize,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount,
  sortBy,
  sortDirection,
  suppliers: initialSuppliers,
}: SuppliersProps) => {
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
  const stringFilterOperators = useStringFilterOperators();

  const format = useFormatter();

  const apiRef = useGridApiRef();

  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tCommon = useTranslations("common");
  const tInventory = useTranslations("inventory");

  const {
    data: { data: suppliers, total: rowCount } = {
      data: initialSuppliers,
      total: initialRowCount,
    },
    mutate,
    isValidating: loading,
  } = useSWR(
    [
      `/api/organizations/${organizationSlug}/suppliers`,
      filterModel.items[0]?.field,
      filterModel.items[0]?.operator,
      filterModel.items[0]?.value,
      filterModel.quickFilterValues,
      paginationModel.page,
      paginationModel.pageSize,
      sortModel,
    ],
    async () =>
      fetcher<{ data: Supplier[]; total: number }>(
        `/api/organizations/${organizationSlug}/suppliers?${getDataGridSearchParams(paginationModel, filterModel, sortModel)}`,
      ),
    {
      fallbackData: { data: initialSuppliers, total: initialRowCount },
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

  const handleCreateSupplier = useCallback(() => {
    setDialog({
      content: (
        <SupplierDialog
          mutate={mutate}
          organizationSlug={organizationSlug}
          supplier={null}
        />
      ),
      formId: "supplier-form",
      open: true,
      title: tInventory("suppliers.actions.createSupplier.title"),
    });
  }, [mutate, organizationSlug, setDialog, tInventory]);

  const handleUpdateSupplier = useCallback(
    (supplier: Supplier) => {
      setDialog({
        content: (
          <SupplierDialog
            mutate={mutate}
            organizationSlug={organizationSlug}
            supplier={supplier}
          />
        ),
        formId: "supplier-form",
        open: true,
        title: tInventory("suppliers.actions.updateSupplier.title"),
      });
    },
    [mutate, organizationSlug, setDialog, tInventory],
  );

  const handleDeleteSupplier = useCallback(
    ({ id, name }: Supplier) => {
      setDialog({
        content: (
          <DialogContentText>
            {tInventory.rich("suppliers.actions.deleteSupplier.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              name,
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          try {
            await fetcher(`/api/suppliers/${id}`, { method: "DELETE" });

            enqueueSnackbar(
              tInventory("suppliers.actions.deleteSupplier.success"),
              { variant: "success" },
            );

            mutate();
          } catch {
            enqueueSnackbar(
              tInventory("suppliers.actions.deleteSupplier.error"),
              { variant: "error" },
            );
          }
        },
        open: true,
        title: tInventory("suppliers.actions.deleteSupplier.title"),
      });
    },
    [mutate, setDialog, tInventory],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      ...(canWrite
        ? [
            {
              disableColumnMenu: true,
              field: "actions",
              filterable: false,
              headerName: tInventory("suppliers.actions.label"),
              renderCell: ({ row }: GridRenderCellParams<Supplier>) => (
                <Stack
                  height="100%"
                  direction="row"
                  alignItems="center"
                  gap={1}
                >
                  <Tooltip
                    title={tInventory("suppliers.actions.updateSupplier.title")}
                  >
                    <IconButton
                      onClick={() => handleUpdateSupplier(row)}
                      size="small"
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {canViewAuditLog && <AuditLogButton resourceId={row.id} />}
                  <Tooltip
                    title={tInventory("suppliers.actions.deleteSupplier.title")}
                  >
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteSupplier(row)}
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
        field: "name",
        filterOperators: stringFilterOperators,
        headerName: tInventory("suppliers.name.label"),
      },
      {
        field: "telephone",
        filterOperators: stringFilterOperators,
        headerName: `${tInventory("suppliers.telephone.label")} ${tCommon("optional")}`,
      },
      {
        field: "url",
        filterOperators: stringFilterOperators,
        headerName: `${tInventory("suppliers.url.label")} ${tCommon("optional")}`,
        renderCell: ({ row: { url } }: GridRenderCellParams<Supplier>) =>
          url && (
            <Link href={url} rel="noopener" target="_blank">
              {url}
            </Link>
          ),
      },
      {
        field: "note",
        filterOperators: stringFilterOperators,
        headerName: `${tInventory("suppliers.note.label")} ${tCommon("optional")}`,
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
      handleDeleteSupplier,
      handleUpdateSupplier,
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
            onClick={handleCreateSupplier}
            size="small"
            startIcon={<Add />}
            variant="contained"
          >
            {tInventory("suppliers.actions.createSupplier.title")}
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
        rows={suppliers}
        sortingMode="server"
        sortModel={sortModel}
      />
    </>
  );
};

export default Suppliers;
