"use client";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR, { mutate as mutateCache } from "swr";

import TermsDialog from "../../payroll/statements/TermsDialog";
import TaxIdentityDialog from "../../payroll/withholding/TaxIdentityDialog";
import ChildrenDialog from "./ChildrenDialog";
import EmployeeDialog from "./EmployeeDialog";

import AuditLogButton from "@/components/AuditLogButton";
import DataGrid from "@/components/DataGrid";
import { renderEmptyableCell } from "@/components/EmptyCell";

import { EMPLOYEE_STATUS_COLORS } from "@/constants/attendance";
import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import { DEFAULT_PAGE_SIZE, getPageSizeOptions } from "@/constants/pagination";

import {
  useDateFilterOperators,
  useEnumFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
import { attendanceReviewCountsKey } from "@/hooks/useAttendanceReviewCounts";
import { useRowSelection } from "@/hooks/useRowSelection";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import {
  AssignmentInd,
  Cancel,
  Delete,
  Edit,
  Payments,
  Stroller,
} from "@mui/icons-material";
import {
  Button,
  Chip,
  DialogContentText,
  IconButton,
  List,
  ListItem,
  ListItemText,
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
  AttendanceEmployee,
  AttendanceEmployeeFilterField,
  AttendanceEmployeeSortField,
  AttendanceEmploymentType,
  AttendanceLegalStatus,
  AttendanceLegalStatusObligation,
  AttendanceMember,
  AttendanceMemberPage,
  AttendanceWorkPermitStatus,
  PayrollTerms,
} from "@/types/attendance";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization } from "@/types/organizations";

import { attendancePath, payrollPath } from "@/utils/attendance";
import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { getAttendanceEmployeeEnumOptions } from "@/utils/enumOptions";
import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

const ConfirmStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(1),
}));

const StyledStack = styled(Stack)({
  height: "100%",
  alignItems: "center",
});

const StyledIconButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== "visible",
})<{ visible: boolean }>(({ visible }) => ({
  visibility: visible ? "visible" : "hidden",
}));

const ToolbarStack = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  alignItems: "center",
  gap: theme.spacing(1),
}));

interface EmployeesProps {
  canDelete?: boolean;
  canDeleteChildren?: boolean;
  canUpdateChildren?: boolean;
  canManageChildren?: boolean;
  canManageTaxIdentity?: boolean;
  canManageTerms?: boolean;
  canReviewOwnChildren?: boolean;
  canViewAuditLog?: boolean;
  canWrite?: boolean;
  employeeId?: string;
  filterField?: AttendanceEmployeeFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  legalStatusObligations?: AttendanceLegalStatusObligation[];
  loading?: boolean;
  organization?: Organization;
  page?: number;
  pageSize?: number;
  quickFilterValue?: string;
  rowCount?: number;
  rows?: AttendanceMember[];
  sortBy?: AttendanceEmployeeSortField;
  sortDirection?: SortDirection;
  terms?: PayrollTerms[];
}

