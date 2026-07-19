"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  getPageSizeOptions,
} from "@/constants/dataGrid";
import { STATUS_COLORS } from "@/constants/orders";

import {
  useDateFilterOperators,
  useEnumFilterOperators,
  useNumberFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";

import { useRouter } from "@/i18n/navigation";

import { NavigateNext } from "@mui/icons-material";
import {
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import { LineChart } from "@mui/x-charts/LineChart";
import { SparkLineChart } from "@mui/x-charts/SparkLineChart";
import type {
  GridColDef,
  GridFilterModel,
  GridPaginationModel,
  GridRenderCellParams,
  GridSortModel,
} from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { orderResponseDtoOrderStatusValues } from "@/types/api";
import type { OrderResponse } from "@/types/orders";

import { getDataGridSearchParams } from "@/utils/dataGrid";
import { fetcher } from "@/utils/fetcher";
import { getOrderTotalAmount } from "@/utils/orders";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

const StyledCard = styled(Card)({
  height: "100%",
});

const StyledCardActionArea = styled(CardActionArea)({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
});

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
}));

const TREND_NEUTRAL_THRESHOLD = 5;

// https://github.com/mui/material-ui/blob/master/docs/data/material/getting-started/templates/dashboard/components/SessionsChart.tsx
const AreaGradient = ({ color, id }: { color: string; id: string }) => (
  <defs>
    <linearGradient id={id} x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stopColor={color} stopOpacity={0.5} />
      <stop offset="100%" stopColor={color} stopOpacity={0} />
    </linearGradient>
  </defs>
);

interface Trend {
  data: number[];
  percent: number;
}

interface DashboardProps {
  organizationSlug: string;
  stats: {
    totalUsers: number | null;
    totalOrganizations: number;
    totalOrders: number;
    ordersTrend: Trend;
    revenueTrend: Trend;
    usersTrend: Trend | null;
    organizationsTrend: Trend;
  };
  recentOrders: OrderResponse[];
}

