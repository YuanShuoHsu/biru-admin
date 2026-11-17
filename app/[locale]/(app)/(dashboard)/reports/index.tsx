"use client";

import dayjs, { type Dayjs } from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
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
  PERSONNEL_MONEY_FIELDS,
  RESET_GRID_QUERY,
  type ReportTab,
  type ReportView,
  toReportGridQuery,
  toStoreDate,
} from "./definitions";

import DataGrid from "@/components/DataGrid";
import EmptyCell, { renderEmptyableCell } from "@/components/EmptyCell";
import ErrorAlert from "@/components/ErrorAlert";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";
import { DEFAULT_PAGE_SIZE, getPageSizeOptions } from "@/constants/pagination";
import { STORE_TIMEZONE } from "@/constants/timezone";

import { useDataGridQueryState } from "@/hooks/useDataGridQueryState";
import {
  useEnumFilterOperators,
  useNumberFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
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
import { type GridColDef, useGridApiRef } from "@mui/x-data-grid";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import type { PickerChangeHandlerContext } from "@mui/x-date-pickers/models";

import { salesReportGroupByValues } from "@/types/api";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
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
import {
  getDataGridSearchParams,
  getExportDateRange,
  getExportFileName,
} from "@/utils/dataGrid";
import { getIngredientEnumOptions } from "@/utils/enumOptions";
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
  "wasted",
  "adjusted",
  "closing",
  "theoreticalConsumption",
  "actualConsumption",
  "variance",
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

interface ReportGridState {
  filterField?: string;
  filterOperator?: FilterOperator;
  filterValue?: string;
  inventory?: InventoryReportResponse;
  page: number;
  pageSize: number;
  personnel?: PersonnelCostReportResponse;
  quickFilterValue?: string;
  sales?: SalesReportResponse;
  sortBy?: string;
  sortDirection?: SortDirection;
}

interface ReportTableProps extends ReportGridState {
  canViewWastedCost: boolean;
  loading: boolean;
  organization: Organization;
  view: ReportView;
}

const ReportTable = ({
  canViewWastedCost,
  filterField,
  filterOperator,
  filterValue,
  inventory: initialInventory,
  loading,
  organization,
  page,
  pageSize,
  personnel: initialPersonnel,
  quickFilterValue,
  sales: initialSales,
  sortBy,
  sortDirection,
  view,
}: ReportTableProps) => {
  const currency = organization.currency ?? "";

  const { groupBy, tab } = view;

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
    quickFilterValue,
    sortBy,
    sortDirection,
  });

  const apiRef = useGridApiRef();

  const enumFilterOperators = useEnumFilterOperators();
  const numberFilterOperators = useNumberFilterOperators();
  const stringFilterOperators = useStringFilterOperators();

  const format = useFormatter();

  const formatMoney = useFormatMoney();

  const locale = useLocale();

  const tAttendance = useTranslations("attendance");
  const tInventory = useTranslations("inventory");
  const tMenus = useTranslations("menus");
  const tOrder = useTranslations("order");
  const tReports = useTranslations("reports");

  const enumOptions = useMemo(
    () => getIngredientEnumOptions(tInventory),
    [tInventory],
  );

  const reportUrl = `${getReportPath(organization.slug, tab)}?${getReportQuery(view)}&${toReportGridQuery(
    tab,
    getDataGridSearchParams(
      paginationModel,
      filterModel,
      sortModel,
      tab === "inventory" ? enumOptions : undefined,
    ),
  )}`;

  const swrOptions = {
    keepPreviousData: true,
    onSuccess: () => {
      setTimeout(() => {
        apiRef.current?.autosizeColumns(autosizeOptions);
      }, 0);
    },
  };

  const {
    data: sales,
    error: salesError,
    isValidating: isValidatingSales,
    mutate: mutateSales,
  } = useSWR(
    !loading && tab === "sales" ? reportUrl : null,
    (url: string) => fetcher<SalesReportResponse>(url),
    { ...swrOptions, fallbackData: initialSales },
  );

  const {
    data: inventory,
    error: inventoryError,
    isValidating: isValidatingInventory,
    mutate: mutateInventory,
  } = useSWR(
    !loading && tab === "inventory" ? reportUrl : null,
    (url: string) => fetcher<InventoryReportResponse>(url),
    { ...swrOptions, fallbackData: initialInventory },
  );

  const {
    data: personnel,
    error: personnelError,
    isValidating: isValidatingPersonnel,
    mutate: mutatePersonnel,
  } = useSWR(
    !loading && tab === "personnel" ? reportUrl : null,
    (url: string) => fetcher<PersonnelCostReportResponse>(url),
    { ...swrOptions, fallbackData: initialPersonnel },
  );

  const salesColumns = useMemo<GridColDef[]>(() => {
    const isItemGroupBy = groupBy === "menuItem" || groupBy === "category";

    const groupLabel = ({ key, name }: SalesReportRow) => {
      switch (groupBy) {
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
        field: isItemGroupBy ? "name" : "key",
        filterable: groupBy !== "paymentMethod" && groupBy !== "mode",
        filterOperators: stringFilterOperators,
        headerName: tReports(`groupBy.${groupBy}`),
        type: groupBy === "hour" ? "number" : "string",
        valueGetter: (_value: unknown, row: SalesReportRow) =>
          groupBy === "hour"
            ? Number(row.key)
            : groupBy === "day"
              ? row.key
              : groupLabel(row),
        valueFormatter: (_value, row: SalesReportRow) => groupLabel(row),
      },
      {
        field: "orders",
        filterOperators: numberFilterOperators,
        headerName: tReports("sales.orders"),
        type: "number",
      },
      ...(isItemGroupBy
        ? (["quantity", "refundedQuantity"] as const).map((field) => ({
            field,
            filterOperators: numberFilterOperators,
            headerName: tReports(`sales.${field}`),
            type: "number" as const,
          }))
        : []),
      ...MONEY_FIELDS.map((field) => ({
        field,
        filterOperators: numberFilterOperators,
        headerName: tReports(`sales.${field}`),
        type: "number" as const,
        valueFormatter: (value: number) => formatMoney(value, currency),
      })),
    ];
  }, [
    currency,
    format,
    formatMoney,
    groupBy,
    locale,
    numberFilterOperators,
    stringFilterOperators,
    tMenus,
    tOrder,
    tReports,
  ]);

  const inventoryColumns = useMemo<GridColDef[]>(
    () => [
      {
        field: "name",
        filterOperators: stringFilterOperators,
        headerName: tReports("inventory.ingredient"),
        valueGetter: (value: InventoryReportRow["name"]) =>
          localize(value, locale),
      },
      {
        field: "unitCode",
        filterOperators: enumFilterOperators,
        headerName: tReports("inventory.unit"),
        type: "singleSelect",
        valueOptions: enumOptions.unitCode,
      },
      ...INVENTORY_FIELDS.flatMap((field) => [
        {
          field,
          filterOperators: numberFilterOperators,
          headerName: tReports(`inventory.${field}`),
          type: "number" as const,
          valueGetter: (value: string) => Number(value),
          valueFormatter: (value: number) =>
            format.number(value, { maximumFractionDigits: 3 }),
        },
        ...(field === "wasted" && canViewWastedCost
          ? [
              {
                field: "wastedCost",
                filterOperators: numberFilterOperators,
                headerName: tReports("inventory.wastedCost"),
                type: "number" as const,
                renderCell: renderEmptyableCell,
                valueGetter: (value: InventoryReportRow["wastedCost"]) =>
                  value == null ? null : Number(value),
                valueFormatter: (value: number | null) =>
                  value === null ? "" : formatMoney(value, currency),
              },
            ]
          : []),
      ]),
    ],
    [
      canViewWastedCost,
      currency,
      enumFilterOperators,
      enumOptions.unitCode,
      format,
      formatMoney,
      locale,
      numberFilterOperators,
      stringFilterOperators,
      tReports,
    ],
  );

  const personnelColumns = useMemo<GridColDef[]>(
    () => [
      {
        field: "jobTitle",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("jobTitle"),
        valueGetter: (value: PersonnelCostReportRow["jobTitle"]) =>
          value ?? tReports("personnel.noJobTitle"),
      },
      {
        field: "headcount",
        filterOperators: numberFilterOperators,
        headerName: tReports("personnel.headcount"),
        type: "number",
      },
      ...PERSONNEL_MONEY_FIELDS.map((field) => ({
        field,
        filterOperators: numberFilterOperators,
        headerName: tReports(`personnel.${PERSONNEL_MONEY_LABELS[field]}`),
        type: "number" as const,
        renderCell: renderEmptyableCell,
        valueGetter: (value: string | null) =>
          value === null ? null : fromCents(value),
        valueFormatter: (value: number | null) =>
          value === null ? "" : formatMoney(value, currency),
      })),
    ],
    [
      currency,
      formatMoney,
      numberFilterOperators,
      stringFilterOperators,
      tAttendance,
      tReports,
    ],
  );

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

  if (error) return <ErrorAlert onRetry={() => retry()} />;

  const gridProps = {
    ...REPORT_DATA_GRID_PROPS,
    apiRef,
    filterMode: "server" as const,
    filterModel,
    loading: loading || isValidating,
    onFilterModelChange: handleFilterModelChange,
    onPaginationModelChange: handlePaginationModelChange,
    onSortModelChange: handleSortModelChange,
    pageSizeOptions: getPageSizeOptions(paginationModel.pageSize),
    paginationMode: "server" as const,
    paginationModel,
    sortingMode: "server" as const,
    sortModel,
  };

  return tab === "sales" ? (
    <>
      {sales && (
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
      <DataGrid
        {...gridProps}
        columns={salesColumns}
        getRowId={({ key }) => key}
        rowCount={sales?.total ?? 0}
        rows={sales?.rows ?? []}
      />
    </>
  ) : tab === "personnel" ? (
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
        {...gridProps}
        columns={personnelColumns}
        getRowId={({ jobTitle }) => jobTitle ?? ""}
        rowCount={personnel?.total ?? 0}
        rows={personnel?.rows ?? []}
      />
    </>
  ) : (
    <>
      {!!inventory?.wasteByReason.length && (
        <TotalsStack direction="row">
          <Typography variant="subtitle2">
            {tReports("inventory.wasted")}
          </Typography>
          {inventory.wasteByReason.map(({ cost, occurrences, reason }) => (
            <Typography key={reason} variant="body2">
              {tInventory(`transactions.wasteReason.options.${reason}`)}{" "}
              {tReports("inventory.occurrences", { count: occurrences })}
              {cost !== undefined && (
                <>
                  {" "}
                  {tReports("inventory.wastedCost")}{" "}
                  {cost === null ? (
                    <EmptyCell />
                  ) : (
                    formatMoney(Number(cost), currency)
                  )}
                </>
              )}
            </Typography>
          ))}
        </TotalsStack>
      )}
      <DataGrid
        {...gridProps}
        columns={inventoryColumns}
        getRowId={({ ingredientId }) => ingredientId}
        rowCount={inventory?.total ?? 0}
        rows={inventory?.rows ?? []}
      />
    </>
  );
};

interface ReportsProps extends Partial<ReportGridState> {
  canViewInventory: boolean;
  canViewPersonnel: boolean;
  canViewSales: boolean;
  canViewWastedCost: boolean;
  loading?: boolean;
  organization: Organization;
  view: ReportView;
}

const Reports = ({
  canViewInventory,
  canViewPersonnel,
  canViewSales,
  canViewWastedCost,
  loading = false,
  organization,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  view: initialView,
  ...initialGrid
}: ReportsProps) => {
  const [view, setView] = useState<ReportView>(initialView);
  const [grid, setGrid] = useState<ReportGridState>({
    ...initialGrid,
    page,
    pageSize,
  });
  const [exporting, setExporting] = useState(false);

  const { groupBy, month, since, tab, until } = view;

  const locale = useLocale();

  const monthFormat = useMonthFormat();

  const searchParams = useSearchParams();

  const tCommon = useTranslations("common");
  const tReports = useTranslations("reports");

  const updateQuery = useUpdateQuery();

  const reportPath = getReportPath(organization.slug, tab);
  const query = getReportQuery(view);

  const updateView = (changes: Partial<ReportView>) => {
    setView((previous) => ({ ...previous, ...changes }));
    setGrid({
      page: 1,
      pageSize: Number(searchParams.get("pageSize")) || pageSize,
    });
    updateQuery({ ...changes, ...RESET_GRID_QUERY });
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

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_NEST_URL}${reportPath}/export.csv?${query}`,
        { credentials: "include", headers: { "Accept-Language": locale } },
      );

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

  const isSales = tab === "sales";
  const isPersonnel = tab === "personnel";
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
      <ReportTable
        {...grid}
        canViewWastedCost={canViewWastedCost}
        key={[tab, since, until, groupBy, month].join()}
        loading={loading}
        organization={organization}
        view={view}
      />
    </>
  );
};

export default Reports;
