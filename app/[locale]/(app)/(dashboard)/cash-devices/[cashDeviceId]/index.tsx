"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import useSWR from "swr";

import CashDeviceCollectionDialog from "./CashDeviceCollectionDialog";
import CashDeviceRefillDialog from "./CashDeviceRefillDialog";

import DataGrid from "@/components/DataGrid";
import EmptyCell, { renderEmptyableCell } from "@/components/EmptyCell";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";
import { DEFAULT_PAGE_SIZE, getPageSizeOptions } from "@/constants/pagination";

import { useDataGridQueryState } from "@/hooks/useDataGridQueryState";
import {
  useDateFilterOperators,
  useEnumFilterOperators,
} from "@/hooks/useFilterOperators";
import { useFormatMoney } from "@/hooks/useFormatMoney";

import { AddCard, Savings } from "@mui/icons-material";
import { Button, Chip, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  CashDenominations,
  CashDevice,
  CashDeviceEvent,
  CashDeviceEventFilterField,
  CashDeviceEventListResponse,
  CashDeviceEventSortField,
} from "@/types/cashDevices";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization } from "@/types/organizations";

import { getDataGridSearchParams } from "@/utils/dataGrid";
import { getCashDeviceEventEnumOptions } from "@/utils/enumOptions";
import { fetcher } from "@/utils/fetcher";

const ToolbarStack = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  alignItems: "center",
  gap: theme.spacing(2),
}));

interface CashDeviceEventsProps {
  canCollect?: boolean;
  canRefill?: boolean;
  cashDevice?: CashDevice;
  filterField?: CashDeviceEventFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  loading?: boolean;
  organization?: Organization;
  page?: number;
  pageSize?: number;
  rowCount?: number;
  rows?: CashDeviceEvent[];
  sortBy?: CashDeviceEventSortField;
  sortDirection?: SortDirection;
}

