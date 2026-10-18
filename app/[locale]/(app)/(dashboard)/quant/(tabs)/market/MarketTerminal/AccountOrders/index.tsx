"use client";

import { useMemo, useState } from "react";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import useSWR, { useSWRConfig } from "swr";

import {
  isQuantAccountKey,
  quantAccountUrl,
} from "../../../useQuantCredentials";

import DataGrid from "@/components/DataGrid";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";

import { Close } from "@mui/icons-material";
import {
  Box,
  Button,
  DialogContentText,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  type GridColDef,
  type GridRenderCellParams,
  useGridApiRef,
} from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  QuantCredential,
  QuantFill,
  QuantMarket,
  QuantOrder,
} from "@/types/quant";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

const GRID_HEIGHT = 360;

type AccountTab = "fills" | "openOrders" | "orders";

const orderStatus = ({ filledSize, size, status, type }: QuantOrder) => {
  if (status === "OPEN") return "open";
  if (filledSize === 0) return "canceled";
  // 市價買單只有金額沒有委託數量，收單即視為成交完畢
  if (type === "MARKET" || (size !== undefined && filledSize >= size))
    return "filled";

  return "partiallyCanceled";
};

interface AccountOrdersProps {
  credential: QuantCredential;
  market: QuantMarket;
}

