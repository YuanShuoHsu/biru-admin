import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import type { useFormatter, useTranslations } from "next-intl";
import { cache } from "react";

import { ATTENDANCE_NAV_GROUPS } from "@/constants/attendance";
import { MAX_PAGE_SIZE } from "@/constants/pagination";
import { PLATFORM_TIMEZONE, STORE_TIMEZONE } from "@/constants/timezone";

import { authClient } from "@/lib/auth-client";

import type { GridColDef } from "@mui/x-data-grid";

import {
  attendanceErrorCodeValues,
  payrollBlockerValues,
  payrollDeductionLineCodeValues,
  payrollEarningLineCodeValues,
  payrollEmployerCostCodeValues,
} from "@/types/api";
import type {
  AttendanceCalendarDayKinds,
  AttendanceContext,
  AttendanceEmployee,
  AttendanceEmployeeFilterField,
  AttendanceEmployeeSortField,
  AttendanceErrorCode,
  AttendanceHolidaySubstitute,
  AttendanceHolidaySubstituteFilterField,
  AttendanceHolidaySubstitutePage,
  AttendanceHolidaySubstituteSortField,
  AttendanceLeaveBalance,
  AttendanceLeaveBalanceFilterField,
  AttendanceLeaveBalanceSortField,
  AttendanceLeaveCase,
  AttendanceLeaveCaseFilterField,
  AttendanceLeaveCaseSortField,
  AttendanceLeaveType,
  AttendanceLeaveTypeFilterField,
  AttendanceLeaveTypeSortField,
  AttendanceLegalStatusObligation,
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
  OccupationalIndustryRate,
  PayrollBlocker,
  PayrollStatement,
  PayrollStatementFilterField,
  PayrollStatementSortField,
  PayrollTerms,
} from "@/types/attendance";
import { getGridSearchParams, type GridQuery } from "@/utils/dataGrid";
import { fetcher, type FetchError } from "@/utils/fetcher";
import { getResolvedAdminOrganization } from "@/utils/menus";
import { hasRolePermission } from "@/utils/organizations";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

export const weekdayDate = (day: number) =>
  dayjs().tz(PLATFORM_TIMEZONE).day(day).toDate();

export const WEEK_DAYS = 7;

export const ATTENDANCE_CALENDAR_VIEWS = [
  "day",
  "week",
  "month",
  "agenda",
] as const;

export type AttendanceCalendarView = (typeof ATTENDANCE_CALENDAR_VIEWS)[number];

export const DEFAULT_ATTENDANCE_CALENDAR_VIEW: AttendanceCalendarView = "week";

export const ATTENDANCE_AGENDA_DAYS = 12;

export const attendanceCalendarDate = (date?: string) =>
  (date && /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? dayjs.tz(date, STORE_TIMEZONE)
    : dayjs().tz(STORE_TIMEZONE)
  ).format("YYYY-MM-DD");

const sundayOf = (day: dayjs.Dayjs) => day.subtract(day.day(), "day");

export const attendanceCalendarRange = (
  view: AttendanceCalendarView,
  date: string,
) => {
  const day = dayjs.tz(date, STORE_TIMEZONE);

  switch (view) {
    case "day":
      return { from: day, to: day.add(1, "day") };
    case "week":
      return { from: sundayOf(day), to: sundayOf(day).add(WEEK_DAYS, "day") };
    case "month":
      return {
        from: sundayOf(day.startOf("month")),
        to: sundayOf(day.endOf("month").startOf("day")).add(WEEK_DAYS, "day"),
      };
    case "agenda":
      return { from: day, to: day.add(ATTENDANCE_AGENDA_DAYS, "day") };
  }
};

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

type AttendanceScope = "org" | "me";

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
      attendancePath(organizationSlug, "org", "context"),
      init,
    ),
);

export const getAttendanceMembers = cache(
  async (
    organizationSlug: string,
    query: GridQuery<
      AttendanceEmployeeFilterField,
      AttendanceEmployeeSortField
    > = {},
    init?: RequestInit,
  ) => {
    const { data: members, total } = await getGrid<
      AttendanceMember,
      AttendanceEmployeeFilterField,
      AttendanceEmployeeSortField
    >(attendancePath(organizationSlug, "org", "members"), query, init);

    return { members, total };
  },
);

export const getAttendanceSettings = cache(
  async (organizationSlug: string, init?: RequestInit) => {
    try {
      return await fetcher<AttendanceSettings>(
        attendancePath(organizationSlug, "org", "settings"),
        init,
      );
    } catch {
      return null;
    }
  },
);

export const getAttendanceLegalStatusObligations = cache(
  (organizationSlug: string, init?: RequestInit) =>
    fetcher<AttendanceLegalStatusObligation[]>(
      attendancePath(organizationSlug, "org", "legal-status-obligations"),
      init,
    ),
);

