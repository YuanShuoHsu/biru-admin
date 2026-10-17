"use client";

import { type BaseSyntheticEvent, useState } from "react";

import { useFormatter, useTranslations } from "next-intl";
import useSWR from "swr";

import { NoCredential } from "../market/MarketTerminal/CredentialSelect";
import { quantAccountUrl, useQuantCredentials } from "../useQuantCredentials";

import DataGrid from "@/components/DataGrid";
import FormBox from "@/components/FormBox";

import { DATA_GRID_PROPS } from "@/constants/dataGrid";
import { DEFAULT_PAGE_SIZE } from "@/constants/pagination";
import { quantPairOf } from "@/constants/quant";

import { useRouter } from "@/i18n/navigation";

import { ContentCopy, Search } from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Button,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type {
  GridColDef,
  GridPaginationModel,
  GridRenderCellParams,
} from "@mui/x-data-grid";

import { quantFuturesGridTrendValues } from "@/types/api";
import type { QuantKol, QuantKolOrder } from "@/types/quant";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

type Trend = (typeof quantFuturesGridTrendValues)[number];

const KolCopy = ({ shareCode }: { shareCode: string }) => {
  const tCopy = useTranslations("quant.copy");
  const tFutures = useTranslations("quant.bots.form.futuresGrid");
  const format = useFormatter();
  const router = useRouter();

  const { credential, credentials } = useQuantCredentials();
  const [code, setCode] = useState(shareCode);
  const [symbol, setSymbol] = useState("");
  const [trend, setTrend] = useState<Trend | "">("");
  const [pagination, setPagination] = useState<GridPaginationModel>({
    page: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const query = new URLSearchParams({
    limit: String(pagination.pageSize),
    page: String(pagination.page + 1),
    shareCode,
    ...(symbol && { symbol }),
    ...(trend && { trend }),
  });
  const { data, error, isLoading } = useSWR<QuantKol>(
    credential && shareCode
      ? quantAccountUrl(credential.id, `kol?${query}`)
      : null,
    fetcher,
  );

  if (credentials && !credential) return <NoCredential />;

  const onSearch = (event: BaseSyntheticEvent) => {
    event.preventDefault();
    setPagination((current) => ({ ...current, page: 0 }));
    router.replace(
      code.trim()
        ? `/quant/copy?${new URLSearchParams({ code: code.trim() })}`
        : "/quant/copy",
    );
  };

  const percent = (value?: number) =>
    value === undefined
      ? "—"
      : format.number(value, {
          maximumFractionDigits: 2,
          signDisplay: "exceptZero",
          style: "percent",
        });
  const number = (value?: number) =>
    value === undefined ? "—" : format.number(value);

  const applyParams = (order: QuantKolOrder) =>
    router.push(
      `/quant/bots/new?${new URLSearchParams({
        type: "futures_grid",
        symbol: order.symbol,
        ...(order.top !== undefined && { top: String(order.top) }),
        ...(order.bottom !== undefined && { bottom: String(order.bottom) }),
        ...(order.row !== undefined && { row: String(order.row) }),
        ...(order.trend && { trend: order.trend }),
        ...(order.leverage !== undefined && {
          leverage: String(order.leverage),
        }),
      })}`,
    );

  const columns: GridColDef[] = [
    {
      field: "actions",
      filterable: false,
      headerName: tCopy("columns.actions"),
      minWidth: 130,
      renderCell: ({ row }: GridRenderCellParams<QuantKolOrder>) => (
        <Button
          disabled={row.type !== "futures_grid"}
          onClick={() => applyParams(row)}
          size="small"
          startIcon={<ContentCopy />}
        >
          {tCopy("apply")}
        </Button>
      ),
      sortable: false,
    },
    {
      field: "symbol",
      headerName: tCopy("columns.symbol"),
      minWidth: 140,
      renderCell: ({ row }: GridRenderCellParams<QuantKolOrder>) => (
        <Stack
          sx={{
            alignItems: "center",
            flexDirection: "row",
            gap: 1,
            height: "100%",
          }}
        >
          {quantPairOf(row.symbol)}
          {row.pinned && <Chip label={tCopy("pinned")} size="small" />}
        </Stack>
      ),
    },
    {
      field: "trend",
      headerName: tCopy("columns.trend"),
      valueGetter: (_, { leverage, trend }: QuantKolOrder) =>
        `${trend ? tFutures(`trends.${trend}`) : "—"}${leverage ? ` ${leverage}x` : ""}`,
    },
    {
      field: "range",
      headerName: tCopy("columns.range"),
      minWidth: 180,
      valueGetter: (_, { bottom, row, top }: QuantKolOrder) =>
        `${number(bottom)} – ${number(top)}${row ? ` · ${tCopy("rows", { row })}` : ""}`,
    },
    {
      field: "investment",
      headerName: tCopy("columns.investment"),
      valueFormatter: (value?: number) => number(value),
    },
    {
      field: "gridApr",
      headerName: tCopy("columns.gridApr"),
      valueFormatter: (value?: number) => percent(value),
    },
    {
      field: "totalReturn",
      headerName: tCopy("columns.totalReturn"),
      valueFormatter: (value?: number) => percent(value),
    },
    {
      field: "createTime",
      headerName: tCopy("columns.createTime"),
      minWidth: 180,
      valueFormatter: (value: number) =>
        format.dateTime(new Date(value), "dateTime"),
    },
  ];

  return (
    <Stack sx={{ gap: 2 }}>
      <FormBox noValidate onSubmit={onSearch} sx={{ flexDirection: "row" }}>
        <TextField
          helperText={tCopy("shareCodeHelper")}
          label={tCopy("shareCode")}
          onChange={(event) => setCode(event.target.value)}
          size="small"
          value={code}
        />
        <Button
          size="small"
          startIcon={<Search />}
          sx={{ alignSelf: "flex-start", mt: 0.5 }}
          type="submit"
          variant="contained"
        >
          {tCopy("search")}
        </Button>
      </FormBox>
      <Alert severity="info">{tCopy("hint")}</Alert>
      {error && <Alert severity="error">{getErrorMessage(error)}</Alert>}
      {data && (
        <Stack
          sx={{
            alignItems: "center",
            flexDirection: "row",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Avatar src={data.avatar} />
          <Typography variant="h6">{data.nickname}</Typography>
          <TextField
            label={tCopy("columns.symbol")}
            onChange={(event) => setSymbol(event.target.value)}
            select
            size="small"
            sx={{ minWidth: 160 }}
            value={symbol}
          >
            <MenuItem value="">{tCopy("all")}</MenuItem>
            {data.symbols.map((value) => (
              <MenuItem key={value} value={value}>
                {value}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label={tCopy("columns.trend")}
            onChange={(event) => setTrend(event.target.value as Trend | "")}
            select
            size="small"
            sx={{ minWidth: 120 }}
            value={trend}
          >
            <MenuItem value="">{tCopy("all")}</MenuItem>
            {quantFuturesGridTrendValues.map((value) => (
              <MenuItem key={value} value={value}>
                {tFutures(`trends.${value}`)}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      )}
      {shareCode && (
        <DataGrid
          {...DATA_GRID_PROPS}
          columns={columns}
          loading={isLoading}
          localeText={{ noRowsLabel: tCopy("empty") }}
          onPaginationModelChange={setPagination}
          paginationMode="server"
          paginationModel={pagination}
          rowCount={data?.total ?? 0}
          rows={data?.orders ?? []}
          showToolbar={false}
        />
      )}
    </Stack>
  );
};

export default KolCopy;