const Employees = ({
  canDelete = false,
  canDeleteChildren = false,
  canManageChildren = false,
  canUpdateChildren = false,
  canManageTaxIdentity = false,
  canManageTerms = false,
  canReviewOwnChildren = false,
  canViewAuditLog = false,
  canWrite = false,
  employeeId,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  legalStatusObligations = [],
  loading = false,
  organization,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount = 0,
  rows: initialRows = [],
  sortBy,
  sortDirection,
  terms: initialTerms = [],
}: EmployeesProps) => {
  const currency = organization?.currency ?? "";
  const organizationSlug = organization?.slug ?? "";

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
  const tCommon = useTranslations("common");

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
    isValidating,
    mutate,
  } = useSWR(
    !loading && [base, paginationModel, filterModel, sortModel],
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
        mutateCache(attendanceReviewCountsKey(organizationSlug));
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

  const hasEmployee = useMemo(
    () => rows.some(({ employee }) => employee),
    [rows],
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
    async (member: AttendanceMember) => {
      let employee: AttendanceEmployee | undefined;

      if (member.employee) {
        try {
          employee = await fetcher<AttendanceEmployee>(
            attendancePath(
              organizationSlug,
              "org",
              `employees/${member.employee.id}`,
            ),
          );
        } catch (error) {
          enqueueSnackbar(getErrorMessage(error), { variant: "error" });
          return;
        }
      }

      setDialog({
        confirmText: tAttendance("save"),
        content: (
          <EmployeeDialog
            employee={employee}
            legalStatusObligations={legalStatusObligations}
            member={member}
            mutate={mutate}
            organizationSlug={organizationSlug}
          />
        ),
        formId: "attendance-employee-form",
        open: true,
        title: tAttendance(
          employee ? "employees.actions.update" : "employees.actions.create",
        ),
      });
    },
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
    ({ email, employee, name }: AttendanceMember) =>
      employee &&
      setDialog({
        confirmText: tAttendance("save"),
        content: (
          <TermsDialog
            currency={currency}
            employeeId={employee.id}
            employees={[{ ...employee, email, name }]}
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

  const handleChildrenDialog = useCallback(
    ({ email, employee, name }: AttendanceMember) =>
      employee &&
      setDialog({
        confirmText: tAttendance("parentalChildren.actions.create"),
        content: (
          <ChildrenDialog
            canDelete={canDeleteChildren}
            canUpdate={canUpdateChildren}
            employee={{ email, id: employee.id, name }}
            mutate={mutate}
            organizationSlug={organizationSlug}
          />
        ),
        formId: "attendance-child-form",
        open: true,
        title: tAttendance("parentalChildren.title", { name }),
      }),
    [
      canDeleteChildren,
      canUpdateChildren,
      mutate,
      organizationSlug,
      setDialog,
      tAttendance,
    ],
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
    setIsSelectMode(true);
    setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
  }, [apiRef]);

  const handleSubmitEmployeeBatchDelete = useCallback(() => {
    const count = selectedRows.length;

    setDialog({
      content: (
        <ConfirmStack>
          <DialogContentText>
            {tAttendance.rich("employees.actions.batchDelete.submit.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              count,
            })}
          </DialogContentText>
          <List dense disablePadding>
            {selectedRows.map(({ name, userId }) => (
              <ListItem disableGutters key={userId}>
                <ListItemText primary={name} />
              </ListItem>
            ))}
          </List>
        </ConfirmStack>
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
    setIsSelectMode(false);
    clearRowSelection();

    setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
  }, [apiRef, clearRowSelection]);

  const columns = useMemo<GridColDef[]>(
    () => [
      ...((canWrite ||
        canDelete ||
        canManageTerms ||
        canManageTaxIdentity ||
        canViewAuditLog) &&
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
                  {canManageTerms && hasEmployee && (
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
                  {canManageTaxIdentity && hasEmployee && (
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
                  {canManageChildren && hasEmployee && (
                    <Tooltip
                      title={
                        !canReviewOwnChildren && row.employee?.id === employeeId
                          ? tAttendance("errors.cannotReviewSelf")
                          : tAttendance("parentalChildren.label")
                      }
                    >
                      <span>
                        <StyledIconButton
                          disabled={
                            !canReviewOwnChildren &&
                            row.employee?.id === employeeId
                          }
                          onClick={() => handleChildrenDialog(row)}
                          size="small"
                          visible={!!row.employee}
                        >
                          <Stroller fontSize="small" />
                        </StyledIconButton>
                      </span>
                    </Tooltip>
                  )}
                  {canViewAuditLog && row.employee && (
                    <AuditLogButton resourceId={row.employee.id} />
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
        headerName: `${tAttendance("terminatedAt")} ${tCommon("optional")}`,
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
        field: "workPermitStatus",
        filterOperators: enumFilterOperators,
        headerName: tAttendance("workPermits.daysLeft"),
        renderCell: (
          params: GridRenderCellParams<
            AttendanceMember,
            AttendanceWorkPermitStatus | null
          >,
        ) =>
          params.value === null ? (
            renderEmptyableCell(params)
          ) : params.value === "valid" ? (
            params.formattedValue
          ) : (
            <Chip
              color={params.value === "invalid" ? "error" : "warning"}
              label={params.formattedValue}
              size="small"
              variant="outlined"
            />
          ),
        type: "singleSelect",
        valueFormatter: (
          value: AttendanceWorkPermitStatus | null,
          { workPermitDaysLeft }: AttendanceMember,
        ) =>
          value === null
            ? ""
            : workPermitDaysLeft === null
              ? tAttendance("workPermits.invalid")
              : tAttendance("duration.days", { days: workPermitDaysLeft }),
        valueOptions: enumOptions.workPermitStatus,
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
      canManageChildren,
      canManageTaxIdentity,
      canManageTerms,
      canReviewOwnChildren,
      canViewAuditLog,
      canWrite,
      date,
      dateFilterOperators,
      enumFilterOperators,
      enumOptions.employmentType,
      enumOptions.legalStatus,
      enumOptions.status,
      enumOptions.workPermitStatus,
      employeeId,
      handleChildrenDialog,
      handleDeleteEmployee,
      handleEmployeeDialog,
      handleTaxIdentityDialog,
      handleTermsDialog,
      hasEmployee,
      isEmployeeSelectable,
      isSelectMode,
      stringFilterOperators,
      tAttendance,
      tCommon,
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
        loading={loading || isValidating}
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