export const getOccupationalIndustryRates = cache(
  (organizationSlug: string, init?: RequestInit) =>
    fetcher<OccupationalIndustryRate[]>(
      attendancePath(organizationSlug, "org", "occupational-industries"),
      init,
    ),
);

export const SCHEDULABLE_EMPLOYEES_QUERY: GridQuery<
  AttendanceEmployeeFilterField,
  AttendanceEmployeeSortField
> = {
  pageSize: MAX_PAGE_SIZE,
  filterField: "status",
  filterOperator: "isAnyOf",
  filterValue: "active,upcoming",
};

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
    >(attendancePath(organizationSlug, "org", "employees"), query, init);

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
  resource: "day-kinds" | "leaves" | "shifts",
  from: string,
  to: string,
) =>
  `${attendancePath(organizationSlug, "org", `${resource}/calendar`)}?${new URLSearchParams({ from, to })}`;

const getAttendanceCalendar = async <T>(
  organizationSlug: string,
  resource: Parameters<typeof attendanceCalendarPath>[1],
  from: string,
  to: string,
  fallback: T,
  init?: RequestInit,
) => {
  try {
    return await fetcher<T>(
      attendanceCalendarPath(organizationSlug, resource, from, to),
      init,
    );
  } catch {
    return fallback;
  }
};

export const getAttendanceCalendarShifts = cache(
  (organizationSlug: string, from: string, to: string, init?: RequestInit) =>
    getAttendanceCalendar<AttendanceShift[]>(
      organizationSlug,
      "shifts",
      from,
      to,
      [],
      init,
    ),
);

export const getAttendanceCalendarDayKinds = cache(
  (organizationSlug: string, from: string, to: string, init?: RequestInit) =>
    getAttendanceCalendar<AttendanceCalendarDayKinds>(
      organizationSlug,
      "day-kinds",
      from,
      to,
      { dayKinds: [], holidays: [] },
      init,
    ),
);

