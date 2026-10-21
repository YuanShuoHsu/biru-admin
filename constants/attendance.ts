import type { ChipProps } from "@mui/material";

import type {
  AttendanceEmployeeStatus,
  AttendanceRequest,
  AttendanceShift,
  PayrollBlocker,
  PayrollStatement,
} from "@/types/attendance";

import type { hasRolePermission } from "@/utils/organizations";

interface AttendanceNavItem {
  path: string;
  permission?: Parameters<typeof hasRolePermission>[1];
}

export const ATTENDANCE_NAV_GROUPS: {
  children: AttendanceNavItem[];
  path: string;
}[] = [
  {
    children: [
      { path: "/attendance/mine/shifts" },
      { path: "/attendance/mine/requests" },
      { path: "/attendance/mine/leave" },
      { path: "/attendance/mine/payslips" },
    ],
    path: "/attendance/mine",
  },
  {
    children: [
      {
        path: "/attendance/schedule/calendar",
        permission: { shift: ["read"] },
      },
      { path: "/attendance/schedule/shifts", permission: { shift: ["read"] } },
      {
        path: "/attendance/schedule/reviews",
        permission: { attendanceRequest: ["read"] },
      },
      {
        path: "/attendance/schedule/holiday-substitutes",
        permission: { shift: ["read"] },
      },
      {
        path: "/attendance/schedule/shift-types",
        permission: { shiftType: ["create"] },
      },
    ],
    path: "/attendance/schedule",
  },
  {
    children: [
      {
        path: "/attendance/leave/balances",
        permission: { leaveBalance: ["read"] },
      },
      { path: "/attendance/leave/cases", permission: { leaveCase: ["read"] } },
      {
        path: "/attendance/leave/parental-returns",
        permission: { parentalReturn: ["read"] },
      },
      {
        path: "/attendance/leave/leave-types",
        permission: { leaveType: ["update"] },
      },
    ],
    path: "/attendance/leave",
  },
  {
    children: [
      {
        path: "/attendance/payroll/statements",
        permission: { payrollTerm: ["read"], payslip: ["read"] },
      },
      {
        path: "/attendance/payroll/withholding",
        permission: { payrollTerm: ["read"], payslip: ["read"] },
      },
      {
        path: "/attendance/payroll/earning-types",
        permission: { payrollTerm: ["create"] },
      },
    ],
    path: "/attendance/payroll",
  },
  {
    children: [
      {
        path: "/attendance/settings/general",
        permission: { attendanceSetting: ["read"] },
      },
      {
        path: "/attendance/settings/employees",
        permission: { employee: ["read"] },
      },
    ],
    path: "/attendance/settings",
  },
];

export const MONEY_MAX = 9_999_999_999.99;

export const MONEY_FRACTION_DIGITS = 2;

export const NORMAL_DAILY_WORK_HOURS = 8;

export const MAX_DAILY_WORK_HOURS = 12;

export const ALLOWED_IPS_MAX = 30;

export const NOTICE_TERMINATION_REASONS = [
  "layoff",
  "forceMajeure",
  "reorganization",
] as const;

interface PayrollBlockerPage {
  byEmployee?: boolean;
  path: string;
  query?: Record<string, string>;
}

const EMPLOYEES: PayrollBlockerPage = {
  byEmployee: true,
  path: "/attendance/settings/employees",
};

const GENERAL_SETTINGS: PayrollBlockerPage = {
  path: "/attendance/settings/general",
};

const SHIFTS: PayrollBlockerPage = {
  byEmployee: true,
  path: "/attendance/schedule/shifts",
};

const UNREVIEWED_OVERTIME: PayrollBlockerPage = {
  ...SHIFTS,
  query: { unreviewedOvertime: "true" },
};

const PENDING_REQUESTS: PayrollBlockerPage = {
  byEmployee: true,
  path: "/attendance/schedule/reviews",
  query: {
    filterField: "status",
    filterOperator: "isAnyOf",
    filterValue: "pending,cancellationPending",
  },
};

export const PAYROLL_BLOCKER_TARGETS: Record<
  PayrollBlocker,
  PayrollBlockerPage | "terms" | null
