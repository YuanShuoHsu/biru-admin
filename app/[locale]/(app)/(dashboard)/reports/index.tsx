"use client";

import dayjs, { type Dayjs } from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useMemo, useState } from "react";
import useSWR from "swr";

import DataGrid from "@/components/DataGrid";

import { DATA_GRID_PROPS } from "@/constants/dataGrid";
import { STORE_TIMEZONE } from "@/constants/timezone";

import { useFormatMoney } from "@/hooks/useFormatMoney";

import { Download } from "@mui/icons-material";
import {
  Button,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { salesReportGroupByValues } from "@/types/api";
import type { ApiOrderMode } from "@/types/orderMode";
import type { OrderPaymentMethod } from "@/types/orders";
import type { Organization } from "@/types/organizations";
import type {
  InventoryReportResponse,
  InventoryReportRow,
  SalesReportGroupBy,
  SalesReportResponse,
  SalesReportRow,
} from "@/types/reports";

import { getExportDateRange, getExportFileName } from "@/utils/dataGrid";
import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";
import { localize } from "@/utils/locale";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const MAX_RANGE_DAYS = 366;

const UNCATEGORIZED_KEY = "uncategorized";

const ToolbarStack = styled(Stack)(({ theme }) => ({
  alignItems: "center",
  flexWrap: "wrap",
  gap: theme.spacing(2),
}));

const TotalsStack = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  columnGap: theme.spacing(3),
  rowGap: theme.spacing(0.5),
}));

const GroupByTextField = styled(TextField)({
  minWidth: 160,
});

type ReportTab = "inventory" | "sales";

const MONEY_FIELDS = ["revenue", "discount", "refunded", "net"] as const;

const INVENTORY_FIELDS = [
  "opening",
  "received",
  "consumed",
  "adjusted",
  "closing",
  "theoreticalConsumption",
  "actualConsumption",
  "variance",
] as const;

interface ReportsProps {
  canViewInventory?: boolean;
  canViewSales?: boolean;
  loading?: boolean;
  organization?: Organization;
}

