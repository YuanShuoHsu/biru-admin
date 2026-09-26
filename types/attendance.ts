import {
  attendanceEmployeeFilterFieldValues,
  attendanceEmployeeSortFieldValues,
  attendanceErrorCodeValues,
  attendanceHolidaySubstituteFilterFieldValues,
  attendanceHolidaySubstituteSortFieldValues,
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
export type AttendanceEmploymentType =
  components["schemas"]["AttendanceEmploymentType"];
export type AttendanceLegalStatus =
  components["schemas"]["AttendanceLegalStatus"];
export type AttendanceLegalStatusObligation =
  components["schemas"]["AttendanceLegalStatusObligationResponseDto"];
export type SaveAttendanceEmployee =
  components["schemas"]["SaveAttendanceEmployeeDto"];
export type AttendanceContext =
  components["schemas"]["AttendanceContextResponseDto"];
export type AttendanceShift =
  components["schemas"]["AttendanceShiftResponseDto"];
export type AttendanceCalendarDayKinds =
  components["schemas"]["AttendanceCalendarDayKindsResponseDto"];
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
export type AttendanceHolidaySubstitute =
  components["schemas"]["AttendanceHolidaySubstituteResponseDto"];
export type AttendanceHolidaySubstitutePage =
  components["schemas"]["AttendanceHolidaySubstitutesResponseDto"];
export type EmployerHealthSupplement =
  components["schemas"]["EmployerHealthSupplementResponseDto"];
export type AttendanceLeaveCase =
  components["schemas"]["AttendanceLeaveCaseResponseDto"];
export type AttendanceMember =
  components["schemas"]["AttendanceMemberResponseDto"];

export type AttendanceMemberPage =
  components["schemas"]["AttendanceMembersResponseDto"];
export type AttendanceSettings =
  components["schemas"]["AttendanceSettingsResponseDto"];
export type OccupationalIndustryRate =
  components["schemas"]["OccupationalIndustryRateResponseDto"];
export type AttendanceCopyWeekResult =
  components["schemas"]["AttendanceCopyWeekResponseDto"];
export type PayrollStatement =
  components["schemas"]["PayrollStatementResponseDto"];
export type PayrollStatementPage =
  components["schemas"]["PayrollStatementsResponseDto"];
export type PayrollTerms = components["schemas"]["PayrollTermsResponseDto"];

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
export type AttendanceHolidaySubstituteFilterField =
  (typeof attendanceHolidaySubstituteFilterFieldValues)[number];
export type AttendanceHolidaySubstituteSortField =
  (typeof attendanceHolidaySubstituteSortFieldValues)[number];
export type AttendanceLeaveCaseFilterField =
  (typeof attendanceLeaveCaseFilterFieldValues)[number];
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
export type AttendanceParentalChildSortField =
  (typeof attendanceParentalChildSortFieldValues)[number];
export type AttendanceParentalReturnSortField =
  (typeof attendanceParentalReturnSortFieldValues)[number];
export type PayrollStatementFilterField =
  (typeof payrollStatementFilterFieldValues)[number];
export type PayrollStatementSortField =
  (typeof payrollStatementSortFieldValues)[number];
