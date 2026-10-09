import type { PayrollBlocker } from "@/types/attendance";

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
      { path: "/attendance/mine/payslips" },
      { path: "/attendance/mine/withholding" },
    ],
    path: "/attendance/mine",
  },
  {
    children: [
      {
        path: "/attendance/schedule/calendar",
        permission: { shift: ["read"] },
      },
      {
        path: "/attendance/schedule/holiday-substitutes",
        permission: { shift: ["read"] },
      },
    ],
    path: "/attendance/schedule",
  },
  {
    children: [
      { path: "/attendance/records/shifts", permission: { shift: ["read"] } },
      {
        path: "/attendance/records/reviews",
        permission: { attendanceRequest: ["read"] },
      },
    ],
    path: "/attendance/records",
  },
  {
    children: [
      { path: "/attendance/leave/balances" },
      { path: "/attendance/leave/cases" },
      { path: "/attendance/leave/parental-children" },
      { path: "/attendance/leave/parental-returns" },
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
      {
        path: "/attendance/settings/shift-types",
        permission: { shiftType: ["create"] },
      },
      {
        path: "/attendance/settings/leave-types",
        permission: { leaveType: ["update"] },
      },
      {
        path: "/attendance/settings/earning-types",
        permission: { payrollTerm: ["create"] },
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
  path: "/attendance/records/shifts",
};

const UNREVIEWED_OVERTIME: PayrollBlockerPage = {
  ...SHIFTS,
  query: { unreviewedOvertime: "true" },
};

const PENDING_REQUESTS: PayrollBlockerPage = {
  byEmployee: true,
  path: "/attendance/records/reviews",
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
  leavePolicyRequired: { path: "/attendance/settings/leave-types" },
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
