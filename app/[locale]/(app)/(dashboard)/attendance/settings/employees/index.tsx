"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import { enqueueSnackbar } from "notistack";
import useSWR from "swr";

import TermsDialog from "../../payroll/statements/TermsDialog";
import EmployeeDialog from "./EmployeeDialog";

import { renderEmptyableCell } from "@/components/EmptyCell";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import { getPageSizeOptions } from "@/constants/pagination";

import {
  useDateFilterOperators,
  useEnumFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { Delete, Edit, Payments } from "@mui/icons-material";
import {
  Chip,
  DialogContentText,
  IconButton,
  Stack,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import type {
  GridColDef,
  GridFilterModel,
  GridPaginationModel,
  GridRenderCellParams,
  GridSortModel,
} from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  AttendanceEmployeeFilterField,
  AttendanceEmployeeSortField,
  AttendanceEmployeeStatus,
  AttendanceEmploymentType,
  AttendanceLegalStatus,
  AttendanceLegalStatusObligation,
  AttendanceMember,
  AttendanceMemberPage,
  PayrollTerms,
} from "@/types/attendance";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization } from "@/types/organizations";

import {
  attendanceErrorKey,
  attendancePath,
  payrollPath,
} from "@/utils/attendance";
import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { getAttendanceEmployeeEnumOptions } from "@/utils/enumOptions";
import { fetcher } from "@/utils/fetcher";

const StyledStack = styled(Stack)({
  height: "100%",
  alignItems: "center",
});

const StyledIconButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== "visible",
})<{ visible: boolean }>(({ visible }) => ({
  visibility: visible ? "visible" : "hidden",
}));

const STATUS_COLORS: Record<
  AttendanceEmployeeStatus,
  "default" | "info" | "success" | "warning"
> = {
  unconfigured: "warning",
  upcoming: "info",
  active: "success",
  terminated: "default",
};

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface EmployeesProps {
  canDelete: boolean;
  canManageTerms: boolean;
  canWrite: boolean;
  filterField?: AttendanceEmployeeFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  legalStatusObligations: AttendanceLegalStatusObligation[];
  organization: Organization;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  rowCount: number;
  rows: AttendanceMember[];
  sortBy?: AttendanceEmployeeSortField;
  sortDirection?: SortDirection;
  terms: PayrollTerms[];
}

