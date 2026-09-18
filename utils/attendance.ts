import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { cache } from "react";

import { ATTENDANCE_NAV_GROUPS } from "@/constants/attendance";
import { NO_VALUE_FILTER_OPERATORS } from "@/constants/dataGrid";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from "@/constants/pagination";
import { PLATFORM_TIMEZONE, STORE_TIMEZONE } from "@/constants/timezone";

import { authClient } from "@/lib/auth-client";

import { attendanceErrorCodeValues, payrollBlockerValues } from "@/types/api";
import type {
  AttendanceContext,
  AttendanceEmployee,
  AttendanceEmployeeFilterField,
  AttendanceEmployeeSortField,
  AttendanceErrorCode,
  AttendanceLeaveBalance,
  AttendanceLeaveBalanceFilterField,
  AttendanceLeaveBalanceSortField,
  AttendanceLeaveCase,
  AttendanceLeaveCaseFilterField,
  AttendanceLeaveCaseSortField,
  AttendanceLeaveType,
  AttendanceLeaveTypeFilterField,
  AttendanceLeaveTypeSortField,
  AttendanceMember,
  AttendanceParentalChild,
  AttendanceParentalChildFilterField,
  AttendanceParentalChildSortField,
  AttendanceParentalReturn,
  AttendanceParentalReturnFilterField,
  AttendanceParentalReturnSortField,
  AttendanceRequest,
  AttendanceRequestFilterField,
  AttendanceRequestSortField,
  AttendanceSettings,
  AttendanceShift,
  AttendanceShiftFilterField,
  AttendanceShiftSortField,
  AttendanceTemplate,
  AttendanceTemplateFilterField,
  AttendanceTemplateSortField,
  PayrollBlocker,
  PayrollStatement,
  PayrollStatementFilterField,
  PayrollStatementSortField,
  PayrollTerms,
} from "@/types/attendance";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";

import { fetcher, type FetchError } from "@/utils/fetcher";
import { getResolvedAdminOrganization } from "@/utils/menus";
import { hasRolePermission } from "@/utils/organizations";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

export const weekdayDate = (day: number) =>
  dayjs().tz(PLATFORM_TIMEZONE).day(day).toDate();

export const WEEK_DAYS = 7;

// dayjs.tz 對無法解析的字串會丟 RangeError 而不是回傳 invalid，先擋掉格式不符的查詢字串
export const weekStart = (week?: string) =>
  (week && /^\d{4}-\d{2}-\d{2}$/.test(week)
    ? dayjs.tz(week, STORE_TIMEZONE)
    : dayjs().tz(STORE_TIMEZONE)
  )
    .startOf("week")
    .format("YYYY-MM-DD");

export const attendanceNavGroups = (
  memberRole: Parameters<typeof hasRolePermission>[0],
) =>
  ATTENDANCE_NAV_GROUPS.map(({ children, path }) => ({
    children: children
      .filter(
        ({ permission }) =>
          !permission || hasRolePermission(memberRole, permission),
      )
      .map(({ path }) => path),
    path,
  })).filter(({ children }) => children.length);

export const getAttendanceAccess = cache(
  async (organizationSlug: string | undefined, cookie: string) => {
    const organization = await getResolvedAdminOrganization(
      organizationSlug,
      cookie,
    );

    if (!organization) return null;

    const { data: memberRole } =
      await authClient.organization.getActiveMemberRole({
        query: { organizationId: organization.id },
        fetchOptions: { headers: { cookie } },
      });

    if (!memberRole?.role) return null;

    return { memberRole: memberRole.role, organization };
  },
);

type AttendanceScope = "all" | "me";

interface GridQuery<FilterField extends string, SortField extends string> {
  page?: number;
  pageSize?: number;
  filterField?: FilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  quickFilterEnums?: string[];
  quickFilterValue?: string;
  sortBy?: SortField;
  sortDirection?: SortDirection;
}

const getGridSearchParams = <
  FilterField extends string,
  SortField extends string,
>({
  page = DEFAULT_PAGE,
  pageSize = DEFAULT_PAGE_SIZE,
  filterField,
  filterOperator,
  filterValue,
  quickFilterEnums,
  quickFilterValue,
  sortBy,
  sortDirection,
}: GridQuery<FilterField, SortField>) => {
  const isNoValueOperator =
    filterOperator && NO_VALUE_FILTER_OPERATORS.includes(filterOperator);

  const params = new URLSearchParams({
    limit: String(pageSize),
    offset: String((page - 1) * pageSize),
    ...(sortBy && { sortBy }),
    ...(sortDirection && { sortDirection }),
    ...(filterField &&
      filterOperator &&
      (filterValue || isNoValueOperator) && {
        filterField,
        filterOperator,
        ...(filterValue && { filterValue }),
      }),
    ...(quickFilterValue && { quickFilterValue }),
  });

  for (const entry of quickFilterEnums || [])
    params.append("quickFilterEnums", entry);

  return params;
};