> = {
  averageWageStatementsRequired: null,
  belowMinimumWage: "terms",
  birthDateRequired: EMPLOYEES,
  calendarLeavePayRequired: {
    byEmployee: true,
    path: "/attendance/leave/cases",
  },
  childLaborHoursExceeded: SHIFTS,
  childLaborNightWork: SHIFTS,
  childLaborRestDay: SHIFTS,
  consecutiveWorkdaysExceeded: SHIFTS,
  dailyHoursExceeded: SHIFTS,
  emergencyDetailsRequired: SHIFTS,
  employmentInsuranceExemptionInvalid: "terms",
  employmentInsuranceIneligible: "terms",
  employmentInsuranceRequired: "terms",
  healthInsuranceExemptionInvalid: "terms",
  healthInsuranceRequired: "terms",
  healthSupplementExemptionInvalid: "terms",
  holidayCalendarMissing: null,
  holidayDayKindRequired: SHIFTS,
  holidaySubstituteRequired: {
    byEmployee: true,
    path: "/attendance/schedule/holiday-substitutes",
  },
  incompleteAttendance: SHIFTS,
  inconsistentDayKind: SHIFTS,
  insuranceBasisOutdated: "terms",
  insuranceBasisUnderDeclared: "terms",
  insuranceTermsRequired: "terms",
  laborInsuranceExemptionInvalid: "terms",
  laborInsuranceRequired: "terms",
  leavePolicyRequired: { path: "/attendance/leave/leave-types" },
  legacySeniorityUnsupported: null,
  maternalNightWork: SHIFTS,
  minimumWageUnconfirmed: null,
  monthlyOvertimeExceeded: SHIFTS,
  negativeNetPay: "terms",
  noShifts: { path: "/attendance/schedule/calendar" },
  occupationalAccidentRateRequired: GENERAL_SETTINGS,
  openingHoursRequired: null,
  overlappingLeaveAttendance: SHIFTS,
  overtimeAgreementRequired: GENERAL_SETTINGS,
  parentalReturnPending: {
    byEmployee: true,
    path: "/attendance/leave/parental-returns",
  },
  partTimeLadderRequiresPartTime: "terms",
  paydayRequired: GENERAL_SETTINGS,
  payrollPeriodOpen: null,
  payrollRuleSetStale: null,
  pendingRequests: PENDING_REQUESTS,
  pensionIneligible: "terms",
  pensionRequired: "terms",
  prorationRequired: "terms",
  shiftRestTooShort: SHIFTS,
  studentWeeklyHoursExceeded: SHIFTS,
  taiwanStaySinceRequired: EMPLOYEES,
  terminationReasonRequired: EMPLOYEES,
  unreviewedOvertime: UNREVIEWED_OVERTIME,
  unsupportedDayKind: SHIFTS,
  weeklyRestRequired: SHIFTS,
  weeklyScheduleRequiresReview: SHIFTS,
  withholdingTableOutdated: null,
  workPermitRequired: EMPLOYEES,
};

export const EMPLOYEE_STATUS_COLORS: Record<
  AttendanceEmployeeStatus,
  ChipProps["color"]
> = {
  active: "success",
  terminated: "default",
  unconfigured: "warning",
  upcoming: "info",
};

export const HOLIDAY_SUBSTITUTE_STATUS_COLORS: Record<
  "designated" | "notOwed" | "pending",
  ChipProps["color"]
> = {
  designated: "default",
  notOwed: "error",
  pending: "warning",
};

export const PAYROLL_STATUS_COLORS: Record<
  PayrollStatement["status"],
  ChipProps["color"]
> = {
  draft: "default",
  published: "success",
  reviewed: "info",
};

export const REQUEST_STATUS_COLORS: Record<
  AttendanceRequest["status"],
  ChipProps["color"]
> = {
  approved: "success",
  cancellationPending: "default",
  cancelled: "default",
  pending: "default",
  rejected: "error",
  withdrawn: "default",
};

export const SHIFT_STATE_COLORS: Record<
  AttendanceShift["state"],
  ChipProps["color"]
> = {
  completed: "default",
  resting: "default",
  scheduled: "default",
  working: "success",
};
