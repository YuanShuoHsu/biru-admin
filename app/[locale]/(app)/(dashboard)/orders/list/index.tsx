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
import {
  INVOICE_STATUS_COLORS,
  STATUS_COLORS,
  STATUS_TEXT_COLORS,
} from "@/constants/orders";
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
  Print,
  Receipt,
  ReceiptLong,
  Redo,
  RestartAlt,
  type SvgIconComponent,
  Undo,
} from "@mui/icons-material";
import {
  Box,
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
  OrderInvoice,
  OrderInvoicePrint,
  OrderSortField,
  OrderStatus,
  OrderTransition,
} from "@/types/orders";

import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { getOrderEnumOptions } from "@/utils/enumOptions";
import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

import AuditLogButton from "@/components/AuditLogButton";

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

const canIssueInvoice = ({ invoice, paymentDate }: AdminOrderResponse) =>
  !!paymentDate && invoice?.status === "pending";

// 存進載具或捐出去的發票沒有紙本，綠界也不會給列印網址
const canPrintInvoice = ({ invoice }: AdminOrderResponse) =>
  invoice?.status === "issued" &&
  !invoice.carrierType &&
  invoice.type !== "donate";

// 網址一取得就算已印，紙其實沒出來時得還原正本，否則顧客只拿得到不能對獎的補印聯
const canResetInvoicePrint = (order: AdminOrderResponse) =>
  canPrintInvoice(order) && !!order.invoice?.printedAt;