export const getAttendanceCalendarLeaves = cache(
  (organizationSlug: string, from: string, to: string, init?: RequestInit) =>
    getAttendanceCalendar<AttendanceRequest[]>(
      organizationSlug,
      "leaves",
      from,
      to,
      [],
      init,
    ),
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

export const attendanceHolidaySubstitutesPath = (
  organizationSlug: string,
  year: number,
  query: GridQuery<
    AttendanceHolidaySubstituteFilterField,
    AttendanceHolidaySubstituteSortField
  > = {},
) => {
  const params = getGridSearchParams(query);

  params.set("year", String(year));

  return `${attendancePath(organizationSlug, "org", "holiday-substitutes")}?${params.toString()}`;
};

export const getAttendanceHolidaySubstitutes = cache(
  async (
    organizationSlug: string,
    year: number,
    query: GridQuery<
      AttendanceHolidaySubstituteFilterField,
      AttendanceHolidaySubstituteSortField
    > = {},
    init?: RequestInit,
  ) => {
    try {
      const { data: substitutes, total } =
        await fetcher<AttendanceHolidaySubstitutePage>(
          attendanceHolidaySubstitutesPath(organizationSlug, year, query),
          init,
        );

      return { substitutes, total };
    } catch {
      return { substitutes: [] as AttendanceHolidaySubstitute[], total: 0 };
    }
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
    >(attendancePath(organizationSlug, "org", "leave-types"), query, init);

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
    >(attendancePath(organizationSlug, "org", "templates"), query, init);

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
        payrollPath(organizationSlug, "org", "terms"),
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

type Formatter = ReturnType<typeof useFormatter>;

export const formatScheduledShift = (
  format: Formatter,
  { endsAt, startsAt }: Pick<AttendanceShift, "endsAt" | "startsAt">,
) => format.dateTimeRange(new Date(startsAt), new Date(endsAt), "shift");

export const formatClockedShift = (
  format: Formatter,
  {
    clockInAt,
    clockOutAt,
    startsAt,
  }: Pick<AttendanceShift, "clockInAt" | "clockOutAt" | "startsAt">,
) => {
  if (clockInAt == null) return "";

  const shiftDay = dayjs(startsAt).tz(STORE_TIMEZONE);
  const style = [clockInAt, clockOutAt].every(
    (value) =>
      value == null || dayjs(value).tz(STORE_TIMEZONE).isSame(shiftDay, "day"),
  )
    ? "time"
    : "dateTime";

  return clockOutAt == null
    ? `${format.dateTime(new Date(clockInAt), style)}–`
    : format.dateTimeRange(new Date(clockInAt), new Date(clockOutAt), style);
};

export const attendanceErrorKey = (
  error: unknown,
): `errors.${AttendanceErrorCode | PayrollBlocker | "error"}` => {
  const code = (error as FetchError)?.info?.message;

  return `errors.${attendanceErrorCodes.find((key) => key === code) ?? "error"}`;
};

export const getStatutoryLeaveName = (
  tAttendance: ReturnType<typeof useTranslations<"attendance">>,
  leaveType: {
    name: string;
    statutoryKind: AttendanceLeaveType["statutoryKind"];
  },
) =>
  leaveType.statutoryKind === "custom"
    ? leaveType.name
    : tAttendance(`statutoryKind.names.${leaveType.statutoryKind}`);

export const formatLeaveDuration = (
  tAttendance: ReturnType<typeof useTranslations<"attendance">>,
  minutes: number,
  calendarLeave: boolean,
) => {
  if (calendarLeave)
    return tAttendance("duration.days", { days: minutes / 1440 });

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  return remainder === 0
    ? tAttendance("duration.hours", { hours })
    : hours === 0
      ? tAttendance("duration.minutes", { minutes: remainder })
      : tAttendance("duration.hoursMinutes", { hours, minutes: remainder });
};

const moneyPattern = /^(\d{1,10})(?:\.(\d{1,2}))?$/;

export const isMoney = (value: number) => moneyPattern.test(String(value));

export const fromCents = (value: string | number) => Number(value) / 100;

const negateCents = (value: string) => (-BigInt(value)).toString();

export const getPayrollAmountColumns = (
  tAttendance: ReturnType<typeof useTranslations<"attendance">>,
  format: ReturnType<typeof useFormatter>,
  money: (value: string) => string,
  renderEmptyableCell: GridColDef["renderCell"],
): GridColDef<PayrollStatement>[] => {
  const amountColumn = (
    field: string,
    headerName: string,
    getAmountCents: (
      snapshot: PayrollStatement["snapshot"],
    ) => string | undefined,
  ): GridColDef<PayrollStatement> => ({
    field,
    filterable: false,
    headerName,
    renderCell: renderEmptyableCell,
    sortable: false,
    valueFormatter: (value?: string) => (value == null ? "" : money(value)),
    valueGetter: (_value, { snapshot }) => getAmountCents(snapshot),
  });

  const overtimeHoursColumn: GridColDef<PayrollStatement> = {
    field: "overtimeHours",
    filterable: false,
    headerName: tAttendance("overtimeHours"),
    renderCell: renderEmptyableCell,
    sortable: false,
    type: "number",
    valueFormatter: (value?: number) =>
      value == null
        ? ""
        : format.number(value / 3600, { maximumFractionDigits: 2 }),
    valueGetter: (_value, { snapshot }) =>
      snapshot.earnings.find(({ code }) => code === "overtimePay")?.seconds,
  };

  return [
    {
      field: "agreedSalary",
      filterable: false,
      headerName: tAttendance("agreedSalary"),
      sortable: false,
      valueGetter: (_value, { snapshot: { terms } }) =>
        `${tAttendance(`salaryType.options.${terms.salaryType}`)} ${money(terms.salaryCents)}`,
    },
    ...payrollEarningLineCodeValues.flatMap((code) => [
      ...(code === "overtimePay" ? [overtimeHoursColumn] : []),
      amountColumn(
        code,
        tAttendance(`payrollLine.options.${code}`),
        ({ earnings }) =>
          earnings.find((line) => line.code === code)?.amountCents,
      ),
    ]),
    amountColumn("gross", tAttendance("gross"), ({ grossCents }) => grossCents),
    ...payrollDeductionLineCodeValues.map((code) =>
      amountColumn(
        code,
        tAttendance(`payrollLine.options.${code}`),
        ({ deductions }) => {
          const amountCents = deductions.find(
            (line) => line.code === code,
          )?.amountCents;

          return amountCents && negateCents(amountCents);
        },
      ),
    ),
    amountColumn(
      "deductions",
      tAttendance("deductions"),
      ({ deductionCents }) => negateCents(deductionCents),
    ),
    amountColumn("net", tAttendance("net"), ({ netCents }) => netCents),
    amountColumn(
      "employerPension",
      tAttendance("employerPension"),
      ({ employerPensionCents }) => employerPensionCents,
    ),
    ...payrollEmployerCostCodeValues.map((code) =>
      amountColumn(
        `employerCost-${code}`,
        tAttendance(`employerCost.options.${code}`),
        ({ employerCosts }) =>
          employerCosts?.find((cost) => cost.code === code)?.amountCents,
      ),
    ),
  ];
};

export const toCents = (value: number) => {
  const match = moneyPattern.exec(String(value));

  if (!match) throw new Error("invalidAmount");

  return (
    BigInt(match[1]) * BigInt(100) +
    BigInt((match[2] ?? "").padEnd(2, "0"))
  ).toString();
};
