import {
  attendanceEmployeeFilterFieldValues,
  attendanceEmployeeSortFieldValues,
  attendanceErrorCodeValues,
  attendanceLeaveBalanceFilterFieldValues,
  attendanceLeaveBalanceSortFieldValues,
  attendanceLeaveCaseFilterFieldValues,
  attendanceLeaveCaseSortFieldValues,
  attendanceLeaveTypeFilterFieldValues,
  attendanceLeaveTypeSortFieldValues,
  attendanceParentalChildFilterFieldValues,
  attendanceParentalChildSortFieldValues,
  attendanceParentalReturnFilterFieldValues,
  attendanceParentalReturnSortFieldValues,
  attendanceRequestFilterFieldValues,
  attendanceRequestSortFieldValues,
  attendanceShiftFilterFieldValues,
  attendanceShiftSortFieldValues,
  attendanceTemplateFilterFieldValues,
  attendanceTemplateSortFieldValues,
  type components,
  payrollBlockerValues,
  payrollStatementFilterFieldValues,
  payrollStatementSortFieldValues,
} from "@/types/api";

export type AttendanceEmployee =
  components["schemas"]["AttendanceEmployeeResponseDto"];
export type AttendanceEmployment =
  components["schemas"]["AttendanceEmploymentResponseDto"];
export type AttendanceEmployeeStatus =
  components["schemas"]["AttendanceEmployeeStatus"];
export type SaveAttendanceEmployee =
  components["schemas"]["SaveAttendanceEmployeeDto"];
export type AttendanceContext =
  components["schemas"]["AttendanceContextResponseDto"];
export type AttendanceShift =
  components["schemas"]["AttendanceShiftResponseDto"];
export type AttendanceShiftPage =
  components["schemas"]["AttendanceShiftsResponseDto"];
export type AttendanceEvent =
  components["schemas"]["AttendanceEventResponseDto"];
export type AttendanceEventAction =
  components["schemas"]["AttendanceEventAction"];
export type AttendanceRequest =
  components["schemas"]["AttendanceRequestResponseDto"];
export type AttendanceRequestKind =
  components["schemas"]["AttendanceRequestKind"];
export type AttendanceRequestPage =
  components["schemas"]["AttendanceRequestsResponseDto"];
export type AttendanceLeaveType =
  components["schemas"]["AttendanceLeaveTypeResponseDto"];
export type AttendanceEmployeePage =
  components["schemas"]["AttendanceEmployeesResponseDto"];
export type AttendanceLeaveTypePage =
  components["schemas"]["AttendanceLeaveTypesResponseDto"];
export type AttendanceLeaveBalancePage =
  components["schemas"]["AttendanceLeaveBalancesResponseDto"];
export type AttendanceLeaveCasePage =
  components["schemas"]["AttendanceLeaveCasesResponseDto"];
export type AttendanceTemplatePage =
  components["schemas"]["AttendanceTemplatesResponseDto"];
export type AttendanceParentalChild =
  components["schemas"]["AttendanceParentalChildResponseDto"];
export type AttendanceParentalChildPage =
  components["schemas"]["AttendanceParentalChildrenResponseDto"];
export type AttendanceParentalReturn =
  components["schemas"]["AttendanceParentalReturnResponseDto"];
export type AttendanceParentalReturnPage =
  components["schemas"]["AttendanceParentalReturnsResponseDto"];
export type AttendanceLeaveBalance =
  components["schemas"]["AttendanceLeaveBalanceResponseDto"];
export type AttendanceLeaveCase =
  components["schemas"]["AttendanceLeaveCaseResponseDto"];
export type AttendanceMember =
  components["schemas"]["AttendanceMemberResponseDto"];

export type AttendanceMemberPage =
  components["schemas"]["AttendanceMembersResponseDto"];
export type AttendanceSettings =
  components["schemas"]["AttendanceSettingsResponseDto"];
export type AttendanceTemplate =
  components["schemas"]["AttendanceTemplateResponseDto"];
export type PayrollStatement =
  components["schemas"]["PayrollStatementResponseDto"];
export type PayrollStatementPage =
  components["schemas"]["PayrollStatementsResponseDto"];
export type PayrollTerms = components["schemas"]["PayrollTermsResponseDto"];
export type PayrollInsuranceGrades =
  components["schemas"]["PayrollInsuranceGradesResponseDto"];

export type AttendanceErrorCode = (typeof attendanceErrorCodeValues)[number];
export type PayrollBlocker = (typeof payrollBlockerValues)[number];

export type AttendanceRequestFilterField =
  (typeof attendanceRequestFilterFieldValues)[number];
export type AttendanceShiftFilterField =
  (typeof attendanceShiftFilterFieldValues)[number];
export type AttendanceEmployeeFilterField =
  (typeof attendanceEmployeeFilterFieldValues)[number];
export type AttendanceLeaveTypeFilterField =
  (typeof attendanceLeaveTypeFilterFieldValues)[number];
export type AttendanceLeaveBalanceFilterField =
  (typeof attendanceLeaveBalanceFilterFieldValues)[number];
export type AttendanceLeaveCaseFilterField =
  (typeof attendanceLeaveCaseFilterFieldValues)[number];
export type AttendanceTemplateFilterField =
  (typeof attendanceTemplateFilterFieldValues)[number];
export type AttendanceParentalChildFilterField =
  (typeof attendanceParentalChildFilterFieldValues)[number];
export type AttendanceParentalReturnFilterField =
  (typeof attendanceParentalReturnFilterFieldValues)[number];

export type AttendanceRequestSortField =
  (typeof attendanceRequestSortFieldValues)[number];
export type AttendanceShiftSortField =
  (typeof attendanceShiftSortFieldValues)[number];
export type AttendanceEmployeeSortField =
  (typeof attendanceEmployeeSortFieldValues)[number];
export type AttendanceLeaveTypeSortField =
  (typeof attendanceLeaveTypeSortFieldValues)[number];
export type AttendanceLeaveBalanceSortField =
  (typeof attendanceLeaveBalanceSortFieldValues)[number];
export type AttendanceLeaveCaseSortField =
  (typeof attendanceLeaveCaseSortFieldValues)[number];
export type AttendanceTemplateSortField =
  (typeof attendanceTemplateSortFieldValues)[number];
export type AttendanceParentalChildSortField =
  (typeof attendanceParentalChildSortFieldValues)[number];
export type AttendanceParentalReturnSortField =
  (typeof attendanceParentalReturnSortFieldValues)[number];
export type PayrollStatementFilterField =
  (typeof payrollStatementFilterFieldValues)[number];
export type PayrollStatementSortField =
  (typeof payrollStatementSortFieldValues)[number];
