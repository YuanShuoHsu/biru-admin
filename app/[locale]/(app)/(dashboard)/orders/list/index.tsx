"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import { MODE_COLORS } from "@/constants/orderMode";
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
import { useFormatMoney } from "@/hooks/useFormatMoney";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { useDialogStore } from "@/providers/dialog-store-provider";

import {
  Block,
  Cancel,
  CurrencyExchange,
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
import type { Organization } from "@/types/organizations";
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
import { printDocument } from "@/utils/print";

import AuditLogButton from "@/components/AuditLogButton";
import EmptyCell, { renderEmptyableCell } from "@/components/EmptyCell";

import OrderDetailDialog from "../OrderDetailDialog";
import RefundOrderDialogContent, {
  REFUND_ORDER_FORM_ID,
} from "../RefundOrderDialogContent";
import ResetInvoicePrintDialogContent, {
  RESET_INVOICE_PRINT_FORM_ID,
} from "../ResetInvoicePrintDialogContent";
import UpdateOrderCustomerDialogContent, {
  UPDATE_ORDER_CUSTOMER_FORM_ID,
} from "../UpdateOrderCustomerDialogContent";
import VoidInvoiceDialogContent, {
  VOID_INVOICE_FORM_ID,
} from "../VoidInvoiceDialogContent";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

const StatusText = styled("span", {
  shouldForwardProp: (prop) => prop !== "as" && prop !== "status",
})<{ status: OrderStatus }>(({ status, theme }) => {
  const key = STATUS_TEXT_COLORS[status];

  return {
    color:
      key === "text"
        ? theme.vars.palette.text.primary
        : theme.vars.palette[key].main,
  };
});

const StyledStack = styled(Stack)(({ theme }) => ({
  height: "100%",
  alignItems: "center",
  gap: theme.spacing(0.5),
}));

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

const canPrintInvoice = ({ invoice }: AdminOrderResponse) =>
  invoice?.status === "issued" &&
  !invoice.carrierType &&
  invoice.type !== "donate";

const canResetInvoicePrint = (order: AdminOrderResponse) =>
  canPrintInvoice(order) && !!order.invoice?.printedAt;

const canVoidInvoice = ({ invoice }: AdminOrderResponse) =>
  invoice?.status === "issued";

interface OrdersProps {
  canViewAuditLog: boolean;
  filterField?: OrderFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  organization: Organization;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  rowCount: number;
  rows: AdminOrderResponse[];
  sortBy?: OrderSortField;
  sortDirection?: SortDirection;
}

const Orders = ({
  canViewAuditLog,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  organization: { slug: organizationSlug },
  page,
  pageSize,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount,
  rows: initialRows,
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

  const formatMoney = useFormatMoney();

  const apiRef = useGridApiRef();

  const tOrder = useTranslations("order");
  const tOrders = useTranslations("orders");

  const enumOptions = useMemo(
    () => getOrderEnumOptions(tOrder, tOrders),
    [tOrder, tOrders],
  );

  const {
    data: { data: rows, total: rowCount } = {
      data: initialRows,
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
      fallbackData: { data: initialRows, total: initialRowCount },
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

  const updateQuery = useUpdateQuery();

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

  const handleViewOrder = useCallback(
    (order: AdminOrderResponse) => {
      setDialog({
        content: (
          <OrderDetailDialog
            order={order}
            organizationSlug={organizationSlug}
          />
        ),
        open: true,
        title: tOrders("actions.viewOrder.title"),
      });
    },
    [organizationSlug, setDialog, tOrders],
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
                  <StatusText as="strong" status={toStatus}>
                    {chunks}
                  </StatusText>
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
            <StatusText status={toStatus}>{chunks}</StatusText>
          ),
        }),
      });
    },
    [handleStatusAction, setDialog, tOrders],
  );

  const handleRefund = useCallback(
    (order: AdminOrderResponse) => {
      setDialog({
        content: (
          <RefundOrderDialogContent
            mutate={mutate}
            order={order}
            organizationSlug={organizationSlug}
          />
        ),
        formId: REFUND_ORDER_FORM_ID,
        open: true,
        title: tOrders("actions.refund.title"),
      });
    },
    [mutate, organizationSlug, setDialog, tOrders],
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
        const { printHtml } = await fetcher<OrderInvoicePrint>(
          `/api/organizations/${organizationSlug}/orders/${order.id}/invoice/print`,
          { method: "POST" },
        );

        printDocument(printHtml);
      } catch (error) {
        enqueueSnackbar(getErrorMessage(error), { variant: "error" });
      } finally {
        mutate();
      }
    },
    [mutate, organizationSlug],
  );

  const handleConfirmPrintInvoice = useCallback(
    (order: AdminOrderResponse) => {
      if (!order.invoice?.printedAt) {
        void handlePrintInvoice(order);

        return;
      }

      setDialog({
        content: (
          <DialogContentText>
            {tOrders.rich("actions.printInvoice.reprintConfirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              orderNumber: order.orderNumber,
            })}
          </DialogContentText>
        ),
        onConfirm: () => handlePrintInvoice(order),
        open: true,
        title: tOrders("actions.printInvoice.reprintTitle"),
      });
    },
    [handlePrintInvoice, setDialog, tOrders],
  );

  const handleConfirmVoidInvoice = useCallback(
    (order: AdminOrderResponse) => {
      setDialog({
        content: (
          <VoidInvoiceDialogContent
            mutate={mutate}
            order={order}
            organizationSlug={organizationSlug}
          />
        ),
        formId: VOID_INVOICE_FORM_ID,
        open: true,
        title: tOrders("actions.voidInvoice.title"),
      });
    },
    [mutate, organizationSlug, setDialog, tOrders],
  );

  const handleConfirmResetInvoicePrint = useCallback(
    (order: AdminOrderResponse) => {
      setDialog({
        content: (
          <ResetInvoicePrintDialogContent
            mutate={mutate}
            order={order}
            organizationSlug={organizationSlug}
          />
        ),
        formId: RESET_INVOICE_PRINT_FORM_ID,
        open: true,
        title: tOrders("actions.resetInvoicePrint.title"),
      });
    },
    [mutate, organizationSlug, setDialog, tOrders],
  );

  const hasPendingInvoice = useMemo(() => rows.some(canIssueInvoice), [rows]);

  const hasPrintableInvoice = useMemo(() => rows.some(canPrintInvoice), [rows]);

  const hasResettableInvoicePrint = useMemo(
    () => rows.some(canResetInvoicePrint),
    [rows],
  );

  const hasVoidableInvoice = useMemo(() => rows.some(canVoidInvoice), [rows]);

  const hasRefundable = useMemo(
    () => rows.some(({ refundable }) => refundable),
    [rows],
  );

  const hasTransitions = useMemo(
    () => rows.some(({ availableTransitions }) => availableTransitions.length),
    [rows],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        disableColumnMenu: true,
        disableExport: true,
        field: "actions",
        filterable: false,
        headerName: tOrders("actions.label"),
        renderCell: ({ row }: GridRenderCellParams<AdminOrderResponse>) => (
          <StyledStack direction="row">
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

                    if (canPrintInvoice(row)) handleConfirmPrintInvoice(row);
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
            {hasVoidableInvoice && (
              <Tooltip title={tOrders("actions.voidInvoice.title")}>
                <StyledIconButton
                  onClick={(event) => {
                    event.stopPropagation();

                    if (canVoidInvoice(row)) handleConfirmVoidInvoice(row);
                  }}
                  size="small"
                  visible={canVoidInvoice(row)}
                >
                  <Block fontSize="small" />
                </StyledIconButton>
              </Tooltip>
            )}
            {hasRefundable && (
              <Tooltip title={tOrders("actions.refund.title")}>
                <StyledIconButton
                  onClick={(event) => {
                    event.stopPropagation();

                    if (row.refundable) handleRefund(row);
                  }}
                  size="small"
                  visible={row.refundable}
                >
                  <CurrencyExchange fontSize="small" />
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
          </StyledStack>
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
        renderCell: renderEmptyableCell,
        valueGetter: (_value: unknown, row: AdminOrderResponse) =>
          row.customer.name,
      },
      {
        field: "customerTelephone",
        filterOperators: stringFilterOperators,
        headerName: tOrders("customerTelephone"),
        renderCell: renderEmptyableCell,
        valueGetter: (_value: unknown, row: AdminOrderResponse) =>
          row.customer.telephone || "",
      },
      {
        field: "customerEmail",
        filterOperators: stringFilterOperators,
        headerName: tOrders("customerEmail"),
        renderCell: renderEmptyableCell,
        valueGetter: (_value: unknown, row: AdminOrderResponse) =>
          row.customer.email || "",
      },
      {
        field: "mode",
        filterOperators: enumFilterOperators,
        headerName: tOrders("mode"),
        renderCell: ({
          row: { mode },
        }: GridRenderCellParams<AdminOrderResponse>) => (
          <Chip
            color={MODE_COLORS[mode]}
            label={tOrder(`mode.${mode}.label`)}
            size="small"
            variant="outlined"
          />
        ),
        type: "singleSelect",
        valueOptions: enumOptions.mode,
      },
      {
        field: "tableNumber",
        filterOperators: numberFilterOperators,
        headerName: tOrders("tableNumber"),
        renderCell: renderEmptyableCell,
      },
      {
        field: "total",
        filterOperators: numberFilterOperators,
        headerName: tOrders("total"),
        valueGetter: (_value: unknown, row: AdminOrderResponse) =>
          formatMoney(Number(row.total), row.items[0]?.priceCurrency),
      },
      {
        field: "paymentMethod",
        filterOperators: enumFilterOperators,
        headerName: tOrders("paymentMethod"),
        renderCell: renderEmptyableCell,
        type: "singleSelect",
        valueOptions: enumOptions.paymentMethod,
      },
      {
        field: "paymentDate",
        filterOperators: dateFilterOperators,
        headerName: tOrders("paymentDate"),
        renderCell: renderEmptyableCell,
        valueFormatter: (value: string | null) =>
          value ? format.dateTime(new Date(value), "short") : "",
      },
      {
        field: "pickupTime",
        filterOperators: dateFilterOperators,
        headerName: tOrders("pickupTime"),
        renderCell: renderEmptyableCell,
        valueFormatter: (value: string | null) =>
          value ? format.dateTime(new Date(value), "short") : "",
      },
      {
        field: "invoiceType",
        filterOperators: enumFilterOperators,
        headerName: tOrders("invoiceType"),
        renderCell: renderEmptyableCell,
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
          row.invoice ? (
            <Chip
              color={INVOICE_STATUS_COLORS[row.invoice.status]}
              label={tOrders(`invoiceStatusValue.${row.invoice.status}`)}
              size="small"
              variant="outlined"
            />
          ) : (
            <EmptyCell />
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
        renderCell: renderEmptyableCell,
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
      formatMoney,
      handleConfirmIssueInvoice,
      handleConfirmResetInvoicePrint,
      handleConfirmVoidInvoice,
      handleRefund,
      hasRefundable,
      hasVoidableInvoice,
      handleConfirmStatusAction,
      handleConfirmPrintInvoice,
      handleUpdateCustomer,
      handleViewOrder,
      hasPendingInvoice,
      hasPrintableInvoice,
      hasResettableInvoicePrint,
      hasTransitions,
      numberFilterOperators,
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
      pageSizeOptions={getPageSizeOptions(paginationModel.pageSize)}
      paginationMode="server"
      paginationModel={paginationModel}
      rowCount={rowCount}
      rows={rows}
      sortingMode="server"
      sortModel={sortModel}
      slotProps={{
        ...DATA_GRID_PROPS.slotProps,
        toolbar: {
          exportDateField: "createdAt",
        },
      }}
    />
  );
};

export default Orders;
