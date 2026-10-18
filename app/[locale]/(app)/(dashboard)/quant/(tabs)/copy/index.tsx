"use client";

import {
  type BaseSyntheticEvent,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

import { useFormatter, useTranslations } from "next-intl";
import useSWR from "swr";

import { useBotFormDialog } from "../bots/BotForm";
import { NoCredential } from "../market/MarketTerminal/CredentialSelect";
import { quantAccountUrl, useQuantCredentials } from "../useQuantCredentials";
import {
  forgetKol,
  parseShareCodeInput,
  readRecentKols,
  rememberKol,
  serverRecentKols,
  subscribeRecentKols,
} from "./definitions";

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
  Paper,
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
  const openBotForm = useBotFormDialog();

  const { credential, credentials } = useQuantCredentials();
  const recentKols = useSyncExternalStore(
    subscribeRecentKols,
    readRecentKols,
    serverRecentKols,
  );
  const [code, setCode] = useState(shareCode);
  const [inputError, setInputError] = useState(false);
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

  useEffect(() => {
    if (data)
      rememberKol({
        avatar: data.avatar,
        code: shareCode,
        nickname: data.nickname,
      });
  }, [data, shareCode]);

  if (credentials && !credential) return <NoCredential />;

  const search = (value: string) => {
    setPagination((current) => ({ ...current, page: 0 }));
    router.replace(
      value
        ? `/quant/copy?${new URLSearchParams({ code: value })}`
        : "/quant/copy",
    );
  };

  const onSearch = (event: BaseSyntheticEvent) => {
    event.preventDefault();
    const parsed = parseShareCodeInput(code);
    if (parsed?.kind === "linkWithoutCode") {
      setInputError(true);
      return;
    }

    setInputError(false);
    if (parsed?.kind === "link") setCode(parsed.code);
    search(parsed?.code ?? "");
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
    openBotForm({
      preset: {
        bottom: order.bottom === undefined ? undefined : String(order.bottom),
        leverage:
          order.leverage === undefined ? undefined : String(order.leverage),
        row: order.row === undefined ? undefined : String(order.row),
        symbol: order.symbol,
        top: order.top === undefined ? undefined : String(order.top),
        trend: order.trend,
      },
      type: "futures_grid",
    });

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
          error={inputError}
          helperText={tCopy(inputError ? "linkWithoutCode" : "shareCodeHelper")}
          label={tCopy("shareCode")}
          onChange={(event) => {
            setCode(event.target.value);
            setInputError(false);
          }}
          size="small"
          sx={{ maxWidth: 420, width: "100%" }}
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
      {!!recentKols.length && (
        <Stack
          sx={{
            alignItems: "center",
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Typography color="text.secondary" variant="body2">
            {tCopy("recent")}
          </Typography>
          {recentKols.map((kol) => (
            <Chip
              avatar={<Avatar src={kol.avatar} />}
              color={kol.code === shareCode ? "primary" : "default"}
              key={kol.code}
              label={kol.nickname}
              onClick={() => {
                setCode(kol.code);
                setInputError(false);
                search(kol.code);
              }}
              onDelete={() => forgetKol(kol.code)}
              variant={kol.code === shareCode ? "filled" : "outlined"}
            />
          ))}
        </Stack>
      )}
      {(!shareCode || error) && (
        <Paper sx={{ display: "flex", flexDirection: "column", gap: 1, p: 2 }}>
          <Typography variant="subtitle1">{tCopy("guide.title")}</Typography>
          <Stack component="ol" sx={{ gap: 0.5, m: 0, pl: 2.5 }}>
            {(["get", "find", "apply"] as const).map((step) => (
              <Typography component="li" key={step} variant="body2">
                {tCopy(`guide.steps.${step}`)}
              </Typography>
            ))}
          </Stack>
          <Typography color="text.secondary" variant="caption">
            {tCopy("guide.note")}
          </Typography>
        </Paper>
      )}
      {error && <Alert severity="error">{getErrorMessage(error)}</Alert>}
      {data && <Alert severity="info">{tCopy("hint")}</Alert>}
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
