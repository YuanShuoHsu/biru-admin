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
        path: "/attendance/schedule/templates",
        permission: { shiftTemplate: ["read"] },
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
        path: "/attendance/payroll",
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
        path: "/attendance/settings/leave-types",
        permission: { leaveType: ["update"] },
      },
    ],
    path: "/attendance/settings",
  },
];

export const MONEY_MAX = 9_999_999_999.99;

export const MONEY_FRACTION_DIGITS = 2;

export const CORRECTION_LEAD_HOURS = 12;

export const ALLOWED_IPS_MAX = 30;
