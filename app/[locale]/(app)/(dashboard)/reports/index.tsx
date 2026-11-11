"use client";

import dayjs, { type Dayjs } from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useMemo, useState } from "react";
import useSWR from "swr";

import {
  DATE_FORMAT,
  getReportPath,
  getReportQuery,
  isValidRange,
  MAX_RANGE_DAYS,
  MONTH_FORMAT,
  type ReportTab,
  type ReportView,
  toStoreDate,
} from "./definitions";

import DataGrid from "@/components/DataGrid";
import EmptyCell, { renderEmptyableCell } from "@/components/EmptyCell";
import ErrorAlert from "@/components/ErrorAlert";

import { DATA_GRID_PROPS } from "@/constants/dataGrid";
import { STORE_TIMEZONE } from "@/constants/timezone";

import { useFormatMoney } from "@/hooks/useFormatMoney";
import { useMonthFormat } from "@/hooks/useMonthFormat";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

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
import type { PickerChangeHandlerContext } from "@mui/x-date-pickers/models";

import { salesReportGroupByValues } from "@/types/api";
import type { ApiOrderMode } from "@/types/orderMode";
import type { OrderPaymentMethod } from "@/types/orders";
import type { Organization } from "@/types/organizations";
import type {
  InventoryReportResponse,
  InventoryReportRow,
  PersonnelCostReportResponse,
  PersonnelCostReportRow,
  SalesReportGroupBy,
  SalesReportResponse,
  SalesReportRow,
} from "@/types/reports";

import { fromCents } from "@/utils/attendance";
import { getExportDateRange, getExportFileName } from "@/utils/dataGrid";
import { getErrorMessage, toFetchError } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";
import { localize } from "@/utils/locale";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

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

const PERSONNEL_MONEY_FIELDS = [
  "grossCents",
  "employerInsuranceCents",
  "employerPensionCents",
  "totalCents",
] as const;

const PERSONNEL_MONEY_LABELS = {
  employerInsuranceCents: "employerInsurance",
  employerPensionCents: "employerPension",
  grossCents: "gross",
  totalCents: "total",
} as const;

const REPORT_DATA_GRID_PROPS = {
  ...DATA_GRID_PROPS,
  slotProps: {
    ...DATA_GRID_PROPS.slotProps,
    toolbar: { disableExport: true },
  },
};

interface ReportsProps {
  canViewInventory: boolean;
  canViewPersonnel: boolean;
  canViewSales: boolean;
  inventory?: InventoryReportResponse;
  loading?: boolean;
  organization: Organization;
  personnel?: PersonnelCostReportResponse;
  sales?: SalesReportResponse;
  view: ReportView;
}

