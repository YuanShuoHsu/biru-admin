import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import {
  DATE_FILTER_OPERATORS,
  ENUM_FILTER_OPERATORS,
  NUMBER_FILTER_OPERATORS,
  STRING_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import { STORE_TIMEZONE } from "@/constants/timezone";

import type { GridColType } from "@mui/x-data-grid";

import {
  breakEvenItemFilterFieldValues,
  breakEvenItemSortFieldValues,
  inventoryReportFilterFieldValues,
  inventoryReportSortFieldValues,
  personnelCostReportFilterFieldValues,
  personnelCostReportSortFieldValues,
  salesReportFilterFieldValues,
  salesReportGroupByValues,
  salesReportSortFieldValues,
} from "@/types/api";
import type { FilterOperator } from "@/types/dataGrid";
import type { SalesReportGroupBy } from "@/types/reports";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

export const MAX_RANGE_DAYS = 366;

export const DATE_FORMAT = "YYYY-MM-DD";

export const MONTH_FORMAT = "YYYY-MM";

export const REPORT_TABS = [
  "sales",
  "inventory",
  "personnel",
  "breakEven",
] as const;

export type ReportTab = (typeof REPORT_TABS)[number];

export const REPORT_GRID_FIELDS: Record<
  ReportTab,
  { filterFields: readonly string[]; sortFields: readonly string[] }
> = {
  breakEven: {
    filterFields: breakEvenItemFilterFieldValues,
    sortFields: breakEvenItemSortFieldValues,
  },
  inventory: {
    filterFields: inventoryReportFilterFieldValues,
    sortFields: inventoryReportSortFieldValues,
  },
  personnel: {
    filterFields: personnelCostReportFilterFieldValues,
    sortFields: personnelCostReportSortFieldValues,
  },
  sales: {
    filterFields: salesReportFilterFieldValues,
    sortFields: salesReportSortFieldValues,
  },
};

export const RESET_GRID_QUERY = {
  filterField: "",
  filterOperator: "",
  filterValue: "",
  page: "1",
  quickFilterValue: "",
  sortBy: "",
  sortDirection: "",
};

export const PERSONNEL_MONEY_FIELDS = [
  "grossCents",
  "employerInsuranceCents",
  "employerPensionCents",
  "totalCents",
] as const;

export interface ReportView {
  groupBy: SalesReportGroupBy;
  month: string;
  since: string;
  tab: ReportTab;
  targetProfit: string;
  until: string;
}

export const toStoreDate = (date: string) => dayjs.tz(date, STORE_TIMEZONE);

export const storeToday = () => dayjs().tz(STORE_TIMEZONE).startOf("day");

export const isStoreDate = (value: string | undefined): value is string =>
  !!value &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  toStoreDate(value).format(DATE_FORMAT) === value;

export const isReportMonth = (value: string | undefined): value is string =>
  !!value &&
  /^20\d{2}-(0[1-9]|1[0-2])$/.test(value) &&
  !toStoreDate(`${value}-01`).isAfter(storeToday(), "month");

const isTargetProfit = (value: string | undefined): value is string =>
  !!value && /^\d{1,10}(\.\d{1,2})?$/.test(value);

export const isItemGroupBy = (groupBy: SalesReportGroupBy) =>
  groupBy === "menuItem" || groupBy === "category";

export const SALES_MONEY_FIELDS = [
  "revenue",
  "discount",
  "refunded",
  "net",
] as const;

export const SALES_ITEM_FIELDS = ["quantity", "refundedQuantity"] as const;

export const SALES_GROUP_COLUMN_TYPES = {
  category: "string",
  day: "date",
  hour: "number",
  menuItem: "string",
  mode: "singleSelect",
  paymentMethod: "singleSelect",
} as const satisfies Record<SalesReportGroupBy, GridColType>;

const SALES_GROUP_FILTER_OPERATORS: Record<
  (typeof SALES_GROUP_COLUMN_TYPES)[SalesReportGroupBy],
  readonly FilterOperator[]
> = {
  date: DATE_FILTER_OPERATORS,
  number: NUMBER_FILTER_OPERATORS,
  singleSelect: ENUM_FILTER_OPERATORS,
  string: STRING_FILTER_OPERATORS,
};

export const getSalesGroupField = (groupBy: SalesReportGroupBy) =>
  isItemGroupBy(groupBy) ? "name" : "key";

export const getSalesFilterOperators = (
  groupBy: SalesReportGroupBy,
  filterField: string | undefined,
): readonly FilterOperator[] => {
  if (filterField === getSalesGroupField(groupBy))
    return SALES_GROUP_FILTER_OPERATORS[SALES_GROUP_COLUMN_TYPES[groupBy]];

  const numberFields: readonly string[] = [
    "orders",
    ...SALES_MONEY_FIELDS,
    ...(isItemGroupBy(groupBy) ? SALES_ITEM_FIELDS : []),
  ];

  return filterField && numberFields.includes(filterField)
    ? NUMBER_FILTER_OPERATORS
    : [];
};

export const isValidRange = (since: string, until: string) => {
  const start = toStoreDate(since);
  const end = toStoreDate(until);

  return (
    !end.isBefore(start, "day") &&
    end.diff(start, "day") < MAX_RANGE_DAYS &&
    !end.isAfter(storeToday(), "day")
  );
};

export const resolveReportView = (
  {
    groupBy,
    month,
    since,
    tab,
    targetProfit,
    until,
  }: {
    groupBy?: string;
    month?: string;
    since?: string;
    tab?: string;
    targetProfit?: string;
    until?: string;
  },
  tabs: readonly ReportTab[],
): ReportView => {
  const today = storeToday();
  const hasRange =
    isStoreDate(since) && isStoreDate(until) && isValidRange(since, until);
  const resolvedTab = tabs.find((value) => value === tab) ?? tabs[0];

  return {
    groupBy:
      salesReportGroupByValues.find((value) => value === groupBy) ?? "day",
    month: isReportMonth(month)
      ? month
      : (resolvedTab === "breakEven"
          ? today
          : today.subtract(1, "month")
        ).format(MONTH_FORMAT),
    since: hasRange ? since : today.startOf("month").format(DATE_FORMAT),
    tab: resolvedTab,
    targetProfit: isTargetProfit(targetProfit) ? targetProfit : "",
    until: hasRange ? until : today.format(DATE_FORMAT),
  };
};

export const getReportQuery = ({
  groupBy,
  month,
  since,
  tab,
  targetProfit,
  until,
}: ReportView) =>
  new URLSearchParams(
    tab === "personnel"
      ? { month }
      : tab === "breakEven"
        ? { month, ...(targetProfit && { targetProfit }) }
        : {
            since: toStoreDate(since).format(),
            until: toStoreDate(until).add(1, "day").format(),
            ...(tab === "sales" && { groupBy }),
          },
  ).toString();

const REPORT_PATHS: Record<ReportTab, string> = {
  breakEven: "break-even",
  inventory: "inventory",
  personnel: "personnel",
  sales: "sales",
};

export const getReportPath = (organizationSlug: string, tab: ReportTab) =>
  `/api/organizations/${organizationSlug}/reports/${REPORT_PATHS[tab]}`;

const scaleFilterValue = (
  filterValue: string,
  scale: (value: number) => number,
) =>
  filterValue
    .split(",")
    .map((value) =>
      value && Number.isFinite(Number(value))
        ? String(scale(Number(value)))
        : value,
    )
    .join(",");

export const toReportGridQuery = (tab: ReportTab, params: URLSearchParams) => {
  const filterField = params.get("filterField");
  const filterValue = params.get("filterValue");

  if (
    tab === "personnel" &&
    filterValue &&
    PERSONNEL_MONEY_FIELDS.some((field) => field === filterField)
  )
    params.set(
      "filterValue",
      scaleFilterValue(filterValue, (value) => Math.round(value * 100)),
    );

  if (tab === "breakEven" && filterValue && filterField === "grossMarginRate")
    params.set(
      "filterValue",
      scaleFilterValue(filterValue, (value) => value / 100),
    );

  return params.toString();
};
