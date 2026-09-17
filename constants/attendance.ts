import type { hasRolePermission } from "@/utils/organizations";

export const ATTENDANCE_NAV_ITEMS: {
  path: string;
  permission?: Parameters<typeof hasRolePermission>[1];
}[] = [
  { path: "/attendance/mine" },
  { path: "/attendance/requests" },
  { path: "/attendance/balances" },
  { path: "/attendance/leave-cases" },
  { path: "/attendance/parental-children" },
  { path: "/attendance/parental-returns" },
  { path: "/attendance/payslips" },
  { path: "/attendance/shifts", permission: { shift: ["read"] } },
  { path: "/attendance/reviews", permission: { attendanceRequest: ["read"] } },
  { path: "/attendance/employees", permission: { employee: ["read"] } },
  { path: "/attendance/templates", permission: { shiftTemplate: ["read"] } },
  { path: "/attendance/settings", permission: { attendanceSetting: ["read"] } },
  { path: "/attendance/leave-types", permission: { leaveType: ["update"] } },
  {
    path: "/attendance/payroll",
    permission: { payrollTerm: ["read"], payslip: ["read"] },
  },
];

export const MONEY_MAX = 9_999_999_999.99;

export const MONEY_FRACTION_DIGITS = 2;