const Reports = ({
  canViewInventory,
  canViewPersonnel,
  canViewSales,
  inventory: initialInventory,
  loading = false,
  organization,
  personnel: initialPersonnel,
  sales: initialSales,
  view: initialView,
}: ReportsProps) => {
  const currency = organization.currency ?? "";

  const [view, setView] = useState<ReportView>(initialView);
  const [exporting, setExporting] = useState(false);

  const { groupBy, month, since, tab, until } = view;

  const format = useFormatter();

  const formatMoney = useFormatMoney();

  const locale = useLocale();

  const monthFormat = useMonthFormat();

  const tAttendance = useTranslations("attendance");
  const tCommon = useTranslations("common");
  const tInventory = useTranslations("inventory");
  const tMenus = useTranslations("menus");
  const tOrder = useTranslations("order");
  const tReports = useTranslations("reports");

  const updateQuery = useUpdateQuery();

  const reportPath = getReportPath(organization.slug, tab);
  const query = getReportQuery(view);

  const {
    data: sales,
    error: salesError,
    isValidating: isValidatingSales,
    mutate: mutateSales,
  } = useSWR(
    !loading && tab === "sales" ? `${reportPath}?${query}` : null,
    (url: string) => fetcher<SalesReportResponse>(url),
    { fallbackData: initialSales, keepPreviousData: true },
  );

  const {
    data: inventory,
    error: inventoryError,
    isValidating: isValidatingInventory,
    mutate: mutateInventory,
  } = useSWR(
    !loading && tab === "inventory" ? `${reportPath}?${query}` : null,
    (url: string) => fetcher<InventoryReportResponse>(url),
    { fallbackData: initialInventory, keepPreviousData: true },
  );

  const {
    data: personnel,
    error: personnelError,
    isValidating: isValidatingPersonnel,
    mutate: mutatePersonnel,
  } = useSWR(
    !loading && tab === "personnel" ? `${reportPath}?${query}` : null,
    (url: string) => fetcher<PersonnelCostReportResponse>(url),
    { fallbackData: initialPersonnel, keepPreviousData: true },
  );

  const updateView = (changes: Partial<ReportView>) => {
    setView((previous) => ({ ...previous, ...changes }));
    updateQuery(changes);
  };

  const handleSinceChange = (
    value: Dayjs | null,
    { validationError }: PickerChangeHandlerContext<unknown>,
  ) => {
    if (validationError || !value?.isValid()) return;

    const nextSince = value.format(DATE_FORMAT);

    updateView({
      since: nextSince,
      ...(!isValidRange(nextSince, until) && { until: nextSince }),
    });
  };

  const handleUntilChange = (
    value: Dayjs | null,
    { validationError }: PickerChangeHandlerContext<unknown>,
  ) => {
    if (validationError || !value?.isValid()) return;

    updateView({ until: value.format(DATE_FORMAT) });
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      const response = await fetch(`${reportPath}/export.csv?${query}`, {
        headers: { "Accept-Language": locale },
      });

      if (!response.ok) {
        const { message } = response.headers
          .get("content-type")
          ?.includes("application/json")
          ? await response.json().catch(() => ({}))
          : {};

        throw toFetchError({
          message: message || tCommon("error.title"),
          status: response.status,
        });
      }

      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${getExportFileName(
        organization.name,
        tReports("label"),
        tReports(`tabs.${tab}`),
        tab === "personnel" ? month : getExportDateRange([since, until]),
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
        type: shownGroupBy === "hour" ? "number" : "string",
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

  const personnelColumns = useMemo<GridColDef[]>(
    () => [
      {
        field: "jobTitle",
        headerName: tAttendance("jobTitle"),
        valueGetter: (value: PersonnelCostReportRow["jobTitle"]) =>
          value ?? tReports("personnel.noJobTitle"),
      },
      {
        field: "headcount",
        headerName: tReports("personnel.headcount"),
        type: "number",
      },
      ...PERSONNEL_MONEY_FIELDS.map((field) => ({
        field,
        headerName: tReports(`personnel.${PERSONNEL_MONEY_LABELS[field]}`),
        type: "number" as const,
        renderCell: renderEmptyableCell,
        valueGetter: (value: string | null) =>
          value === null ? null : fromCents(value),
        valueFormatter: (value: number | null) =>
          value === null ? "" : formatMoney(value, currency),
      })),
    ],
    [currency, formatMoney, tAttendance, tReports],
  );

  const isSales = tab === "sales";
  const isPersonnel = tab === "personnel";
  const error = {
    inventory: inventoryError,
    personnel: personnelError,
    sales: salesError,
  }[tab];
  const isValidating = {
    inventory: isValidatingInventory,
    personnel: isValidatingPersonnel,
    sales: isValidatingSales,
  }[tab];
  const retry = {
    inventory: mutateInventory,
    personnel: mutatePersonnel,
    sales: mutateSales,
  }[tab];
  const startDate = toStoreDate(since);

  return (
    <>
      <Tabs
        aria-label="report tabs"
        onChange={(_, value: ReportTab) => updateView({ tab: value })}
        scrollButtons="auto"
        value={tab}
        variant="scrollable"
      >
        {canViewSales && <Tab label={tReports("tabs.sales")} value="sales" />}
        {canViewInventory && (
          <Tab label={tReports("tabs.inventory")} value="inventory" />
        )}
        {canViewPersonnel && (
          <Tab label={tReports("tabs.personnel")} value="personnel" />
        )}
      </Tabs>
      <ToolbarStack direction="row">
        {isPersonnel ? (
          <DatePicker
            disabled={loading}
            disableFuture
            format={monthFormat}
            label={tReports("personnel.month")}
            minDate={toStoreDate("2000-01-01")}
            onChange={(value, { validationError }) => {
              if (!validationError && value?.isValid())
                updateView({ month: value.format(MONTH_FORMAT) });
            }}
            timezone={STORE_TIMEZONE}
            value={toStoreDate(`${month}-01`)}
            views={["year", "month"]}
          />
        ) : (
          <>
            <DatePicker
              disabled={loading}
              disableFuture
              label={tReports("since")}
              onChange={handleSinceChange}
              timezone={STORE_TIMEZONE}
              value={startDate}
            />
            <DatePicker
              disabled={loading}
              disableFuture
              label={tReports("until")}
              maxDate={startDate.add(MAX_RANGE_DAYS - 1, "day")}
              minDate={startDate}
              onChange={handleUntilChange}
              timezone={STORE_TIMEZONE}
              value={toStoreDate(until)}
            />
          </>
        )}
        {isSales && (
          <GroupByTextField
            disabled={loading}
            label={tReports("groupBy.label")}
            onChange={({ target }) =>
              updateView({ groupBy: target.value as SalesReportGroupBy })
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
      {error ? (
        <ErrorAlert onRetry={() => retry()} />
      ) : isSales ? (
        <>
          {sales && (
            <TotalsStack direction="row">
              <Typography variant="subtitle2">
                {tReports("sales.total")}
              </Typography>
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
          <DataGrid
            {...REPORT_DATA_GRID_PROPS}
            columns={salesColumns}
            getRowId={({ key }) => key}
            key={shownGroupBy}
            loading={loading || isValidating}
            rows={sales?.rows ?? []}
          />
        </>
      ) : isPersonnel ? (
        <>
          {personnel && (
            <>
              <TotalsStack direction="row">
                <Typography variant="subtitle2">
                  {tReports("sales.total")}
                </Typography>
                <Typography variant="body2">
                  {tReports("personnel.headcount")}{" "}
                  {format.number(personnel.totals.headcount)}
                </Typography>
                {PERSONNEL_MONEY_FIELDS.map((field) => (
                  <Typography key={field} variant="body2">
                    {tReports(`personnel.${PERSONNEL_MONEY_LABELS[field]}`)}{" "}
                    {personnel.totals[field] === null ? (
                      <EmptyCell />
                    ) : (
                      formatMoney(fromCents(personnel.totals[field]), currency)
                    )}
                  </Typography>
                ))}
              </TotalsStack>
              {personnel.totals.missingEmployerInsurance > 0 && (
                <Typography color="textSecondary" variant="body2">
                  {tReports("personnel.missingEmployerInsurance", {
                    count: personnel.totals.missingEmployerInsurance,
                  })}
                </Typography>
              )}
              {personnel.unpublishedEmployees > 0 && (
                <Typography color="textSecondary" variant="body2">
                  {tReports("personnel.unpublished", {
                    count: personnel.unpublishedEmployees,
                  })}
                </Typography>
              )}
            </>
          )}
          <DataGrid
            {...REPORT_DATA_GRID_PROPS}
            columns={personnelColumns}
            getRowId={({ jobTitle }) => jobTitle ?? ""}
            loading={loading || isValidating}
            rows={personnel?.rows ?? []}
          />
        </>
      ) : (
        <DataGrid
          {...REPORT_DATA_GRID_PROPS}
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