const Dashboard = ({
  organizationSlug,
  stats,
  recentOrders,
}: DashboardProps) => {
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([]);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
  });

  const apiRef = useGridApiRef();

  const format = useFormatter();

  const router = useRouter();

  const theme = useTheme();

  const {
    data: { data: orders, total: rowCount } = {
      data: recentOrders,
      total: stats.totalOrders,
    },
    isValidating: loading,
  } = useSWR(
    organizationSlug
      ? [
          `/api/organizations/${organizationSlug}/orders`,
          filterModel.items[0]?.field,
          filterModel.items[0]?.operator,
          filterModel.items[0]?.value,
          filterModel.quickFilterValues,
          paginationModel.page,
          paginationModel.pageSize,
          sortModel,
        ]
      : null,
    async () =>
      fetcher<{ data: OrderResponse[]; total: number }>(
        `/api/organizations/${organizationSlug}/orders?${getDataGridSearchParams(
          paginationModel,
          filterModel,
          sortModel,
        )}`,
      ),
    {
      fallbackData: { data: recentOrders, total: stats.totalOrders },
      onSuccess: () => {
        setTimeout(() => {
          apiRef.current?.autosizeColumns(autosizeOptions);
        }, 0);
      },
    },
  );

  const locale = useLocale();
  const tDashboard = useTranslations("dashboard");
  const tOrders = useTranslations("orders");

  const stringFilterOperators = useStringFilterOperators();
  const enumFilterOperators = useEnumFilterOperators();
  const dateFilterOperators = useDateFilterOperators();
  const numberFilterOperators = useNumberFilterOperators();

  const handleSortModelChange = useCallback((newModel: GridSortModel) => {
    setSortModel(newModel);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, []);

  const handleFilterModelChange = useCallback((newModel: GridFilterModel) => {
    setFilterModel(newModel);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, []);

  const ordersHref = `/orders?${new URLSearchParams({
    ...(organizationSlug && { organization: organizationSlug }),
    page: "1",
    pageSize: "10",
  }).toString()}`;

  const trendDayLabels = useMemo(() => {
    const days = stats.ordersTrend.data.length;
    const now = new Date();
    const end = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
    );

    return Array.from({ length: days }, (_, index) =>
      format.dateTime(new Date(end - (days - 1 - index) * 86_400_000), {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      }),
    );
  }, [format, stats.ordersTrend.data.length]);

  const statCards = [
    {
      label: tDashboard("stats.totalOrders"),
      value: stats.totalOrders,
      href: ordersHref,
      trend: stats.ordersTrend,
    },
    {
      label: tDashboard("stats.totalOrganizations"),
      value: stats.totalOrganizations,
      href: "/organizations",
      trend: stats.organizationsTrend,
    },
    ...(stats.totalUsers !== null && stats.usersTrend
      ? [
          {
            label: tDashboard("stats.totalUsers"),
            value: stats.totalUsers,
            href: "/admins?page=1&pageSize=10",
            trend: stats.usersTrend,
          },
        ]
      : []),
  ];

  const revenueTotal = stats.revenueTrend.data.reduce((sum, n) => sum + n, 0);
  const revenueCurrency = recentOrders[0]?.items[0]?.priceCurrency || "";
  const revenueChipColor =
    stats.revenueTrend.percent > TREND_NEUTRAL_THRESHOLD
      ? "success"
      : stats.revenueTrend.percent < -TREND_NEUTRAL_THRESHOLD
        ? "error"
        : "default";
  const revenueTrendColor =
    revenueChipColor === "default"
      ? theme.vars.palette.text.secondary
      : theme.vars.palette[revenueChipColor].main;

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: "orderNumber",
        filterOperators: stringFilterOperators,
        headerName: tOrders("orderNumber"),
      },
      {
        field: "orderStatus",
        filterOperators: enumFilterOperators,
        headerName: tOrders("orderStatus"),
        renderCell: ({ row }: GridRenderCellParams<OrderResponse>) => (
          <Chip
            color={STATUS_COLORS[row.orderStatus]}
            label={tOrders(`status.${row.orderStatus}`)}
            size="small"
            variant="outlined"
          />
        ),
        type: "singleSelect",
        valueOptions: orderResponseDtoOrderStatusValues.map((value) => ({
          label: tOrders(`status.${value}`),
          value,
        })),
      },
      {
        field: "total",
        filterOperators: numberFilterOperators,
        headerName: tOrders("total"),
        valueGetter: (_value: unknown, row: OrderResponse) =>
          `${row.items[0]?.priceCurrency || ""} ${getOrderTotalAmount(row).toLocaleString(locale)}`,
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
      format,
      locale,
      numberFilterOperators,
      stringFilterOperators,
      tOrders,
    ],
  );

  return (
    <>
      <Typography color="text.primary" variant="h6">
        {tDashboard("overview")}
      </Typography>
      <Grid container spacing={2}>
        {statCards.map(({ label, value, href, trend }, index) => {
          const chipColor =
            trend.percent > TREND_NEUTRAL_THRESHOLD
              ? "success"
              : trend.percent < -TREND_NEUTRAL_THRESHOLD
                ? "error"
                : "default";
          const trendColor =
            chipColor === "default"
              ? theme.vars.palette.text.secondary
              : theme.vars.palette[chipColor].main;

          return (
            <Grid key={label} size={{ xs: 12, sm: 6, md: 4 }}>
              <StyledCard variant="outlined">
                <StyledCardActionArea onClick={() => router.push(href)}>
                  <StyledCardContent>
                    <Typography variant="subtitle2">{label}</Typography>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="h4">
                        {value.toLocaleString(locale)}
                      </Typography>
                      <Chip
                        color={chipColor}
                        label={`${trend.percent > 0 ? "+" : ""}${trend.percent}%`}
                        size="small"
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {tDashboard("stats.period")}
                    </Typography>
                    <SparkLineChart
                      data={trend.data}
                      area
                      height={50}
                      showHighlight
                      showTooltip
                      color={trendColor}
                      sx={{
                        "& .MuiLineChart-area": {
                          fill: `url('#area-gradient-${index}')`,
                        },
                      }}
                      xAxis={{ data: trendDayLabels, scaleType: "band" }}
                    >
                      <AreaGradient
                        color={trendColor}
                        id={`area-gradient-${index}`}
                      />
                    </SparkLineChart>
                  </StyledCardContent>
                </StyledCardActionArea>
              </StyledCard>
            </Grid>
          );
        })}
      </Grid>
      <Card variant="outlined">
        <StyledCardContent>
          <Typography component="h2" variant="subtitle2">
            {tDashboard("stats.revenue")}
          </Typography>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            gap={1}
          >
            <Typography variant="h4">
              {`${revenueCurrency} ${revenueTotal.toLocaleString(locale)}`.trim()}
            </Typography>
            <Chip
              color={revenueChipColor}
              label={`${stats.revenueTrend.percent > 0 ? "+" : ""}${stats.revenueTrend.percent}%`}
              size="small"
            />
          </Stack>
          <Typography color="text.secondary" variant="caption">
            {tDashboard("stats.period")}
          </Typography>
          <LineChart
            height={250}
            hideLegend
            grid={{ horizontal: true }}
            margin={{ left: 0, bottom: 0 }}
            series={[
              {
                area: true,
                color: revenueTrendColor,
                curve: "linear",
                data: stats.revenueTrend.data,
                id: "revenue",
                label: tDashboard("stats.revenue"),
                showMark: false,
                valueFormatter: (value) =>
                  `${revenueCurrency} ${(value ?? 0).toLocaleString(locale)}`.trim(),
              },
            ]}
            sx={{
              "& .MuiLineChart-area": {
                fill: "url('#revenue')",
              },
            }}
            xAxis={[
              {
                data: trendDayLabels,
                scaleType: "point",
                tickInterval: (_, index) => (index + 1) % 5 === 0,
              },
            ]}
            yAxis={[{ width: "auto" }]}
          >
            <AreaGradient color={revenueTrendColor} id="revenue" />
          </LineChart>
        </StyledCardContent>
      </Card>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography color="text.primary" variant="h6">
          {tDashboard("stats.details")}
        </Typography>
        <Chip
          icon={<NavigateNext />}
          label={tDashboard("quickActions.viewOrders")}
          onClick={() => router.push(ordersHref)}
          size="small"
          variant="outlined"
        />
      </Stack>
      <DataGrid
        {...DATA_GRID_PROPS}
        apiRef={apiRef}
        columns={columns}
        filterMode="server"
        filterModel={filterModel}
        loading={loading}
        onFilterModelChange={handleFilterModelChange}
        onPaginationModelChange={setPaginationModel}
        onSortModelChange={handleSortModelChange}
        pageSizeOptions={getPageSizeOptions(paginationModel.pageSize)}
        paginationMode="server"
        paginationModel={paginationModel}
        rowCount={rowCount}
        rows={orders}
        sortingMode="server"
        sortModel={sortModel}
      />
    </>
  );
};

export default Dashboard;
