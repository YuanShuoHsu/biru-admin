"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import { MODE_COLORS } from "@/constants/orderMode";
import { INVOICE_STATUS_COLORS, STATUS_COLORS } from "@/constants/orders";
import { getPageSizeOptions } from "@/constants/pagination";

import {
  useDateFilterOperators,
  useEnumFilterOperators,
  useNumberFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
import { useFormatMoney } from "@/hooks/useFormatMoney";
import {
  canIssueInvoice,
  canPrintInvoice,
  canResetInvoicePrint,
  canVoidInvoice,
  useOrderActions,
} from "@/hooks/useOrderActions";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

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
import { Chip, IconButton, Stack, Tooltip } from "@mui/material";
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
  OrderSortField,
  OrderTransition,
} from "@/types/orders";

import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { getOrderEnumOptions } from "@/utils/enumOptions";
import { fetcher } from "@/utils/fetcher";

import AuditLogButton from "@/components/AuditLogButton";
import EmptyCell, { renderEmptyableCell } from "@/components/EmptyCell";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

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

  const {
    handleConfirmIssueInvoice,
    handleConfirmPrintInvoice,
    handleConfirmResetInvoicePrint,
    handleConfirmStatusAction,
    handleConfirmVoidInvoice,
    handleRefund,
    handleUpdateCustomer,
    handleViewOrder,
  } = useOrderActions(organizationSlug, mutate);

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
        field: "createdAt",
        filterOperators: dateFilterOperators,
        headerName: tOrders("createdAt"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "short"),
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
        field: "pickupTime",
        filterOperators: dateFilterOperators,
        headerName: tOrders("pickupTime"),
        renderCell: renderEmptyableCell,
        valueFormatter: (value: string | null) =>
          value ? format.dateTime(new Date(value), "short") : "",
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
        field: "confirmationNumber",
        filterOperators: stringFilterOperators,
        headerName: tOrders("confirmationNumber"),
        renderCell: renderEmptyableCell,
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