const getGrid = async <
  Row,
  FilterField extends string,
  SortField extends string,
>(
  path: string,
  query: GridQuery<FilterField, SortField>,
  init?: RequestInit,
) => {
  try {
    const result = await fetcher<{ data: Row[]; total: number }>(
      `${path}?${getGridSearchParams(query).toString()}`,
      init,
    );

    return {
      data: Array.isArray(result.data) ? result.data : [],
      total: result.total || 0,
    };
  } catch {
    return { data: [] as Row[], total: 0 };
  }
};

export const attendancePath = (
  organizationSlug: string,
  scope: AttendanceScope,
  resource: string,
) =>
  `/api/organizations/${organizationSlug}/attendance/${scope === "me" ? "me/" : ""}${resource}`;

export const getAttendanceContext = cache(
  (organizationSlug: string, init?: RequestInit) =>
    fetcher<AttendanceContext>(
      attendancePath(organizationSlug, "all", "context"),
      init,
    ),
);

export const getAttendanceMembers = cache(
  async (organizationSlug: string, init?: RequestInit) => {
    try {
      return await fetcher<AttendanceMember[]>(
        attendancePath(organizationSlug, "all", "members"),
        init,
      );
    } catch {
      return [];
    }
  },
);

export const getAttendanceSettings = cache(
  async (organizationSlug: string, init?: RequestInit) => {
    try {
      return await fetcher<AttendanceSettings>(
        attendancePath(organizationSlug, "all", "settings"),
        init,
      );
    } catch {
      return null;
    }
  },
);

export const getAttendanceEmployees = cache(
  async (
    organizationSlug: string,
    query: GridQuery<
      AttendanceEmployeeFilterField,
      AttendanceEmployeeSortField
    > = {},
    init?: RequestInit,
  ) => {
    const { data: employees, total } = await getGrid<
      AttendanceEmployee,
      AttendanceEmployeeFilterField,
      AttendanceEmployeeSortField
    >(attendancePath(organizationSlug, "all", "employees"), query, init);

    return { employees, total };
  },
);

export const getAttendanceShifts = cache(
  async (
    organizationSlug: string,
    scope: AttendanceScope,
    query: GridQuery<AttendanceShiftFilterField, AttendanceShiftSortField> = {},
    init?: RequestInit,
  ) => {
    const { data: shifts, total } = await getGrid<
      AttendanceShift,
      AttendanceShiftFilterField,
      AttendanceShiftSortField
    >(attendancePath(organizationSlug, scope, "shifts"), query, init);

    return { shifts, total };
  },
);

export const attendanceCalendarPath = (
  organizationSlug: string,
  from: string,
  to: string,
) =>
  `${attendancePath(organizationSlug, "all", "shifts/calendar")}?${new URLSearchParams({ from, to })}`;

export const getAttendanceCalendarShifts = cache(
  async (
    organizationSlug: string,
    from: string,
    to: string,
    init?: RequestInit,
  ) => {
    try {
      return await fetcher<AttendanceShift[]>(
        attendanceCalendarPath(organizationSlug, from, to),
        init,
      );
    } catch {
      return [];
    }
  },
);

export const getAttendancePunchableShifts = cache(
  async (organizationSlug: string, init?: RequestInit) => {
    try {
      return await fetcher<AttendanceShift[]>(
        attendancePath(organizationSlug, "me", "shifts/punchable"),
        init,
      );
    } catch {
      return [];
    }
  },
);

export const getAttendanceRequests = cache(
  async (
    organizationSlug: string,
    scope: AttendanceScope,
    query: GridQuery<
      AttendanceRequestFilterField,
      AttendanceRequestSortField
    > = {},
    init?: RequestInit,
  ) => {
    const { data: requests, total } = await getGrid<
      AttendanceRequest,
      AttendanceRequestFilterField,
      AttendanceRequestSortField
    >(attendancePath(organizationSlug, scope, "requests"), query, init);

    return { requests, total };
  },
);

export const getAttendanceLeaveTypes = cache(
  async (
    organizationSlug: string,
    query: GridQuery<
      AttendanceLeaveTypeFilterField,
      AttendanceLeaveTypeSortField
    > = {},
    init?: RequestInit,
  ) => {
    const { data: leaveTypes, total } = await getGrid<
      AttendanceLeaveType,
      AttendanceLeaveTypeFilterField,
      AttendanceLeaveTypeSortField
    >(attendancePath(organizationSlug, "all", "leave-types"), query, init);

    return { leaveTypes, total };
  },
);