const AccountOrders = ({ credential, market }: AccountOrdersProps) => {
  const tQuant = useTranslations("quant");
  const format = useFormatter();
  const { mutate } = useSWRConfig();
  const setDialog = useDialogStore((state) => state.setDialog);

  const [tab, setTab] = useState<AccountTab>("openOrders");

  const apiRef = useGridApiRef();
  const autosizeOnData = {
    onSuccess: () => {
      setTimeout(() => {
        apiRef.current?.autosizeColumns(autosizeOptions);
      }, 0);
    },
  };

  const symbolQuery = `?symbol=${market.symbol}`;
  const openOrdersUrl = `${quantAccountUrl(credential.id, "open-orders")}${symbolQuery}`;

  const { data: openOrders, isLoading: openOrdersLoading } = useSWR<
    QuantOrder[]
  >(openOrdersUrl, fetcher, autosizeOnData);
  const { data: orders, isLoading: ordersLoading } = useSWR<QuantOrder[]>(
    tab === "orders"
      ? `${quantAccountUrl(credential.id, "orders")}${symbolQuery}`
      : null,
    fetcher,
    autosizeOnData,
  );
  const { data: fills, isLoading: fillsLoading } = useSWR<QuantFill[]>(
    tab === "fills"
      ? `${quantAccountUrl(credential.id, "fills")}${symbolQuery}`
      : null,
    fetcher,
    autosizeOnData,
  );

  const revalidate = () => mutate(isQuantAccountKey(credential.id));

  const handleCancelAll = () =>
    setDialog({
      content: (
        <DialogContentText>
          {tQuant.rich("account.cancelAll.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
            count: openOrders?.length ?? 0,
            symbol: `${market.baseCurrency}/${market.quoteCurrency}`,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        try {
          await fetcher(
            `${quantAccountUrl(credential.id, "open-orders")}${symbolQuery}`,
            { method: "DELETE" },
          );
          enqueueSnackbar(tQuant("account.cancelAll.success"), {
            variant: "success",
          });
        } catch (error) {
          enqueueSnackbar(getErrorMessage(error), { variant: "error" });
        } finally {
          void revalidate();
        }
      },
      open: true,
      title: tQuant("account.cancelAll.title"),
    });

  const { fillColumns, historyColumns, openOrderColumns } = useMemo(() => {
    const formatPrice = (value?: number) =>
      value === undefined
        ? "—"
        : format.number(value, {
            maximumFractionDigits: market.pricePrecision,
            minimumFractionDigits: market.pricePrecision,
          });
    const formatSize = (value: number) =>
      format.number(value, { maximumFractionDigits: market.sizePrecision });
    const formatTime = (value: number) =>
      format.dateTime(new Date(value), "short");

    const handleCancel = async (order: QuantOrder) => {
      try {
        await fetcher(
          `${quantAccountUrl(credential.id, `orders/${order.orderId}`)}${symbolQuery}`,
          { method: "DELETE" },
        );
        enqueueSnackbar(tQuant("account.cancel.success"), {
          variant: "success",
        });
      } catch (error) {
        enqueueSnackbar(getErrorMessage(error), { variant: "error" });
      } finally {
        void mutate(isQuantAccountKey(credential.id));
      }
    };

    const sideColumn: GridColDef = {
      field: "side",
      headerName: tQuant("account.columns.side"),
      renderCell: ({ row }: GridRenderCellParams<QuantFill | QuantOrder>) => (
        <Box
          component="span"
          sx={{ color: row.side === "BUY" ? "success.main" : "error.main" }}
        >
          {tQuant(`order.side.${row.side}`)}
        </Box>
      ),
    };

    const orderSizeColumn: GridColDef = {
      field: "size",
      headerName: tQuant("account.columns.size"),
      valueGetter: (_, { amount, size }: QuantOrder) =>
        size !== undefined
          ? `${formatSize(size)} ${market.baseCurrency}`
          : amount !== undefined
            ? `${formatPrice(amount)} ${market.quoteCurrency}`
            : "—",
    };

    const orderColumns: GridColDef[] = [
      {
        field: "createTime",
        headerName: tQuant("account.columns.time"),
        valueFormatter: (value: number) => formatTime(value),
      },
      sideColumn,
      {
        field: "type",
        headerName: tQuant("account.columns.type"),
        valueFormatter: (value: QuantOrder["type"]) =>
          tQuant(`order.type.${value}`),
      },
      {
        field: "price",
        headerName: tQuant("account.columns.price"),
        valueFormatter: (value?: number) => formatPrice(value),
      },
      orderSizeColumn,
      {
        field: "filledSize",
        headerName: tQuant("account.columns.filled"),
        valueFormatter: (value: number) => formatSize(value),
      },
    ];

    const openOrderColumns: GridColDef[] = [
      {
        disableColumnMenu: true,
        disableExport: true,
        field: "actions",
        filterable: false,
        headerName: tQuant("account.columns.actions"),
        renderCell: ({ row }: GridRenderCellParams<QuantOrder>) => (
          <Tooltip title={tQuant("account.cancel.label")}>
            <IconButton
              color="error"
              onClick={(event) => {
                event.stopPropagation();

                void handleCancel(row);
              }}
              size="small"
            >
              <Close fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
        resizable: false,
        sortable: false,
      },
      ...orderColumns,
    ];

    const historyColumns: GridColDef[] = [
      ...orderColumns,
      {
        field: "averagePrice",
        headerName: tQuant("account.columns.averagePrice"),
        valueGetter: (_, { filledAmount, filledSize }: QuantOrder) =>
          filledSize > 0 ? filledAmount / filledSize : undefined,
        valueFormatter: (value?: number) => formatPrice(value),
      },
      {
        field: "fee",
        headerName: tQuant("account.columns.fee"),
        valueGetter: (_, { fee, feeCoin }: QuantOrder) =>
          fee > 0 ? `${format.number(fee, "precise")} ${feeCoin}` : "—",
      },
      {
        field: "status",
        headerName: tQuant("account.columns.status"),
        valueGetter: (_, row: QuantOrder) =>
          tQuant(`account.status.${orderStatus(row)}`),
      },
    ];

    const fillColumns: GridColDef[] = [
      {
        field: "time",
        headerName: tQuant("account.columns.time"),
        valueFormatter: (value: number) => formatTime(value),
      },
      sideColumn,
      {
        field: "role",
        headerName: tQuant("account.columns.role"),
        valueFormatter: (value: QuantFill["role"]) =>
          tQuant(`order.role.${value}`),
      },
      {
        field: "price",
        headerName: tQuant("account.columns.price"),
        valueFormatter: (value: number) => formatPrice(value),
      },
      {
        field: "size",
        headerName: tQuant("account.columns.size"),
        valueFormatter: (value: number) => formatSize(value),
      },
      {
        field: "fee",
        headerName: tQuant("account.columns.fee"),
        valueGetter: (_, { fee, feeCoin }: QuantFill) =>
          `${format.number(fee, "precise")} ${feeCoin}`,
      },
    ];

    return { fillColumns, historyColumns, openOrderColumns };
  }, [
    credential.id,
    format,
    market.baseCurrency,
    market.pricePrecision,
    market.quoteCurrency,
    market.sizePrecision,
    mutate,
    symbolQuery,
    tQuant,
  ]);

  return (
    <Stack sx={{ gap: 1 }}>
      <Stack
        sx={{
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Tabs
          onChange={(_, value: AccountTab) => setTab(value)}
          scrollButtons="auto"
          sx={{ flex: 1, minWidth: 0 }}
          value={tab}
          variant="scrollable"
        >
          <Tab
            label={`${tQuant("account.openOrders")} (${openOrders?.length ?? 0})`}
            value="openOrders"
          />
          <Tab label={tQuant("account.orders")} value="orders" />
          <Tab label={tQuant("account.fills")} value="fills" />
        </Tabs>
        {tab === "openOrders" && !!openOrders?.length && (
          <Button color="error" onClick={handleCancelAll} size="small">
            {tQuant("account.cancelAll.label")}
          </Button>
        )}
      </Stack>
      <Typography color="text.secondary" variant="caption">
        {tQuant("account.botOrdersHint")}
      </Typography>
      <Box sx={{ height: GRID_HEIGHT }}>
        {tab === "fills" ? (
          <DataGrid
            {...DATA_GRID_PROPS}
            apiRef={apiRef}
            columns={fillColumns}
            getRowId={({ id }) => id}
            loading={fillsLoading}
            rows={fills ?? []}
          />
        ) : (
          <DataGrid
            {...DATA_GRID_PROPS}
            apiRef={apiRef}
            columns={tab === "orders" ? historyColumns : openOrderColumns}
            getRowId={({ orderId }) => orderId}
            key={tab}
            loading={tab === "orders" ? ordersLoading : openOrdersLoading}
            rows={(tab === "orders" ? orders : openOrders) ?? []}
          />
        )}
      </Box>
    </Stack>
  );
};

export default AccountOrders;