interface OrdersProps {
  canViewAuditLog: boolean;
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
  canViewAuditLog,
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
        await fetcher(
          `/api/organizations/${organizationSlug}/orders/transitions/${toStatus}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderIds: [order.id] }),
          },
        );

        enqueueSnackbar(
          tOrders("actions.updateStatus.success", {
            count: 1,
            orderNumbers: order.orderNumber,
            status: tOrders(`status.${toStatus}`),
          }),
          { variant: "success" },
        );
      } catch (error) {
        enqueueSnackbar(getErrorMessage(error), { variant: "error" });
      } finally {
        mutate();
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
              direction === "cancel"
                ? "actions.updateStatus.confirm.cancel"
                : "actions.updateStatus.confirm.default",
              {
                bold: (chunks) => <strong>{chunks}</strong>,
                count: 1,
                orderNumbers: order.orderNumber,
                status,
                statusText: (chunks) => (
                  <Box color={STATUS_TEXT_COLORS[toStatus]} component="strong">
                    {chunks}
                  </Box>
                ),
              },
            )}
          </DialogContentText>
        ),
        onConfirm: () => handleStatusAction(order, toStatus),
        open: true,
        title: tOrders.rich(`actions.updateStatus.title.${direction}`, {
          status,
          statusText: (chunks) => (
            <Box color={STATUS_TEXT_COLORS[toStatus]} component="span">
              {chunks}
            </Box>
          ),
        }),
      });
    },
    [handleStatusAction, setDialog, tOrders],
  );

  const handleIssueInvoice = useCallback(
    async (order: AdminOrderResponse) => {
      try {
        const issued = await fetcher<OrderInvoice>(
          `/api/organizations/${organizationSlug}/orders/${order.id}/invoice`,
          { method: "POST" },
        );

        enqueueSnackbar(
          tOrders("actions.issueInvoice.success", {
            invoiceNumber: issued.invoiceNumber || "",
            orderNumber: order.orderNumber,
          }),
          { variant: "success" },
        );
      } catch (error) {
        enqueueSnackbar(getErrorMessage(error), { variant: "error" });
      } finally {
        mutate();
      }
    },
    [mutate, organizationSlug, tOrders],
  );

  const handleConfirmIssueInvoice = useCallback(
    (order: AdminOrderResponse) => {
      setDialog({
        content: (
          <DialogContentText>
            {tOrders.rich("actions.issueInvoice.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              orderNumber: order.orderNumber,
            })}
          </DialogContentText>
        ),
        onConfirm: () => handleIssueInvoice(order),
        open: true,
        title: tOrders("actions.issueInvoice.title"),
      });
    },
    [handleIssueInvoice, setDialog, tOrders],
  );

  const handlePrintInvoice = useCallback(
    async (order: AdminOrderResponse) => {
      try {
        const { printUrl } = await fetcher<OrderInvoicePrint>(
          `/api/organizations/${organizationSlug}/orders/${order.id}/invoice/print`,
          { method: "POST" },
        );

        const printWindow = window.open(printUrl, "_blank");
        if (!printWindow)
          enqueueSnackbar(tOrders("actions.printInvoice.blocked"), {
            variant: "warning",
          });
      } catch (error) {
        enqueueSnackbar(getErrorMessage(error), { variant: "error" });
      } finally {
        mutate();
      }
    },
    [mutate, organizationSlug, tOrders],
  );

  const handleResetInvoicePrint = useCallback(
    async (order: AdminOrderResponse) => {
      try {
        await fetcher(
          `/api/organizations/${organizationSlug}/orders/${order.id}/invoice/print`,
          { method: "PATCH" },
        );

        enqueueSnackbar(
          tOrders("actions.resetInvoicePrint.success", {
            orderNumber: order.orderNumber,
          }),
          { variant: "success" },
        );
      } catch (error) {
        enqueueSnackbar(getErrorMessage(error), { variant: "error" });
      } finally {
        mutate();
      }
    },
    [mutate, organizationSlug, tOrders],
  );

  const handleConfirmResetInvoicePrint = useCallback(
    (order: AdminOrderResponse) => {
      setDialog({
        content: (
          <DialogContentText>
            {tOrders.rich("actions.resetInvoicePrint.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              orderNumber: order.orderNumber,
            })}
          </DialogContentText>
        ),
        onConfirm: () => handleResetInvoicePrint(order),
        open: true,
        title: tOrders("actions.resetInvoicePrint.title"),
      });
    },
    [handleResetInvoicePrint, setDialog, tOrders],
  );

  const hasPendingInvoice = useMemo(
    () => orders.some(canIssueInvoice),
    [orders],
  );

  const hasPrintableInvoice = useMemo(
    () => orders.some(canPrintInvoice),
    [orders],
  );

  const hasResettableInvoicePrint = useMemo(
    () => orders.some(canResetInvoicePrint),
    [orders],
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
            {canViewAuditLog && <AuditLogButton resourceId={row.id} />}
            {hasPendingInvoice && (
              <Tooltip title={tOrders("actions.issueInvoice.title")}>
                <StyledIconButton
                  onClick={(event) => {
                    event.stopPropagation();

                    if (canIssueInvoice(row)) handleConfirmIssueInvoice(row);
                  }}
                  size="small"
                  visible={canIssueInvoice(row)}
                >
                  <Receipt fontSize="small" />
                </StyledIconButton>
              </Tooltip>
            )}
            {hasPrintableInvoice && (
              <Tooltip
                title={tOrders(
                  row.invoice?.printedAt
                    ? "actions.printInvoice.reprintTitle"
                    : "actions.printInvoice.title",
                )}
              >
                <StyledIconButton
                  onClick={(event) => {
                    event.stopPropagation();

                    if (canPrintInvoice(row)) void handlePrintInvoice(row);
                  }}
                  size="small"
                  visible={canPrintInvoice(row)}
                >
                  <Print fontSize="small" />
                </StyledIconButton>
              </Tooltip>
            )}
            {hasResettableInvoicePrint && (
              <Tooltip title={tOrders("actions.resetInvoicePrint.title")}>
                <StyledIconButton
                  onClick={(event) => {
                    event.stopPropagation();

                    if (canResetInvoicePrint(row))
                      handleConfirmResetInvoicePrint(row);
                  }}
                  size="small"
                  visible={canResetInvoicePrint(row)}
                >
                  <RestartAlt fontSize="small" />
                </StyledIconButton>
              </Tooltip>
            )}
            {hasTransitions &&
              TRANSITION_SLOTS.map((directions) => {
                const transition = row.availableTransitions.find(
                  ({ direction }) => directions.includes(direction),
                );
                const direction = transition?.direction || directions[0];
                const Icon = DIRECTION_ICONS[direction];
                const color =
                  direction === "cancel"
                    ? "error"
                    : transition && STATUS_COLORS[transition.toStatus];

                return (
                  <Tooltip
                    key={directions[0]}
                    title={
                      transition
                        ? tOrders.markup(
                            `actions.updateStatus.title.${transition.direction}`,
                            {
                              status: tOrders(`status.${transition.toStatus}`),
                              statusText: (chunks) => chunks,
                            },
                          )
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
        field: "customerTelephone",
        filterOperators: stringFilterOperators,
        headerName: tOrders("customerTelephone"),
        valueGetter: (_value: unknown, row: AdminOrderResponse) =>
          row.customer.telephone || "",
      },
      {
        field: "customerEmail",
        filterOperators: stringFilterOperators,
        headerName: tOrders("customerEmail"),
        valueGetter: (_value: unknown, row: AdminOrderResponse) =>
          row.customer.email || "",
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
        field: "invoiceType",
        filterOperators: enumFilterOperators,
        headerName: tOrders("invoiceType"),
        type: "singleSelect",
        valueGetter: (_value: unknown, row: AdminOrderResponse) =>
          row.invoice?.type || "",
        valueOptions: enumOptions.invoiceType,
      },
      {
        field: "invoiceStatus",
        filterOperators: enumFilterOperators,
        headerName: tOrders("invoiceStatus"),
        renderCell: ({ row }: GridRenderCellParams<AdminOrderResponse>) =>
          row.invoice && (
            <Chip
              color={INVOICE_STATUS_COLORS[row.invoice.status]}
              label={tOrders(`invoiceStatusValue.${row.invoice.status}`)}
              size="small"
              variant="outlined"
            />
          ),
        type: "singleSelect",
        valueGetter: (_value: unknown, row: AdminOrderResponse) =>
          row.invoice?.status || "",
        valueOptions: enumOptions.invoiceStatus,
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
      canViewAuditLog,
      dateFilterOperators,
      enumFilterOperators,
      enumOptions,
      format,
      handleConfirmIssueInvoice,
      handleConfirmResetInvoicePrint,
      handleConfirmStatusAction,
      handlePrintInvoice,
      handleUpdateCustomer,
      handleViewOrder,
      hasPendingInvoice,
      hasPrintableInvoice,
      hasResettableInvoicePrint,
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
