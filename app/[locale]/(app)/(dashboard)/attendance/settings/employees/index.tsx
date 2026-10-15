"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import { enqueueSnackbar } from "notistack";
import useSWR from "swr";

import TermsDialog from "../../payroll/statements/TermsDialog";
import TaxIdentityDialog from "../../payroll/withholding/TaxIdentityDialog";
import EmployeeDialog from "./EmployeeDialog";

import { renderEmptyableCell } from "@/components/EmptyCell";
import { EMPLOYEE_STATUS_COLORS } from "@/constants/attendance";
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
import { useRowSelection } from "@/hooks/useRowSelection";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";
import {
  AssignmentInd,
  Cancel,
  Delete,
  Edit,
  Payments,
} from "@mui/icons-material";
import {
  Button,
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
  AttendanceEmploymentType,
  AttendanceLegalStatus,
  AttendanceLegalStatusObligation,
  AttendanceMember,
  AttendanceMemberPage,
  PayrollTerms,
} from "@/types/attendance";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization } from "@/types/organizations";

import { attendancePath, payrollPath } from "@/utils/attendance";
import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { getAttendanceEmployeeEnumOptions } from "@/utils/enumOptions";
import { fetcher } from "@/utils/fetcher";
import { getErrorMessage } from "@/utils/errors";

const StyledStack = styled(Stack)({
  height: "100%",
  alignItems: "center",
});

const ToolbarStack = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  alignItems: "center",
  gap: theme.spacing(1),
}));

const StyledIconButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== "visible",
})<{ visible: boolean }>(({ visible }) => ({
  visibility: visible ? "visible" : "hidden",
}));

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface EmployeesProps {
  canDelete: boolean;
  canManageTaxIdentity: boolean;
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
  canManageTaxIdentity,
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
  const [isSelectMode, setIsSelectMode] = useState(false);
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

  const getEmployeeRowId = useCallback(
    ({ userId }: AttendanceMember) => userId,
    [],
  );

  const isEmployeeSelectable = useCallback(
    ({ deletable, employee }: AttendanceMember) => deletable && !!employee,
    [],
  );

  const {
    clearRowSelection,
    hasSelectableRows,
    rowSelectionProps,
    selectedRows,
  } = useRowSelection({
    enabled: isSelectMode,
    getRowId: getEmployeeRowId,
    isRowSelectable: isEmployeeSelectable,
    rows,
  });

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

  const handleTaxIdentityDialog = useCallback(
    ({ employee, name }: AttendanceMember) =>
      employee &&
      setDialog({
        confirmText: tAttendance("save"),
        content: (
          <TaxIdentityDialog
            employeeId={employee.id}
            foreign={employee.foreignTaxIdentityRequired}
            mutate={mutate}
            organizationSlug={organizationSlug}
          />
        ),
        formId: "payroll-tax-identity-form",
        open: true,
        title: tAttendance("withholding.identity.title", { name }),
      }),
    [mutate, organizationSlug, setDialog, tAttendance],
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
            enqueueSnackbar(getErrorMessage(error), {
              variant: "error",
            });
          }
        },
        open: true,
        title: tAttendance("employees.actions.delete.title"),
      }),
    [mutate, organizationSlug, setDialog, tAttendance],
  );

  const handleEnterEmployeeBatchDeleteMode = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tAttendance.rich("employees.actions.batchDelete.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        setIsSelectMode(true);
        setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
      },
      open: true,
      title: tAttendance("employees.actions.batchDelete.title"),
    });
  }, [apiRef, setDialog, tAttendance]);

  const handleSubmitEmployeeBatchDelete = useCallback(() => {
    const count = selectedRows.length;

    setDialog({
      content: (
        <DialogContentText>
          {tAttendance.rich("employees.actions.batchDelete.submit.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
            count,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        try {
          await fetcher(attendancePath(organizationSlug, "org", "employees"), {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ids: selectedRows.flatMap(({ employee }) => employee?.id ?? []),
            }),
          });

          setIsSelectMode(false);
          clearRowSelection();

          setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);

          enqueueSnackbar(
            tAttendance("employees.actions.batchDelete.submit.success", {
              count,
            }),
            {
              variant: "success",
            },
          );
        } catch (error) {
          enqueueSnackbar(getErrorMessage(error), {
            variant: "error",
          });
        }

        mutate();
      },
      open: true,
      title: tAttendance("employees.actions.batchDelete.submit.label", {
        count,
      }),
    });
  }, [
    apiRef,
    clearRowSelection,
    mutate,
    organizationSlug,
    selectedRows,
    setDialog,
    tAttendance,
  ]);

  const handleCancelEmployeeBatchDelete = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tAttendance.rich("employees.actions.batchDelete.cancel.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        setIsSelectMode(false);
        clearRowSelection();

        setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
      },
      open: true,
      title: tAttendance("employees.actions.batchDelete.cancel.label"),
    });
  }, [apiRef, clearRowSelection, setDialog, tAttendance]);

  const columns = useMemo<GridColDef[]>(
    () => [
      ...((canWrite || canDelete || canManageTerms || canManageTaxIdentity) &&
      !isSelectMode
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
                  {canManageTaxIdentity && (
                    <Tooltip title={tAttendance("withholding.identity.edit")}>
                      <StyledIconButton
                        onClick={() => handleTaxIdentityDialog(row)}
                        size="small"
                        visible={!!row.employee}
                      >
                        <AssignmentInd fontSize="small" />
                      </StyledIconButton>
                    </Tooltip>
                  )}
                  {canDelete && isEmployeeSelectable(row) && (
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
            color={EMPLOYEE_STATUS_COLORS[status]}
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
      canManageTaxIdentity,
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
      handleTaxIdentityDialog,
      handleTermsDialog,
      isEmployeeSelectable,
      isSelectMode,
      stringFilterOperators,
      tAttendance,
    ],
  );

  return (
    <>
      {canDelete && (
        <ToolbarStack direction="row">
          {!isSelectMode && (
            <Button
              disabled={!hasSelectableRows}
              onClick={handleEnterEmployeeBatchDeleteMode}
              size="small"
              startIcon={<Delete />}
              variant="outlined"
            >
              {tAttendance("employees.actions.batchDelete.title")}
            </Button>
          )}
          {isSelectMode && (
            <>
              <Button
                onClick={handleCancelEmployeeBatchDelete}
                size="small"
                startIcon={<Cancel />}
                variant="outlined"
              >
                {tAttendance("employees.actions.batchDelete.cancel.label")}
              </Button>
              <Button
                color="error"
                disabled={!selectedRows.length}
                onClick={handleSubmitEmployeeBatchDelete}
                size="small"
                startIcon={<Delete />}
                variant="contained"
              >
                {tAttendance("employees.actions.batchDelete.submit.label", {
                  count: selectedRows.length,
                })}
              </Button>
            </>
          )}
        </ToolbarStack>
      )}
      <DataGrid
        {...DATA_GRID_PROPS}
        {...rowSelectionProps}
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
    </>
  );
};

export default Employees;
