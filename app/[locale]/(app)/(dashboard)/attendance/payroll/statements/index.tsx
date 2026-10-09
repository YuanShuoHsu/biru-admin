"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import BatchReviewDialog from "../../BatchReviewDialog";
import BlockerList from "./BlockerList";
import DraftDialog from "./DraftDialog";
import EmployerSupplementDialog from "./EmployerSupplementDialog";
import TermsDialog from "./TermsDialog";

import { renderEmptyableCell } from "@/components/EmptyCell";

import { STORE_TIMEZONE } from "@/constants/timezone";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import { getPageSizeOptions } from "@/constants/pagination";

import {
  useEnumFilterOperators,
  useMonthFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
import { useFormatMoney } from "@/hooks/useFormatMoney";
import { useMonthFormat } from "@/hooks/useMonthFormat";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { Add, Check, ErrorOutlined, Publish } from "@mui/icons-material";
import { Button, IconButton, Stack, Tooltip } from "@mui/material";
import { styled } from "@mui/material/styles";
import type {
  GridColDef,
  GridFilterModel,
  GridPaginationModel,
  GridRenderCellParams,
  GridRowSelectionModel,
  GridSortModel,
} from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  AttendanceEmployee,
  PayrollEarningType,
  PayrollStatement,
  PayrollStatementListItem,
  PayrollStatementFilterField,
  PayrollStatementPage,
  PayrollStatementSortField,
  PayrollTerms,
} from "@/types/attendance";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization } from "@/types/organizations";

import {
  getDataGridSearchParams,
  getFilterItemParams,
  getSelectedRows,
} from "@/utils/dataGrid";
import { getPayrollStatementEnumOptions } from "@/utils/enumOptions";
import {
  fromCents,
  getPayrollAmountColumns,
  payrollPath,
} from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);
const ActionsStack = styled(Stack)({
  alignItems: "center",
  height: "100%",
});

const ToolbarStack = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  gap: theme.spacing(2),
}));

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface PayrollProps {
  canCreate: boolean;
  canViewCosts: boolean;
  canManage: boolean;
  canManageTerms: boolean;
  earningTypes: PayrollEarningType[];
  employees: AttendanceEmployee[];
  filterField?: PayrollStatementFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  organization: Organization;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  rowCount: number;
  rows: PayrollStatementListItem[];
  sortBy?: PayrollStatementSortField;
  sortDirection?: SortDirection;
  terms: PayrollTerms[];
}