const Employees = ({
  canDelete,
  canManageTerms,
  canWrite,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  legalStatusObligations,
  organization: { currency = "", slug: organizationSlug },
  page,
  pageSize,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount,
  rows: initialRows,
  sortBy,
  sortDirection,
  terms: initialTerms,
}: EmployeesProps) => {
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: page - 1,
    pageSize,
  });

  const [sortModel, setSortModel] = useState<GridSortModel>(
    sortBy && sortDirection ? [{ field: sortBy, sort: sortDirection }] : [],
  );

  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items:
      initialFilterField &&
      initialFilterOperator &&
      (initialFilterValue ||
        NO_VALUE_FILTER_OPERATORS.includes(initialFilterOperator))
        ? [
            {
              field: initialFilterField,
              operator: initialFilterOperator,
              value:
                initialFilterOperator === "isAnyOf"
                  ? initialFilterValue?.split(",")
                  : initialFilterValue,
            },
          ]
        : [],
    quickFilterValues: initialQuickFilterValue ? [initialQuickFilterValue] : [],
  });

  const { setDialog } = useDialogStore((state) => state);

  const dateFilterOperators = useDateFilterOperators();
  const enumFilterOperators = useEnumFilterOperators();
  const stringFilterOperators = useStringFilterOperators();

  const apiRef = useGridApiRef();

  const format = useFormatter();

  const tAttendance = useTranslations("attendance");

  const updateQuery = useUpdateQuery();

  const enumOptions = useMemo(
    () => getAttendanceEmployeeEnumOptions(tAttendance),
    [tAttendance],
  );

  const date = useCallback(
    (value: string) => format.dateTime(new Date(value), "date"),
    [format],
  );

  const base = attendancePath(organizationSlug, "org", "members");

  const {
    data: { data: rows, total: rowCount } = {
      data: initialRows,
      total: initialRowCount,
    },
    isValidating: loading,
    mutate,
  } = useSWR(
    [base, paginationModel, filterModel, sortModel],
    () =>
      fetcher<AttendanceMemberPage>(
        `${base}?${getDataGridSearchParams(paginationModel, filterModel, sortModel, enumOptions)}`,
      ),
    {
      fallbackData: { data: initialRows, total: initialRowCount },
      onSuccess: () => {
        setTimeout(() => {
          apiRef.current?.autosizeColumns(autosizeOptions);
        }, 0);
      },
    },
  );

  const handlePaginationModelChange = useCallback(
    (newModel: GridPaginationModel) => {
      setPaginationModel(newModel);

      updateQuery({
        page: String(newModel.page + 1),
        pageSize: String(newModel.pageSize),
      });
    },
    [updateQuery],
  );

  const handleSortModelChange = useCallback(
    (newModel: GridSortModel) => {
      setSortModel(newModel);
      setPaginationModel((previous) => ({ ...previous, page: 0 }));

      updateQuery({
        page: "1",
        sortBy: newModel[0]?.field ?? "",
        sortDirection: newModel[0]?.sort ?? "",
      });
    },
    [updateQuery],
  );

  const handleFilterModelChange = useCallback(
    (newModel: GridFilterModel) => {
      setFilterModel(newModel);
      setPaginationModel((previous) => ({ ...previous, page: 0 }));

      const {
        filterField = "",
        filterOperator = "",
        filterValue = "",
      } = getFilterItemParams(newModel.items[0]);

      updateQuery({
        filterField,
        filterOperator,
        filterValue,
        page: "1",
        quickFilterValue: (newModel.quickFilterValues ?? []).join(" ").trim(),
      });
    },
    [updateQuery],
  );

  const handleEmployeeDialog = useCallback(
    (member: AttendanceMember) =>
      setDialog({
        confirmText: tAttendance("save"),
        content: (
          <EmployeeDialog
            legalStatusObligations={legalStatusObligations}
            member={member}
            mutate={mutate}
            organizationSlug={organizationSlug}
          />
        ),
        formId: "attendance-employee-form",
        open: true,
        title: tAttendance(
          member.employee
            ? "employees.actions.update"
            : "employees.actions.create",
        ),
      }),
    [legalStatusObligations, mutate, organizationSlug, setDialog, tAttendance],
  );

  const { data: terms = initialTerms, mutate: mutateTerms } = useSWR<
    PayrollTerms[]
  >(
    canManageTerms ? payrollPath(organizationSlug, "org", "terms") : null,
    fetcher,
    { fallbackData: initialTerms },
  );

  const handleTermsDialog = useCallback(
    ({ employee, status }: AttendanceMember) =>
      employee &&
      setDialog({
        confirmText: tAttendance("save"),
        content: (
          <TermsDialog
            currency={currency}
            employeeId={employee.id}
            employees={[{ ...employee, status }]}
            mutate={mutateTerms}
            organizationSlug={organizationSlug}
            terms={terms}
          />
        ),
        formId: "payroll-terms-form",
        open: true,
        title: tAttendance("payrollTerms"),
      }),
    [currency, mutateTerms, organizationSlug, setDialog, tAttendance, terms],
  );

  const handleDeleteEmployee = useCallback(
    ({ employee, name }: AttendanceMember) =>
      employee &&
      setDialog({
        content: (
          <DialogContentText>
            {tAttendance.rich("employees.actions.delete.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              name,
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          try {
            await fetcher(
              attendancePath(
                organizationSlug,
                "org",
                `employees/${employee.id}`,
              ),
              { method: "DELETE" },
            );

            enqueueSnackbar(
              tAttendance("employees.actions.delete.success", { name }),
              { variant: "success" },
            );

            mutate();
          } catch (error) {
            enqueueSnackbar(tAttendance(attendanceErrorKey(error)), {
              variant: "error",
            });
          }
        },
        open: true,
        title: tAttendance("employees.actions.delete.title"),
      }),
    [mutate, organizationSlug, setDialog, tAttendance],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      ...(canWrite || canDelete || canManageTerms
        ? [
            {
              disableColumnMenu: true,
              disableExport: true,
              field: "actions",
              filterable: false,
              headerName: tAttendance("actions"),
              renderCell: ({ row }: GridRenderCellParams<AttendanceMember>) => (
                <StyledStack direction="row">
                  {canWrite && (
                    <Tooltip
                      title={tAttendance(
                        row.employee
                          ? "employees.actions.update"
                          : "employees.actions.create",
                      )}
                    >
                      <IconButton
                        onClick={() => handleEmployeeDialog(row)}
                        size="small"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {canManageTerms && (
                    <Tooltip title={tAttendance("payrollTerms")}>
                      <StyledIconButton
                        onClick={() => handleTermsDialog(row)}
                        size="small"
                        visible={!!row.employee}
                      >
                        <Payments fontSize="small" />
                      </StyledIconButton>
                    </Tooltip>
                  )}
                  {canDelete && row.deletable && (
                    <Tooltip
                      title={tAttendance("employees.actions.delete.title")}
                    >
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteEmployee(row)}
                        size="small"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </StyledStack>
              ),
              resizable: false,
              sortable: false,
            },
          ]
        : []),
      {
        field: "name",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("employee"),
      },
      {
        field: "email",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("account"),
      },
      {
        field: "hiredAt",
        filterOperators: dateFilterOperators,
        headerName: tAttendance("hiredAt"),
        renderCell: renderEmptyableCell,
        valueGetter: (_, row: AttendanceMember) => row.employee?.hiredAt,
        valueFormatter: (value: string | undefined) =>
          value ? date(value) : "",
      },
      {
        field: "terminatedAt",
        filterOperators: dateFilterOperators,
        headerName: tAttendance("terminatedAt"),
        renderCell: renderEmptyableCell,
        valueGetter: (_, row: AttendanceMember) => row.employee?.terminatedAt,
        valueFormatter: (value: string | null | undefined) =>
          value ? date(value) : "",
      },
      {
        field: "employmentType",
        filterOperators: enumFilterOperators,
        headerName: tAttendance("employmentType.label"),
        renderCell: (params: GridRenderCellParams<AttendanceMember>) =>
          params.value ? (
            <Chip
              color={params.value === "fullTime" ? "primary" : "secondary"}
              label={params.formattedValue}
              size="small"
              variant="outlined"
            />
          ) : (
            renderEmptyableCell(params)
          ),
        type: "singleSelect",
        valueFormatter: (value: AttendanceEmploymentType | undefined) =>
          value ? tAttendance(`employmentType.options.${value}`) : "",
        valueGetter: (_, row: AttendanceMember) => row.employee?.employmentType,
        valueOptions: enumOptions.employmentType,
      },
      {
        field: "legalStatus",
        filterOperators: enumFilterOperators,
        headerName: tAttendance("legalStatus.label"),
        renderCell: renderEmptyableCell,
        type: "singleSelect",
        valueFormatter: (value: AttendanceLegalStatus | undefined) =>
          value ? tAttendance(`legalStatus.options.${value}`) : "",
        valueGetter: (_, row: AttendanceMember) => row.employee?.legalStatus,
        valueOptions: enumOptions.legalStatus,
      },
      {
        field: "status",
        filterOperators: enumFilterOperators,
        headerName: tAttendance("employeeStatus.label"),
        renderCell: ({
          row: { status },
        }: GridRenderCellParams<AttendanceMember>) => (
          <Chip
            color={STATUS_COLORS[status]}
            label={tAttendance(`employeeStatus.options.${status}`)}
            size="small"
            variant="outlined"
          />
        ),
        type: "singleSelect",
        valueOptions: enumOptions.status,
      },
    ],
    [
      canDelete,
      canManageTerms,
      canWrite,
      date,
      dateFilterOperators,
      enumFilterOperators,
      enumOptions.employmentType,
      enumOptions.legalStatus,
      enumOptions.status,
      handleDeleteEmployee,
      handleEmployeeDialog,
      handleTermsDialog,
      stringFilterOperators,
      tAttendance,
    ],
  );

  return (
    <DataGrid
      {...DATA_GRID_PROPS}
      apiRef={apiRef}
      columns={columns}
      filterMode="server"
      filterModel={filterModel}
      getRowId={({ userId }) => userId}
      loading={loading}
      onFilterModelChange={handleFilterModelChange}
      onPaginationModelChange={handlePaginationModelChange}
      onSortModelChange={handleSortModelChange}
      pageSizeOptions={getPageSizeOptions(paginationModel.pageSize)}
      paginationMode="server"
      paginationModel={paginationModel}
      rowCount={rowCount}
      rows={rows}
      sortingMode="server"
      sortModel={sortModel}
    />
  );
};

export default Employees;
