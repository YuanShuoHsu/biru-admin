"use client";

import { useFormatter, useTranslations } from "next-intl";
import useSWR from "swr";

import DataGrid from "@/components/DataGrid";
import ErrorAlert from "@/components/ErrorAlert";

import { DATA_GRID_PROPS } from "@/constants/dataGrid";

import { Box } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";

import type { QuantFill, QuantFuturesFill } from "@/types/quant";

import { fetcher } from "@/utils/fetcher";

const GRID_HEIGHT = 320;

type Fill = QuantFill | QuantFuturesFill;

interface OrderFillsProps {
  pricePrecision: number;
  sizePrecision: number;
  url: string;
}

const OrderFills = ({
  pricePrecision,
  sizePrecision,
  url,
}: OrderFillsProps) => {
  const tQuant = useTranslations("quant");
  const format = useFormatter();

  const {
    data: fills,
    error,
    isLoading,
    mutate,
  } = useSWR<Fill[]>(url, fetcher);

  const columns: GridColDef[] = [
    {
      field: "time",
      flex: 1,
      headerName: tQuant("account.columns.time"),
      valueFormatter: (value: number) =>
        format.dateTime(new Date(value), "short"),
    },
    {
      field: "role",
      headerName: tQuant("account.columns.role"),
      valueGetter: (_, fill: Fill) =>
        "feeType" in fill && fill.feeType === "LIQUIDATION"
          ? tQuant("futures.liquidation")
          : tQuant(`order.role.${fill.role}`),
    },
    {
      field: "price",
      headerName: tQuant("account.columns.price"),
      valueFormatter: (value: number) =>
        format.number(value, {
          maximumFractionDigits: pricePrecision,
          minimumFractionDigits: pricePrecision,
        }),
    },
    {
      field: "size",
      headerName: tQuant("account.columns.size"),
      valueFormatter: (value: number) =>
        format.number(value, { maximumFractionDigits: sizePrecision }),
    },
    {
      field: "fee",
      headerName: tQuant("account.columns.fee"),
      valueGetter: (_, { fee, feeCoin }: Fill) =>
        `${format.number(fee, "precise")} ${feeCoin}`,
    },
  ];

  return (
    <Box sx={{ height: GRID_HEIGHT }}>
      {error ? (
        <ErrorAlert onRetry={() => mutate()} />
      ) : (
        <DataGrid
          {...DATA_GRID_PROPS}
          columns={columns}
          hideFooter
          loading={isLoading}
          rows={fills ?? []}
          showToolbar={false}
        />
      )}
    </Box>
  );
};

export default OrderFills;
