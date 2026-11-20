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
  CashDeviceEventListResponse,
} from "@/types/cashDevices";
import type { Organization } from "@/types/organizations";

import { getDataGridSearchParams } from "@/utils/dataGrid";
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
  loading?: boolean;
  organization?: Organization;
  page?: number;
  pageSize?: number;
  rowCount?: number;
  rows?: CashDeviceEvent[];
}

const CashDeviceEvents = ({
  canCollect = false,
  canRefill = false,
  cashDevice,
  loading = false,
  organization,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  rowCount: initialRowCount = 0,
  rows: initialRows = [],
}: CashDeviceEventsProps) => {
  const organizationSlug = organization?.slug ?? "";
  const currency = organization?.currency ?? "";
  const cashDeviceId = cashDevice?.id ?? "";

  const { handlePaginationModelChange, paginationModel } =
    useDataGridQueryState({ page, pageSize });

  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const formatMoney = useFormatMoney();

  const apiRef = useGridApiRef();

  const tCashDevices = useTranslations("cashDevices");
  const tCommon = useTranslations("common");

  const {
    data: { data: rows, total: rowCount } = {
      data: initialRows,
      total: initialRowCount,
    },
    isValidating,
    mutate,
  } = useSWR(
    !loading &&
      `/api/organizations/${organizationSlug}/cash-devices/${cashDeviceId}/events?${getDataGridSearchParams(paginationModel, { items: [] }, [])}`,
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
        headerName: tCashDevices("events.type.label"),
        valueFormatter: (value: CashDeviceEvent["type"]) =>
          tCashDevices(`events.type.${value}`),
      },
      {
        field: "amount",
        headerName: tCashDevices("events.amount"),
        renderCell: renderEmptyableCell,
        type: "number",
        valueFormatter: formatAmount,
      },
      {
        field: "reportedAmount",
        headerName: tCashDevices("events.reportedAmount"),
        renderCell: renderEmptyableCell,
        type: "number",
        valueFormatter: formatAmount,
      },
      {
        field: "depositedAmount",
        headerName: tCashDevices("events.depositedAmount"),
        renderCell: renderEmptyableCell,
        type: "number",
        valueFormatter: formatAmount,
      },
      {
        field: "difference",
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
        type: "number",
      },
      {
        field: "denominations",
        headerName: tCashDevices("events.denominations"),
        renderCell: renderEmptyableCell,
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
        headerName: tCashDevices("events.note"),
        maxWidth: 320,
        renderCell: renderEmptyableCell,
      },
      {
        field: "occurredAt",
        headerName: tCashDevices("events.occurredAt"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "short"),
      },
    ];
  }, [currency, format, formatMoney, tCashDevices, tCommon]);

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
        disableColumnFilter
        disableColumnSorting
        loading={loading || isValidating}
        onPaginationModelChange={handlePaginationModelChange}
        pageSizeOptions={getPageSizeOptions(paginationModel.pageSize)}
        paginationMode="server"
        paginationModel={paginationModel}
        rowCount={rowCount}
        rows={rows}
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