export const getAttendanceLeaveBalances = cache(
  async (
    organizationSlug: string,
    scope: AttendanceScope,
    query: GridQuery<
      AttendanceLeaveBalanceFilterField,
      AttendanceLeaveBalanceSortField
    > = {},
    init?: RequestInit,
  ) => {
    const { data: balances, total } = await getGrid<
      AttendanceLeaveBalance,
      AttendanceLeaveBalanceFilterField,
      AttendanceLeaveBalanceSortField
    >(attendancePath(organizationSlug, scope, "leave-balances"), query, init);

    return { balances, total };
  },
);

export const getAttendanceLeaveCases = cache(
  async (
    organizationSlug: string,
    scope: AttendanceScope,
    query: GridQuery<
      AttendanceLeaveCaseFilterField,
      AttendanceLeaveCaseSortField
    > = {},
    init?: RequestInit,
  ) => {
    const { data: leaveCases, total } = await getGrid<
      AttendanceLeaveCase,
      AttendanceLeaveCaseFilterField,
      AttendanceLeaveCaseSortField
    >(attendancePath(organizationSlug, scope, "leave-cases"), query, init);

    return { leaveCases, total };
  },
);

export const getAttendanceTemplates = cache(
  async (
    organizationSlug: string,
    query: GridQuery<
      AttendanceTemplateFilterField,
      AttendanceTemplateSortField
    > = {},
    init?: RequestInit,
  ) => {
    const { data: templates, total } = await getGrid<
      AttendanceTemplate,
      AttendanceTemplateFilterField,
      AttendanceTemplateSortField
    >(attendancePath(organizationSlug, "all", "templates"), query, init);

    return { templates, total };
  },
);

export const getAttendanceParentalChildren = cache(
  async (
    organizationSlug: string,
    scope: AttendanceScope,
    query: GridQuery<
      AttendanceParentalChildFilterField,
      AttendanceParentalChildSortField
    > = {},
    init?: RequestInit,
  ) => {
    const { data: parentalChildren, total } = await getGrid<
      AttendanceParentalChild,
      AttendanceParentalChildFilterField,
      AttendanceParentalChildSortField
    >(attendancePath(organizationSlug, scope, "children"), query, init);

    return { parentalChildren, total };
  },
);

export const getAttendanceParentalReturns = cache(
  async (
    organizationSlug: string,
    scope: AttendanceScope,
    query: GridQuery<
      AttendanceParentalReturnFilterField,
      AttendanceParentalReturnSortField
    > = {},
    init?: RequestInit,
  ) => {
    const { data: parentalReturns, total } = await getGrid<
      AttendanceParentalReturn,
      AttendanceParentalReturnFilterField,
      AttendanceParentalReturnSortField
    >(attendancePath(organizationSlug, scope, "return-requests"), query, init);

    return { parentalReturns, total };
  },
);

export const payrollPath = (
  organizationSlug: string,
  scope: AttendanceScope,
  resource: string,
) =>
  `/api/organizations/${organizationSlug}/payroll/${scope === "me" ? "me/" : ""}${resource}`;

export const getPayrollStatements = cache(
  async (
    organizationSlug: string,
    scope: AttendanceScope,
    query: GridQuery<
      PayrollStatementFilterField,
      PayrollStatementSortField
    > = {},
    init?: RequestInit,
  ) => {
    const { data: statements, total } = await getGrid<
      PayrollStatement,
      PayrollStatementFilterField,
      PayrollStatementSortField
    >(payrollPath(organizationSlug, scope, "statements"), query, init);

    return { statements, total };
  },
);

export const getPayrollTerms = cache(
  async (organizationSlug: string, init?: RequestInit) => {
    try {
      return await fetcher<PayrollTerms[]>(
        payrollPath(organizationSlug, "all", "terms"),
        init,
      );
    } catch {
      return [];
    }
  },
);

const attendanceErrorCodes = [
  ...attendanceErrorCodeValues,
  ...payrollBlockerValues,
];

export const attendanceErrorKey = (
  error: unknown,
): `errors.${AttendanceErrorCode | PayrollBlocker | "error"}` => {
  const code = (error as FetchError)?.info?.message;

  return `errors.${attendanceErrorCodes.find((key) => key === code) ?? "error"}`;
};

const money = /^(\d{1,10})(?:\.(\d{1,2}))?$/;

export const isMoney = (value: number) => money.test(String(value));

export const fromCents = (value: string | number) => Number(value) / 100;

export const toCents = (value: number) => {
  const match = money.exec(String(value));

  if (!match) throw new Error("invalidAmount");

  return (
    BigInt(match[1]) * BigInt(100) +
    BigInt((match[2] ?? "").padEnd(2, "0"))
  ).toString();
};

export const downloadAttendanceCsv = (filename: string, rows: string[][]) => {
  const content = rows
    .map((row) =>
      row
        .map((value) => {
          const safe = /^[=+\-@\t\r\n]/.test(value) ? `'${value}` : value;

          return `"${safe.replaceAll('"', '""')}"`;
        })
        .join(","),
    )
    .join("\r\n");

  const url = URL.createObjectURL(
    new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8" }),
  );

  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
