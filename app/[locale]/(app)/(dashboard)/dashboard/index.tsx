"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import DateFilterInputValue from "@/components/DateFilterInputValue";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  DATE_FILTER_OPERATORS,
  ENUM_FILTER_OPERATORS,
  getPageSizeOptions,
  NO_VALUE_FILTER_OPERATORS,
  NUMBER_FILTER_OPERATORS,
  STRING_FILTER_OPERATORS,
} from "@/constants/dataGrid";

import { useRouter } from "@/i18n/navigation";

import { NavigateNext } from "@mui/icons-material";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import { SparkLineChart } from "@mui/x-charts/SparkLineChart";
import type {
  GridColDef,
  GridFilterInputValueProps,
  GridFilterModel,
  GridFilterOperator,
  GridPaginationModel,
  GridRenderCellParams,
  GridSortModel,
  GridValidRowModel,
} from "@mui/x-data-grid";
import {
  GridFilterInputMultipleSingleSelect,
  GridFilterInputMultipleValue,
  GridFilterInputSingleSelect,
  GridFilterInputValue,
  useGridApiRef,
} from "@mui/x-data-grid";

import { orderResponseDtoOrderStatusValues } from "@/types/api";
import type { OrderResponse, OrderStatus } from "@/types/orders";

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
    usersTrend: Trend | null;
    organizationsTrend: Trend;
  };
  recentOrders: OrderResponse[];
}

const TREND_NEUTRAL_THRESHOLD = 5;

const STATUS_COLORS: Record<
  OrderStatus,
  "default" | "error" | "info" | "success" | "warning"
> = {
  OrderCancelled: "default",
  OrderDelivered: "success",
  OrderPaymentDue: "warning",
  OrderPickupAvailable: "success",
  OrderProcessing: "info",
  OrderProblem: "error",
};

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

  const locale = useLocale();

  const format = useFormatter();

  const router = useRouter();

  const theme = useTheme();

  const tOrders = useTranslations("orders");

  const tDashboard = useTranslations("dashboard");

  const tToolbar = useTranslations("dataGrid.toolbar");

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
    () => {
      const filterItem = filterModel.items[0];
      const quickFilterValue = (filterModel.quickFilterValues || [])
        .join(" ")
        .trim();
      const isNoValueOperator =
        !!filterItem?.operator &&
        NO_VALUE_FILTER_OPERATORS.includes(filterItem.operator);
      const filterValueString = Array.isArray(filterItem?.value)
        ? filterItem.value.join(",")
        : filterItem?.value;
      const hasFilterValue = Array.isArray(filterItem?.value)
        ? filterItem.value.length > 0
        : !!filterItem?.value;

      return fetcher<{ data: OrderResponse[]; total: number }>(
        `/api/organizations/${organizationSlug}/orders?${new URLSearchParams({
          limit: String(paginationModel.pageSize),
          offset: String(paginationModel.page * paginationModel.pageSize),
          ...(filterItem?.field &&
            filterItem?.operator &&
            (hasFilterValue || isNoValueOperator) && {
              filterField: filterItem.field,
              filterOperator: filterItem.operator,
              ...(filterValueString && { filterValue: filterValueString }),
            }),
          ...(quickFilterValue && { quickFilterValue }),
          ...(sortModel[0]?.field && { sortBy: sortModel[0].field }),
          ...(sortModel[0]?.sort && { sortDirection: sortModel[0].sort }),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        })}`,
      );
    },
    {
      fallbackData: { data: recentOrders, total: stats.totalOrders },
      onSuccess: () => {
        setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
      },
    },
  );

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
        year: "numeric",
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
    {
      label: tDashboard("stats.totalOrganizations"),
      value: stats.totalOrganizations,
      href: "/organizations",
      trend: stats.organizationsTrend,
    },
  ];

  const stringFilterOperators = useMemo<GridFilterOperator[]>(
    () =>
      STRING_FILTER_OPERATORS.map((value) => ({
        getApplyFilterFn: () => null,
        ...(NO_VALUE_FILTER_OPERATORS.includes(value)
          ? { InputComponent: undefined }
          : value === "isAnyOf"
            ? { InputComponent: GridFilterInputMultipleValue }
            : { InputComponent: GridFilterInputValue }),
        label: tToolbar(`filter.operator.${value}`),
        value,
      })),
    [tToolbar],
  );

  const enumFilterOperators = useMemo<GridFilterOperator[]>(
    () =>
      ENUM_FILTER_OPERATORS.map((value) => ({
        getApplyFilterFn: () => null,
        InputComponent:
          value === "isAnyOf"
            ? GridFilterInputMultipleSingleSelect
            : GridFilterInputSingleSelect,
        label: tToolbar(`filter.operator.${value}`),
        value,
      })),
    [tToolbar],
  );

  const dateFilterOperators = useMemo<GridFilterOperator[]>(
    () =>
      DATE_FILTER_OPERATORS.map((value) => ({
        getApplyFilterFn: () => null,
        ...(NO_VALUE_FILTER_OPERATORS.includes(value)
          ? { InputComponent: undefined }
          : { InputComponent: DateFilterInputValue }),
        label: tToolbar(`filter.operator.${value}`),
        value,
      })),
    [tToolbar],
  );

  const numberFilterOperators = useMemo<
    GridFilterOperator<
      GridValidRowModel,
      number | string | null,
      number | string | null,
      GridFilterInputValueProps & { type?: "number" }
    >[]
  >(
    () =>
      NUMBER_FILTER_OPERATORS.map((value) =>
        value === "isEmpty" || value === "isNotEmpty" || value === "isAnyOf"
          ? {
              getApplyFilterFn: () => null,
              ...(value === "isAnyOf"
                ? {
                    InputComponent: GridFilterInputMultipleValue,
                    InputComponentProps: { type: "number" as const },
                  }
                : { InputComponent: undefined }),
              label: tToolbar(`filter.operator.${value}`),
              value,
            }
          : {
              getApplyFilterFn: () => null,
              InputComponent: GridFilterInputValue,
              InputComponentProps: { type: "number" as const },
              label: value,
              value,
            },
      ),
    [tToolbar],
  );

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
        {statCards.map(({ label, value, href, trend }) => {
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
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      {label}
                    </Typography>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="h4">
                        {value.toLocaleString()}
                      </Typography>
                      <Chip
                        size="small"
                        color={chipColor}
                        label={`${trend.percent > 0 ? "+" : ""}${trend.percent}%`}
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {tDashboard("stats.period")}
                    </Typography>
                    <Box sx={{ width: "100%", height: 50 }}>
                      <SparkLineChart
                        data={trend.data}
                        area
                        showHighlight
                        showTooltip
                        color={trendColor}
                        xAxis={{ data: trendDayLabels, scaleType: "band" }}
                      />
                    </Box>
                  </CardContent>
                </StyledCardActionArea>
              </StyledCard>
            </Grid>
          );
        })}
      </Grid>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography color="text.primary" variant="h6">
          {tDashboard("stats.details")}
        </Typography>
        <Chip
          label={tDashboard("quickActions.viewOrders")}
          icon={<NavigateNext />}
          onClick={() => router.push(ordersHref)}
          variant="outlined"
          size="small"
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