const Payroll = ({
  canCreate,
  canViewCosts,
  canManage,
  canManageTerms,
  earningTypes,
  employees,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  organization: { currency = "", slug: organizationSlug },
  page,
  pageSize,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount,
  rows: initialRows,
  sortBy,
  sortDirection,
  terms: initialTerms,
}: PayrollProps) => {
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

  const [rowSelectionModel, setRowSelectionModel] =
    useState<GridRowSelectionModel>({ ids: new Set(), type: "include" });

  const { setDialog } = useDialogStore((state) => state);

  const enumFilterOperators = useEnumFilterOperators();
  const monthFilterOperators = useMonthFilterOperators();
  const stringFilterOperators = useStringFilterOperators();

  const monthFormat = useMonthFormat();

  const apiRef = useGridApiRef();

  const format = useFormatter();

  const formatMoney = useFormatMoney();

  const tAttendance = useTranslations("attendance");

  const updateQuery = useUpdateQuery();

  const enumOptions = useMemo(
    () => getPayrollStatementEnumOptions(tAttendance),
    [tAttendance],
  );

  const money = useCallback(
    (value: string) =>
      formatMoney(fromCents(value), currency, {
        minimumFractionDigits: 2,
      }),
    [currency, formatMoney],
  );

  const base = payrollPath(organizationSlug, "org", "statements");

  const handleEmployerSupplementDialog = useCallback(
    () =>
      setDialog({
        content: (
          <EmployerSupplementDialog
            currency={currency}
            organizationSlug={organizationSlug}
          />
        ),
        open: true,
        showConfirm: false,
        title: tAttendance("employerSupplement.label"),
      }),
    [currency, organizationSlug, setDialog, tAttendance],
  );

  const { data: terms = initialTerms, mutate: mutateTerms } = useSWR<
    PayrollTerms[]
  >(payrollPath(organizationSlug, "org", "terms"), fetcher, {
    fallbackData: initialTerms,
  });

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
      fetcher<PayrollStatementPage>(
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

  const handleTermsDialog = useCallback(
    (employeeId?: string) =>
      setDialog({
        confirmText: tAttendance("save"),
        content: (
          <TermsDialog
            currency={currency}
            employeeId={employeeId}
            employees={employees}
            mutate={mutateTerms}
            organizationSlug={organizationSlug}
            terms={terms}
          />
        ),
        formId: "payroll-terms-form",
        open: true,
        showConfirm: true,
        title: tAttendance("payrollTerms"),
      }),
    [
      currency,
      employees,
      mutateTerms,
      organizationSlug,
      setDialog,
      tAttendance,
      terms,
    ],
  );

  const handleDraftDialog = useCallback(
    () =>
      setDialog({
        confirmText: tAttendance("save"),
        content: (
          <DraftDialog
            currency={currency}
            earningTypes={earningTypes}
            employees={employees}
            mutate={mutate}
            organizationSlug={organizationSlug}
          />
        ),
        formId: "payroll-draft-form",
        open: true,
        title: tAttendance("payrollStatus.options.draft"),
      }),
    [
      currency,
      earningTypes,
      employees,
      mutate,
      organizationSlug,
      setDialog,
      tAttendance,
    ],
  );

  const handleTransitionDialog = useCallback(
    (statements: PayrollStatement[], action: "publish" | "review") =>
      setDialog({
        confirmText: tAttendance("save"),
        content: (
          <BatchReviewDialog
            labels={Object.fromEntries(
              statements.map(({ employeeName, id, month }) => [
                id,
                `${employeeName} · ${dayjs(month).format(monthFormat)}`,
              ]),
            )}
            method="PATCH"
            mutate={() => {
              setRowSelectionModel({ ids: new Set(), type: "include" });

              mutate();
            }}
            path={`${base}/${action}`}
            succeededMessage={(count) =>
              tAttendance(
                action === "publish"
                  ? "payroll.publishedCount"
                  : "payroll.reviewedCount",
                { count },
              )
            }
          />
        ),
        formId: "attendance-batch-review-form",
        open: true,
        title: tAttendance(action === "publish" ? "publish" : "approve"),
      }),
    [base, monthFormat, mutate, setDialog, tAttendance],
  );

  const handleBlockersDialog = useCallback(
    (statement: PayrollStatement) =>
      setDialog({
        content: (
          <BlockerList
            onEditTerms={
              canManageTerms
                ? () => handleTermsDialog(statement.employeeId)
                : undefined
            }
            statement={statement}
          />
        ),
        open: true,
        showConfirm: false,
        title: tAttendance("errors.payrollBlocked"),
      }),
    [canManageTerms, handleTermsDialog, setDialog, tAttendance],
  );

  const selectedRows = useMemo(
    () =>
      getSelectedRows(rows, rowSelectionModel).filter(
        ({ snapshot, status }) =>
          status !== "published" && !snapshot.blockers.length,
      ),
    [rowSelectionModel, rows],
  );

  const selectedDrafts = selectedRows.filter(
    ({ status }) => status === "draft",
  );
  const selectedReviewed = selectedRows.filter(
    ({ status }) => status === "reviewed",
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      ...(canManage
        ? [
            {
              disableColumnMenu: true,
              disableExport: true,
              field: "actions",
              filterable: false,
              headerName: tAttendance("actions"),
              renderCell: ({ row }: GridRenderCellParams<PayrollStatement>) =>
                row.status === "published" ? null : (
                  <ActionsStack direction="row">
                    {row.snapshot.blockers.length > 0 ? (
                      <Tooltip title={tAttendance("errors.payrollBlocked")}>
                        <IconButton
                          color="warning"
                          onClick={() => handleBlockersDialog(row)}
                          size="small"
                        >
                          <ErrorOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip
                        title={tAttendance(
                          row.status === "draft" ? "approve" : "publish",
                        )}
                      >
                        <IconButton
                          color="primary"
                          onClick={() =>
                            handleTransitionDialog(
                              [row],
                              row.status === "draft" ? "review" : "publish",
                            )
                          }
                          size="small"
                        >
                          {row.status === "draft" ? (
                            <Check fontSize="small" />
                          ) : (
                            <Publish fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                    )}
                  </ActionsStack>
                ),
              resizable: false,
              sortable: false,
            },
          ]
        : []),
      {
        field: "employeeName",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("employee"),
      },
      {
        field: "employeeEmail",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("account"),
      },
      {
        field: "month",
        filterOperators: monthFilterOperators,
        headerName: tAttendance("month"),
        valueFormatter: (value: string) => dayjs(value).format(monthFormat),
      },
      {
        field: "paidOn",
        filterable: false,
        headerName: tAttendance("paidOn"),
        renderCell: renderEmptyableCell,
        sortable: false,
        valueFormatter: (value: string | null) =>
          value
            ? format.dateTime(dayjs.tz(value, STORE_TIMEZONE).toDate(), "date")
            : "",
      },
      {
        field: "status",
        filterOperators: enumFilterOperators,
        headerName: tAttendance("status.label"),
        type: "singleSelect",
        valueOptions: enumOptions.status,
      },
      ...getPayrollAmountColumns(
        tAttendance,
        format,
        money,
        renderEmptyableCell,
      ),
      ...(canManage
        ? [
            {
              field: "reason",
              filterable: false,
              headerName: tAttendance("payroll.draftReason"),
              renderCell: renderEmptyableCell,
              sortable: false,
            },
            {
              field: "sourceNote",
              filterable: false,
              headerName: tAttendance("sourceNote"),
              sortable: false,
              valueGetter: (_value: unknown, { snapshot }: PayrollStatement) =>
                snapshot.terms.sourceNote,
            },
          ]
        : []),
    ],
    [
      canManage,
      enumFilterOperators,
      enumOptions.status,
      format,
      handleBlockersDialog,
      handleTransitionDialog,
      money,
      monthFilterOperators,
      monthFormat,
      stringFilterOperators,
      tAttendance,
    ],
  );

  return (
    <>
      {(canManageTerms || canCreate || canViewCosts || canManage) && (
        <ToolbarStack direction="row">
          {canManage && (
            <>
              <Button
                disabled={!selectedDrafts.length}
                onClick={() => handleTransitionDialog(selectedDrafts, "review")}
                size="small"
              >
                {tAttendance("payroll.reviewSelected", {
                  count: selectedDrafts.length,
                })}
              </Button>
              <Button
                disabled={!selectedReviewed.length}
                onClick={() =>
                  handleTransitionDialog(selectedReviewed, "publish")
                }
                size="small"
              >
                {tAttendance("payroll.publishSelected", {
                  count: selectedReviewed.length,
                })}
              </Button>
            </>
          )}
          {canViewCosts && (
            <Button onClick={handleEmployerSupplementDialog} size="small">
              {tAttendance("employerSupplement.label")}
            </Button>
          )}
          {canManageTerms && (
            <Button onClick={() => handleTermsDialog()} size="small">
              {tAttendance("payrollTerms")}
            </Button>
          )}
          {canCreate && (
            <Button
              onClick={handleDraftDialog}
              size="small"
              startIcon={<Add />}
              variant="contained"
            >
              {tAttendance("payrollStatus.options.draft")}
            </Button>
          )}
        </ToolbarStack>
      )}
      <DataGrid
        {...DATA_GRID_PROPS}
        apiRef={apiRef}
        checkboxSelection={canManage}
        columns={columns}
        filterMode="server"
        filterModel={filterModel}
        isRowSelectable={({ row }) =>
          row.status !== "published" && !row.snapshot.blockers.length
        }
        loading={loading}
        onFilterModelChange={handleFilterModelChange}
        onPaginationModelChange={handlePaginationModelChange}
        onRowSelectionModelChange={setRowSelectionModel}
        onSortModelChange={handleSortModelChange}
        rowSelectionModel={rowSelectionModel}
        pageSizeOptions={getPageSizeOptions(paginationModel.pageSize)}
        paginationMode="server"
        paginationModel={paginationModel}
        rowCount={rowCount}
        rows={rows}
        sortingMode="server"
        sortModel={sortModel}
        slotProps={{
          ...DATA_GRID_PROPS.slotProps,
          toolbar: {
            exportDateField: "month",
          },
        }}
      />
    </>
  );
};

export default Payroll;
