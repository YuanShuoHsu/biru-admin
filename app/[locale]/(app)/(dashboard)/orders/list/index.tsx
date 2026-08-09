"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import { STATUS_COLORS } from "@/constants/orders";
import { getPageSizeOptions } from "@/constants/pagination";

import {
  useDateFilterOperators,
  useEnumFilterOperators,
  useNumberFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";

import { usePathname, useRouter } from "@/i18n/navigation";

import { useDialogStore } from "@/providers/dialog-store-provider";

import {
  Cancel,
  Edit,
  ReceiptLong,
  Redo,
  type SvgIconComponent,
  Undo,
} from "@mui/icons-material";
import {
  Chip,
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

import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type {
  AdminOrderResponse,
  OrderFilterField,
  OrderSortField,
  OrderStatus,
  OrderTransition,
} from "@/types/orders";

import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { getOrderEnumOptions } from "@/utils/enumOptions";
import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

import OrderDetailDialog from "../OrderDetailDialog";
import UpdateOrderCustomerDialogContent, {
  UPDATE_ORDER_CUSTOMER_FORM_ID,
} from "../UpdateOrderCustomerDialogContent";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

const StyledIconButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== "visible",
})<{ visible: boolean }>(({ visible }) => ({
  visibility: visible ? "visible" : "hidden",
}));

const DIRECTION_ICONS: Record<OrderTransition["direction"], SvgIconComponent> =
  {
    advance: Redo,
    cancel: Cancel,
    revert: Undo,
  };

const TRANSITION_SLOTS: OrderTransition["direction"][][] = [
  ["revert", "cancel"],
  ["advance"],
];

const getTransitionAppearance = (transition?: OrderTransition) =>
  transition
    ? {
        color:
          transition.direction === "cancel"
            ? STATUS_COLORS.OrderProblem
            : STATUS_COLORS[transition.toStatus],
        Icon: DIRECTION_ICONS[transition.direction],
      }
    : { color: undefined, Icon: Undo };

interface OrdersProps {
  filterField?: OrderFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  orders: AdminOrderResponse[];
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

  const locale = useLocale();

  const pathname = usePathname();

  const router = useRouter();

  const searchParams = useSearchParams();

  const tOrder = useTranslations("order");
  const tOrders = useTranslations("orders");

  const enumOptions = useMemo(
    () => getOrderEnumOptions(tOrder, tOrders),
    [tOrder, tOrders],
  );

  const {
    data: { data: orders, total: rowCount } = {
      data: initialOrders,
      total: initialRowCount,
    },
    isValidating: loading,
    mutate,
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
    async () =>
      fetcher<{ data: AdminOrderResponse[]; total: number }>(
        `/api/organizations/${organizationSlug}/orders?${getDataGridSearchParams(
          paginationModel,
          filterModel,
          sortModel,
          enumOptions,
        )}`,
      ),
    {
      fallbackData: { data: initialOrders, total: initialRowCount },
      onSuccess: () => {
        setTimeout(() => {
          apiRef.current?.autosizeColumns(autosizeOptions);
        }, 0);
      },
    },
  );

  const stringFilterOperators = useStringFilterOperators();
  const enumFilterOperators = useEnumFilterOperators();
  const dateFilterOperators = useDateFilterOperators();
  const numberFilterOperators = useNumberFilterOperators();

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

  const handleViewOrder = useCallback(
    (order: AdminOrderResponse) => {
      setDialog({
        content: <OrderDetailDialog order={order} />,
        open: true,
        title: tOrders("actions.viewOrder.title"),
      });
    },
    [setDialog, tOrders],
  );

  const handleUpdateCustomer = useCallback(
    (order: AdminOrderResponse) => {
      setDialog({
        content: (
          <UpdateOrderCustomerDialogContent
            mutate={mutate}
            order={order}
            organizationSlug={organizationSlug}
          />
        ),
        formId: UPDATE_ORDER_CUSTOMER_FORM_ID,
        open: true,
        title: tOrders("actions.updateCustomer.title"),
      });
    },
    [mutate, organizationSlug, setDialog, tOrders],
  );

  const handleStatusAction = useCallback(
    async (order: AdminOrderResponse, toStatus: OrderStatus) => {
      try {
        const { orderStatus } = await fetcher<AdminOrderResponse>(
          `/api/organizations/${organizationSlug}/orders/${order.id}/transitions/${toStatus}`,
          { method: "PATCH" },
        );

        enqueueSnackbar(
          tOrders("actions.success", {
            orderNumber: order.orderNumber,
            status: tOrders(`status.${orderStatus}`),
          }),
          { variant: "success" },
        );

        mutate();
      } catch (error) {
        enqueueSnackbar(getErrorMessage(error), { variant: "error" });
      }
    },
    [mutate, organizationSlug, tOrders],
  );