const CashDeviceEvents = ({
  canCollect = false,
  canRefill = false,
  cashDevice,
  filterField,
  filterOperator,
  filterValue,
  loading = false,
  organization,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  rowCount: initialRowCount = 0,
  rows: initialRows = [],
  sortBy,
  sortDirection,
}: CashDeviceEventsProps) => {
  const organizationSlug = organization?.slug ?? "";
  const currency = organization?.currency ?? "";
  const cashDeviceId = cashDevice?.id ?? "";

  const {
    filterModel,
    handleFilterModelChange,
    handlePaginationModelChange,
    handleSortModelChange,
    paginationModel,
    sortModel,
  } = useDataGridQueryState({
    filterField,
    filterOperator,
    filterValue,
    page,
    pageSize,
    sortBy,
    sortDirection,
  });

  const dateFilterOperators = useDateFilterOperators();
  const enumFilterOperators = useEnumFilterOperators();

  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const formatMoney = useFormatMoney();

  const apiRef = useGridApiRef();

  const tCashDevices = useTranslations("cashDevices");
  const tCommon = useTranslations("common");

  const enumOptions = useMemo(
    () => getCashDeviceEventEnumOptions(tCashDevices),
    [tCashDevices],
  );

  const {
    data: { data: rows, total: rowCount } = {
      data: initialRows,
      total: initialRowCount,
    },
    isValidating,
    mutate,
  } = useSWR(
    !loading &&
      `/api/organizations/${organizationSlug}/cash-devices/${cashDeviceId}/events?${getDataGridSearchParams(paginationModel, filterModel, sortModel)}`,
    (url: string) => fetcher<CashDeviceEventListResponse>(url),
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

  const handleRefill = useCallback(() => {
    setDialog({
      content: (
        <CashDeviceRefillDialog
          cashDeviceId={cashDeviceId}
          currency={currency}
          mutate={mutate}
          organizationSlug={organizationSlug}
        />
      ),
      formId: "cash-device-refill-form",
      open: true,
      title: tCashDevices("actions.refill.title"),
    });
  }, [
    cashDeviceId,
    currency,
    mutate,
    organizationSlug,
    setDialog,
    tCashDevices,
  ]);

  const handleCollect = useCallback(() => {
    setDialog({
      content: (
        <CashDeviceCollectionDialog
          cashDeviceId={cashDeviceId}
          currency={currency}
          mutate={mutate}
          organizationSlug={organizationSlug}
        />
      ),
      formId: "cash-device-collection-form",
      open: true,
      title: tCashDevices("actions.collection.title"),
    });
  }, [
    cashDeviceId,
    currency,
    mutate,
    organizationSlug,
    setDialog,
    tCashDevices,
  ]);

  const columns = useMemo<GridColDef[]>(() => {
    const formatAmount = (value: string | null | undefined) =>
      value == null ? "" : formatMoney(Number(value), currency);

    return [
      {
        field: "type",
        filterOperators: enumFilterOperators,
        headerName: tCashDevices("events.type.label"),
        type: "singleSelect",
        valueOptions: enumOptions.type,
      },
      {
        field: "amount",
        filterable: false,
        headerName: tCashDevices("events.amount"),
        renderCell: renderEmptyableCell,
        sortable: false,
        type: "number",
        valueFormatter: formatAmount,
      },
      {
        field: "reportedAmount",
        filterable: false,
        headerName: tCashDevices("events.reportedAmount"),
        renderCell: renderEmptyableCell,
        sortable: false,
        type: "number",
        valueFormatter: formatAmount,
      },
      {
        field: "depositedAmount",
        filterable: false,
        headerName: tCashDevices("events.depositedAmount"),
        renderCell: renderEmptyableCell,
        sortable: false,
        type: "number",
        valueFormatter: formatAmount,
      },
      {
        field: "difference",
        filterable: false,
        headerName: tCashDevices("events.difference"),
        renderCell: ({
          row: { difference },
        }: GridRenderCellParams<CashDeviceEvent>) =>
          difference == null ? (
            <EmptyCell />
          ) : (
            <Chip
              color={Number(difference) === 0 ? "success" : "error"}
              label={formatMoney(Number(difference), currency, {
                signDisplay: "exceptZero",
              })}
              size="small"
              variant="outlined"
            />
          ),
        sortable: false,
        type: "number",
      },
      {
        field: "denominations",
        filterable: false,
        headerName: tCashDevices("events.denominations"),
        renderCell: renderEmptyableCell,
        sortable: false,
        valueGetter: (value: CashDenominations) =>
          Object.entries(value)
            .filter(([, count]) => count)
            .map(
              ([denomination, count]) =>
                `${format.number(Number(denomination))} × ${format.number(count)}`,
            )
            .join(tCommon("middleDot")),
      },
      {
        field: "note",
        filterable: false,
        headerName: tCashDevices("events.note"),
        maxWidth: 320,
        renderCell: renderEmptyableCell,
        sortable: false,
      },
      {
        field: "occurredAt",
        filterOperators: dateFilterOperators,
        headerName: tCashDevices("events.occurredAt"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "short"),
      },
    ];
  }, [
    currency,
    dateFilterOperators,
    enumFilterOperators,
    enumOptions,
    format,
    formatMoney,
    tCashDevices,
    tCommon,
  ]);

  return (
    <>
      {cashDevice && (
        <ToolbarStack direction="row">
          <Typography variant="h6">{cashDevice.name}</Typography>
          <Chip
            color={cashDevice.status === "active" ? "success" : "default"}
            label={tCashDevices(`status.${cashDevice.status}`)}
            size="small"
            variant="outlined"
          />
          <Typography color="textSecondary" variant="body2">
            {[
              cashDevice.vendor,
              cashDevice.model,
              cashDevice.lastSeenAt &&
                `${tCashDevices("lastSeenAt")} ${format.dateTime(new Date(cashDevice.lastSeenAt), "short")}`,
            ]
              .filter(Boolean)
              .join(tCommon("middleDot"))}
          </Typography>
          {canRefill && cashDevice.status === "active" && (
            <Button
              onClick={handleRefill}
              size="small"
              startIcon={<AddCard />}
              variant="contained"
            >
              {tCashDevices("actions.refill.title")}
            </Button>
          )}
          {canCollect && cashDevice.status === "active" && (
            <Button
              onClick={handleCollect}
              size="small"
              startIcon={<Savings />}
              variant="contained"
            >
              {tCashDevices("actions.collection.title")}
            </Button>
          )}
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
        slotProps={{
          ...DATA_GRID_PROPS.slotProps,
          toolbar: {
            disableQuickFilter: true,
            exportDateField: "occurredAt",
          },
        }}
      />
    </>
  );
};

export default CashDeviceEvents;