const Reports = ({
  canViewInventory = false,
  canViewSales = false,
  loading = false,
  organization,
}: ReportsProps) => {
  const organizationSlug = organization?.slug ?? "";
  const currency = organization?.currency ?? "";

  const [tab, setTab] = useState<ReportTab>(
    canViewSales || loading ? "sales" : "inventory",
  );
  const [startDate, setStartDate] = useState<Dayjs>(() =>
    dayjs().tz(STORE_TIMEZONE).startOf("month"),
  );
  const [endDate, setEndDate] = useState<Dayjs>(() =>
    dayjs().tz(STORE_TIMEZONE).startOf("day"),
  );
  const [groupBy, setGroupBy] = useState<SalesReportGroupBy>("day");
  const [exporting, setExporting] = useState(false);

  const format = useFormatter();

  const formatMoney = useFormatMoney();

  const locale = useLocale();

  const tInventory = useTranslations("inventory");
  const tMenus = useTranslations("menus");
  const tOrder = useTranslations("order");
  const tReports = useTranslations("reports");

  const reportPath = `/api/organizations/${organizationSlug}/reports/${tab}`;

  const query = new URLSearchParams({
    since: startDate.startOf("day").format(),
    until: endDate.add(1, "day").startOf("day").format(),
    ...(tab === "sales" && { groupBy }),
  }).toString();

  const { data: sales, isValidating: isValidatingSales } = useSWR(
    !loading && canViewSales && tab === "sales"
      ? `${reportPath}?${query}`
      : null,
    (url: string) => fetcher<SalesReportResponse>(url),
    { keepPreviousData: true },
  );

  const { data: inventory, isValidating: isValidatingInventory } = useSWR(
    !loading && canViewInventory && tab === "inventory"
      ? `${reportPath}?${query}`
      : null,
    (url: string) => fetcher<InventoryReportResponse>(url),
    { keepPreviousData: true },
  );

  const handleStartDateChange = (value: Dayjs | null) => {
    if (!value?.isValid()) return;

    setStartDate(value);

    if (
      endDate.isBefore(value, "day") ||
      endDate.diff(value, "day") >= MAX_RANGE_DAYS
    )
      setEndDate(value);
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      const response = await fetch(`${reportPath}/export.csv?${query}`, {
        headers: { "Accept-Language": locale },
      });

      if (!response.ok) throw new Error((await response.json()).message);

      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${getExportFileName(
        organization?.name,
        tReports("label"),
        tReports(`tabs.${tab}`),
        getExportDateRange([
          startDate.format("YYYY-MM-DD"),
          endDate.format("YYYY-MM-DD"),
        ]),
      )}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
    } finally {
      setExporting(false);
    }
  };

  const shownGroupBy = sales?.groupBy ?? groupBy;

  const salesColumns = useMemo<GridColDef[]>(() => {
    const isItemGroupBy =
      shownGroupBy === "menuItem" || shownGroupBy === "category";

    const groupLabel = ({ key, name }: SalesReportRow) => {
      switch (shownGroupBy) {
        case "day":
          return format.dateTime(
            dayjs.tz(key, STORE_TIMEZONE).toDate(),
            "date",
          );
        case "hour":
          return `${key.padStart(2, "0")}:00`;
        case "paymentMethod":
          return tOrder(`checkout.payment.${key as OrderPaymentMethod}`);
        case "mode":
          return tOrder(`mode.${key as ApiOrderMode}.label`);
        default:
          return key === UNCATEGORIZED_KEY
            ? tMenus("sections.unassigned")
            : localize(name, locale) || key;
      }
    };

    return [
      {
        field: "key",
        headerName: tReports(`groupBy.${shownGroupBy}`),
        valueGetter: (value: string, row: SalesReportRow) =>
          shownGroupBy === "hour"
            ? Number(value)
            : shownGroupBy === "day"
              ? value
              : groupLabel(row),
        valueFormatter: (_value, row: SalesReportRow) => groupLabel(row),
      },
      {
        field: "orders",
        headerName: tReports("sales.orders"),
        type: "number",
      },
      ...(isItemGroupBy
        ? (["quantity", "refundedQuantity"] as const).map((field) => ({
            field,
            headerName: tReports(`sales.${field}`),
            type: "number" as const,
          }))
        : []),
      ...MONEY_FIELDS.map((field) => ({
        field,
        headerName: tReports(`sales.${field}`),
        type: "number" as const,
        valueFormatter: (value: number) => formatMoney(value, currency),
      })),
    ];
  }, [
    currency,
    format,
    formatMoney,
    locale,
    shownGroupBy,
    tMenus,
    tOrder,
    tReports,
  ]);

  const inventoryColumns = useMemo<GridColDef[]>(
    () => [
      {
        field: "name",
        headerName: tReports("inventory.ingredient"),
        valueGetter: (value: InventoryReportRow["name"]) =>
          localize(value, locale),
      },
      {
        field: "unitCode",
        headerName: tReports("inventory.unit"),
        valueFormatter: (value: InventoryReportRow["unitCode"]) =>
          tInventory(`units.${value}`),
      },
      ...INVENTORY_FIELDS.map((field) => ({
        field,
        headerName: tReports(`inventory.${field}`),
        type: "number" as const,
        valueGetter: (value: string) => Number(value),
        valueFormatter: (value: number) =>
          format.number(value, { maximumFractionDigits: 3 }),
      })),
    ],
    [format, locale, tInventory, tReports],
  );

  const isValidating =
    tab === "sales" ? isValidatingSales : isValidatingInventory;

  return (
    <>
      <Tabs
        aria-label="report tabs"
        onChange={(_, value: ReportTab) => setTab(value)}
        scrollButtons="auto"
        value={tab}
        variant="scrollable"
      >
        {(canViewSales || loading) && (
          <Tab label={tReports("tabs.sales")} value="sales" />
        )}
        {canViewInventory && (
          <Tab label={tReports("tabs.inventory")} value="inventory" />
        )}
      </Tabs>
      <ToolbarStack direction="row">
        <DatePicker
          disabled={loading}
          disableFuture
          label={tReports("since")}
          onChange={handleStartDateChange}
          timezone={STORE_TIMEZONE}
          value={startDate}
        />
        <DatePicker
          disabled={loading}
          disableFuture
          label={tReports("until")}
          maxDate={startDate.add(MAX_RANGE_DAYS - 1, "day")}
          minDate={startDate}
          onChange={(value) => value?.isValid() && setEndDate(value)}
          timezone={STORE_TIMEZONE}
          value={endDate}
        />
        {tab === "sales" && (
          <GroupByTextField
            disabled={loading}
            label={tReports("groupBy.label")}
            onChange={({ target }) =>
              setGroupBy(target.value as SalesReportGroupBy)
            }
            select
            value={groupBy}
          >
            {salesReportGroupByValues.map((value) => (
              <MenuItem key={value} value={value}>
                {tReports(`groupBy.${value}`)}
              </MenuItem>
            ))}
          </GroupByTextField>
        )}
        <Button
          disabled={loading}
          loading={exporting}
          onClick={handleExport}
          startIcon={<Download />}
          variant="contained"
        >
          {tReports("export")}
        </Button>
      </ToolbarStack>
      {tab === "sales" && sales && (
        <TotalsStack direction="row">
          <Typography variant="subtitle2">{tReports("sales.total")}</Typography>
          <Typography variant="body2">
            {tReports("sales.orders")} {format.number(sales.totals.orders)}
          </Typography>
          {MONEY_FIELDS.map((field) => (
            <Typography key={field} variant="body2">
              {tReports(`sales.${field}`)}{" "}
              {formatMoney(sales.totals[field], currency)}
            </Typography>
          ))}
        </TotalsStack>
      )}
      {tab === "sales" ? (
        <DataGrid
          {...DATA_GRID_PROPS}
          columns={salesColumns}
          getRowId={({ key }) => key}
          key={shownGroupBy}
          loading={loading || isValidating}
          rows={sales?.rows ?? []}
        />
      ) : (
        <DataGrid
          {...DATA_GRID_PROPS}
          columns={inventoryColumns}
          getRowId={({ ingredientId }) => ingredientId}
          loading={loading || isValidating}
          rows={inventory?.rows ?? []}
        />
      )}
    </>
  );
};

export default Reports;