  const handleConfirmStatusAction = useCallback(
    (order: AdminOrderResponse, { direction, toStatus }: OrderTransition) => {
      const status = tOrders(`status.${toStatus}`);

      setDialog({
        content: (
          <DialogContentText>
            {tOrders.rich(
              // 取消是規則表裡唯一沒有回頭路的轉移，文案要比其他方向重
              direction === "cancel"
                ? "actions.confirm.cancel"
                : "actions.confirm.default",
              {
                bold: (chunks) => <strong>{chunks}</strong>,
                orderNumber: order.orderNumber,
                status,
              },
            )}
          </DialogContentText>
        ),
        onConfirm: () => handleStatusAction(order, toStatus),
        open: true,
        title: tOrders(`actions.${direction}`, { status }),
      });
    },
    [handleStatusAction, setDialog, tOrders],
  );

  const hasTransitions = useMemo(
    () =>
      orders.some(({ availableTransitions }) => availableTransitions.length),
    [orders],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        disableColumnMenu: true,
        field: "actions",
        filterable: false,
        headerName: tOrders("actions.label"),
        renderCell: ({ row }: GridRenderCellParams<AdminOrderResponse>) => (
          <Stack height="100%" direction="row" alignItems="center" gap={0.5}>
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
            <Tooltip title={tOrders("actions.updateCustomer.title")}>
              <IconButton
                onClick={(event) => {
                  event.stopPropagation();

                  handleUpdateCustomer(row);
                }}
                size="small"
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
            {hasTransitions &&
              TRANSITION_SLOTS.map((directions) => {
                const transition = row.availableTransitions.find(
                  ({ direction }) => directions.includes(direction),
                );
                const { color, Icon } = getTransitionAppearance(transition);

                return (
                  <Tooltip
                    key={directions[0]}
                    title={
                      transition
                        ? tOrders(`actions.${transition.direction}`, {
                            status: tOrders(`status.${transition.toStatus}`),
                          })
                        : ""
                    }
                  >
                    <StyledIconButton
                      color={color}
                      onClick={(event) => {
                        event.stopPropagation();

                        if (transition)
                          handleConfirmStatusAction(row, transition);
                      }}
                      size="small"
                      visible={!!transition}
                    >
                      <Icon fontSize="small" />
                    </StyledIconButton>
                  </Tooltip>
                );
              })}
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
        field: "orderStatus",
        filterOperators: enumFilterOperators,
        headerName: tOrders("orderStatus"),
        renderCell: ({ row }: GridRenderCellParams<AdminOrderResponse>) => (
          <Chip
            color={STATUS_COLORS[row.orderStatus]}
            label={tOrders(`status.${row.orderStatus}`)}
            size="small"
            variant="outlined"
          />
        ),
        type: "singleSelect",
        valueOptions: enumOptions.orderStatus,
      },
      {
        field: "customerName",
        filterOperators: stringFilterOperators,
        headerName: tOrders("customerName"),
        valueGetter: (_value: unknown, row: AdminOrderResponse) =>
          row.customer.name,
      },
      {
        field: "mode",
        filterOperators: enumFilterOperators,
        headerName: tOrders("mode"),
        type: "singleSelect",
        valueOptions: enumOptions.mode,
      },
      {
        field: "tableNumber",
        filterOperators: numberFilterOperators,
        headerName: tOrders("tableNumber"),
      },
      {
        field: "total",
        filterOperators: numberFilterOperators,
        headerName: tOrders("total"),
        valueGetter: (_value: unknown, row: AdminOrderResponse) =>
          `${row.items[0]?.priceCurrency || ""} ${Number(row.total).toLocaleString(locale)}`.trim(),
      },
      {
        field: "paymentMethod",
        filterOperators: enumFilterOperators,
        headerName: tOrders("paymentMethod"),
        type: "singleSelect",
        valueOptions: enumOptions.paymentMethod,
      },
      {
        field: "paymentDate",
        filterOperators: dateFilterOperators,
        headerName: tOrders("paymentDate"),
        valueFormatter: (value: string | null) =>
          value ? format.dateTime(new Date(value), "short") : "",
      },
      {
        field: "confirmationNumber",
        filterOperators: stringFilterOperators,
        headerName: tOrders("confirmationNumber"),
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
      enumOptions,
      format,
      handleConfirmStatusAction,
      handleUpdateCustomer,
      handleViewOrder,
      hasTransitions,
      locale,
      numberFilterOperators,
      stringFilterOperators,
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
      pageSizeOptions={getPageSizeOptions(paginationModel.pageSize)}
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
