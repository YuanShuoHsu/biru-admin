"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import OrderDetailDialog from "./OrderDetailDialog";

import DateFilterInputValue from "@/components/DateFilterInputValue";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  DATE_FILTER_OPERATORS,
  ENUM_FILTER_OPERATORS,
  NO_VALUE_FILTER_OPERATORS,
  STRING_FILTER_OPERATORS,
} from "@/constants/dataGrid";

import { usePathname, useRouter } from "@/i18n/navigation";

import { ReceiptLong } from "@mui/icons-material";
import { Chip, IconButton, Stack, Tooltip } from "@mui/material";
import type {
  GridColDef,
  GridFilterModel,
  GridFilterOperator,
  GridPaginationModel,
  GridRenderCellParams,
  GridSortModel,
} from "@mui/x-data-grid";
import {
  GridFilterInputMultipleSingleSelect,
  GridFilterInputMultipleValue,
  GridFilterInputSingleSelect,
  GridFilterInputValue,
  useGridApiRef,
} from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import {
  orderResponseDtoModeValues,
  orderResponseDtoOrderStatusValues,
  orderResponseDtoPaymentMethodValues,
} from "@/types/api";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type {
  OrderFilterField,
  OrderResponse,
  OrderSortField,
  OrderStatus,
} from "@/types/orders";

import { fetcher } from "@/utils/fetcher";
import { getOrderTotalAmount } from "@/utils/orders";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

const STATUS_COLORS: Record<
  OrderStatus,
  "default" | "error" | "info" | "success" | "warning"
> = {
  OrderCancelled: "default",
  OrderDelivered: "success",
  OrderPaymentDue: "warning",
  OrderPickupAvailable: "success",
  OrderProcessing: "info",
  OrderProblem: "error",
};

interface OrdersProps {
  filterField?: OrderFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  orders: OrderResponse[];
  organizationSlug: string;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  rowCount: number;
  sortBy?: OrderSortField;
  sortDirection?: SortDirection;
}

const Orders = ({
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  orders: initialOrders,
  organizationSlug,
  page,
  pageSize,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount,
  sortBy,
  sortDirection,
}: OrdersProps) => {
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

  const format = useFormatter();

  const apiRef = useGridApiRef();

  const pathname = usePathname();

  const router = useRouter();

  const searchParams = useSearchParams();

  const {
    data: { data: orders, total: rowCount } = {
      data: initialOrders,
      total: initialRowCount,
    },
    isValidating: loading,
  } = useSWR(
    [
      `/api/organizations/${organizationSlug}/orders`,
      filterModel.items[0]?.field,
      filterModel.items[0]?.operator,
      filterModel.items[0]?.value,
      filterModel.quickFilterValues,
      paginationModel.page,
      paginationModel.pageSize,
      sortModel,
    ],
    async () => {
      const filterItem = filterModel.items[0];
      const quickFilterValue = (filterModel.quickFilterValues || [])
        .join(" ")
        .trim();
      const isNoValueOperator =
        filterItem?.operator &&
        NO_VALUE_FILTER_OPERATORS.includes(filterItem.operator);
      const filterValueString = Array.isArray(filterItem?.value)
        ? filterItem.value.join(",")
        : filterItem?.value;
      const hasFilterValue = Array.isArray(filterItem?.value)
        ? filterItem.value.length > 0
        : !!filterItem?.value;

      return fetcher<{ data: OrderResponse[]; total: number }>(
        `/api/organizations/${organizationSlug}/orders?${new URLSearchParams({
          limit: String(paginationModel.pageSize),
          offset: String(paginationModel.page * paginationModel.pageSize),
          ...(filterItem?.field &&
            filterItem?.operator &&
            (hasFilterValue || isNoValueOperator) && {
              filterField: filterItem.field,
              filterOperator: filterItem.operator,
              ...(filterValueString && { filterValue: filterValueString }),
            }),
          ...(quickFilterValue && { quickFilterValue }),
          ...(sortModel[0]?.field && { sortBy: sortModel[0].field }),
          ...(sortModel[0]?.sort && { sortDirection: sortModel[0].sort }),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        })}`,
      );
    },
    {
      fallbackData: { data: initialOrders, total: initialRowCount },
      onSuccess: () => {
        setTimeout(() => {
          apiRef.current?.autosizeColumns(autosizeOptions);
        }, 0);
      },
    },
  );

  const locale = useLocale();
  const tOrder = useTranslations("order");
  const tOrders = useTranslations("orders");
  const tToolbar = useTranslations("dataGrid.toolbar");

  const handlePaginationModelChange = useCallback(
    (newModel: GridPaginationModel) => {
      setPaginationModel(newModel);

      const params = new URLSearchParams({
        ...Object.fromEntries(searchParams),
        page: String(newModel.page + 1),
        pageSize: String(newModel.pageSize),
      });
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const handleSortModelChange = useCallback(
    (newModel: GridSortModel) => {
      setSortModel(newModel);
      setPaginationModel((prev) => ({ ...prev, page: 0 }));

      const sortItem = newModel[0];
      const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        sortBy: _sortBy,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        sortDirection: _sortDirection,
        ...rest
      } = Object.fromEntries(searchParams);
      const params = new URLSearchParams({
        ...rest,
        page: "1",
        ...(sortItem?.field && { sortBy: sortItem.field }),
        ...(sortItem?.sort && { sortDirection: sortItem.sort }),
      });

      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const stringFilterOperators = useMemo<GridFilterOperator[]>(
    () =>
      STRING_FILTER_OPERATORS.map((value) => ({
        getApplyFilterFn: () => null,
        ...(NO_VALUE_FILTER_OPERATORS.includes(value)
          ? { InputComponent: undefined }
          : value === "isAnyOf"
            ? { InputComponent: GridFilterInputMultipleValue }
            : { InputComponent: GridFilterInputValue }),
        label: tToolbar(`filter.operator.${value}`),
        value,
      })),
    [tToolbar],
  );

  const enumFilterOperators = useMemo<GridFilterOperator[]>(
    () =>
      ENUM_FILTER_OPERATORS.map((value) => ({
        getApplyFilterFn: () => null,
        InputComponent:
          value === "isAnyOf"
            ? GridFilterInputMultipleSingleSelect
            : GridFilterInputSingleSelect,
        label: tToolbar(`filter.operator.${value}`),
        value,
      })),
    [tToolbar],
  );

  const dateFilterOperators = useMemo<GridFilterOperator[]>(
    () =>
      DATE_FILTER_OPERATORS.map((value) => ({
        getApplyFilterFn: () => null,
        ...(NO_VALUE_FILTER_OPERATORS.includes(value)
          ? { InputComponent: undefined }
          : { InputComponent: DateFilterInputValue }),
        label: tToolbar(`filter.operator.${value}`),
        value,
      })),
    [tToolbar],
  );

  const handleFilterModelChange = useCallback(
    (newModel: GridFilterModel) => {
      setFilterModel(newModel);
      setPaginationModel((prev) => ({ ...prev, page: 0 }));

      const filterItem = newModel.items[0];
      const newQuickFilterValue = (newModel.quickFilterValues || [])
        .join(" ")
        .trim();
      const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        filterField: _filterField,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        filterOperator: _filterOperator,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        filterValue: _filterValue,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        quickFilterValue: _quickFilterValue,
        ...rest
      } = Object.fromEntries(searchParams);

      const filterValueString = Array.isArray(filterItem?.value)
        ? filterItem.value.join(",")
        : filterItem?.value;
      const hasFilterValue = Array.isArray(filterItem?.value)
        ? filterItem.value.length > 0
        : !!filterItem?.value;
      const isNoValueOperator = filterItem?.operator
        ? NO_VALUE_FILTER_OPERATORS.includes(filterItem.operator)
        : false;

      const params = new URLSearchParams({
        ...rest,
        page: "1",
        ...(filterItem?.field &&
          filterItem?.operator &&
          (hasFilterValue || isNoValueOperator) && {
            filterField: filterItem.field,
            filterOperator: filterItem.operator,
            ...(filterValueString && { filterValue: filterValueString }),
          }),
        ...(newQuickFilterValue && { quickFilterValue: newQuickFilterValue }),
      });
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const handleViewOrder = useCallback(
    (order: OrderResponse) => {
      setDialog({
        content: <OrderDetailDialog order={order} />,
        open: true,
        showCancel: false,
        title: tOrders("actions.viewOrder.title"),
      });
    },
    [setDialog, tOrders],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        disableColumnMenu: true,
        field: "actions",
        filterable: false,
        headerName: tOrders("actions.label"),
        renderCell: ({ row }: GridRenderCellParams<OrderResponse>) => (
          <Stack height="100%" direction="row" alignItems="center" gap={1}>
            <Tooltip title={tOrders("actions.viewOrder.title")}>
              <IconButton
                onClick={(event) => {
                  event.stopPropagation();

                  handleViewOrder(row);
                }}
                size="small"
              >
                <ReceiptLong fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
        resizable: false,
        sortable: false,
      },
      {
        field: "orderNumber",
        filterOperators: stringFilterOperators,
        headerName: tOrders("orderNumber"),
      },
      {
        field: "customerName",
        filterOperators: stringFilterOperators,
        headerName: tOrders("customerName"),
        valueGetter: (_value: unknown, row: OrderResponse) =>
          row.customer.name,
      },
      {
        field: "total",
        filterable: false,
        headerName: tOrders("total"),
        sortable: false,
        valueGetter: (_value: unknown, row: OrderResponse) =>
          `${row.items[0]?.priceCurrency || ""} ${getOrderTotalAmount(row).toLocaleString(locale)}`,
      },
      {
        field: "orderStatus",
        filterOperators: enumFilterOperators,
        headerName: tOrders("orderStatus"),
        renderCell: ({ row }: GridRenderCellParams<OrderResponse>) => (
          <Chip
            color={STATUS_COLORS[row.orderStatus]}
            label={tOrders(`status.${row.orderStatus}`)}
            size="small"
            variant="outlined"
          />
        ),
        type: "singleSelect",
        valueOptions: orderResponseDtoOrderStatusValues.map((value) => ({
          label: tOrders(`status.${value}`),
          value,
        })),
      },
      {
        field: "mode",
        filterOperators: enumFilterOperators,
        headerName: tOrders("mode"),
        type: "singleSelect",
        valueOptions: orderResponseDtoModeValues.map((value) => ({
          label: tOrder(`mode.${value}.label`),
          value,
        })),
      },
      {
        field: "paymentMethod",
        filterOperators: enumFilterOperators,
        headerName: tOrders("paymentMethod"),
        type: "singleSelect",
        valueOptions: orderResponseDtoPaymentMethodValues.map((value) => ({
          label: tOrder(`checkout.payment.${value}`),
          value,
        })),
      },
      {
        field: "confirmationNumber",
        filterOperators: stringFilterOperators,
        headerName: tOrders("confirmationNumber"),
      },
      {
        field: "paymentDate",
        filterOperators: dateFilterOperators,
        headerName: tOrders("paymentDate"),
        valueFormatter: (value: string | null) =>
          value ? format.dateTime(new Date(value), "short") : "",
      },
      {
        field: "createdAt",
        filterOperators: dateFilterOperators,
        headerName: tOrders("createdAt"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "short"),
      },
    ],
    [
      dateFilterOperators,
      enumFilterOperators,
      format,
      handleViewOrder,
      locale,
      stringFilterOperators,
      tOrder,
      tOrders,
    ],
  );

  return (
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
      paginationMode="server"
      paginationModel={paginationModel}
      rowCount={rowCount}
      rows={orders}
      sortingMode="server"
      sortModel={sortModel}
    />
  );
};

export default Orders;
