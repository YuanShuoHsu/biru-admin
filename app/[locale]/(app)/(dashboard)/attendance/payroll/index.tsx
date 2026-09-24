"use client";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import DraftDialog from "./DraftDialog";
import TermsDialog from "./TermsDialog";
import TransitionDialog from "./TransitionDialog";

import StatementDialogContent from "../StatementDialogContent";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import { getPageSizeOptions } from "@/constants/pagination";

import {
  useEnumFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
import { useFormatMoney } from "@/hooks/useFormatMoney";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { Add, Receipt } from "@mui/icons-material";
import { Button, IconButton, Stack, Tooltip } from "@mui/material";
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
  PayrollStatement,
  PayrollStatementFilterField,
  PayrollStatementPage,
  PayrollStatementSortField,
  PayrollTerms,
} from "@/types/attendance";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";

import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { getPayrollStatementEnumOptions } from "@/utils/enumOptions";
import { fromCents, payrollPath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

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
  canManage: boolean;
  canManageTerms: boolean;
  currency: string;
  employees: AttendanceEmployee[];
  filterField?: PayrollStatementFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  organizationSlug: string;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  rowCount: number;
  rows: PayrollStatement[];
  sortBy?: PayrollStatementSortField;
  sortDirection?: SortDirection;
  terms: PayrollTerms[];
}

const Payroll = ({
  canCreate,
  canManage,
  canManageTerms,
  currency,
  employees,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  organizationSlug,
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

  const { setDialog } = useDialogStore((state) => state);

  const enumFilterOperators = useEnumFilterOperators();
  const stringFilterOperators = useStringFilterOperators();

  const apiRef = useGridApiRef();

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
    () =>
      setDialog({
        confirmText: tAttendance("save"),
        content: (
          <TermsDialog
            currency={currency}
            employees={employees}
            mutate={mutateTerms}
            organizationSlug={organizationSlug}
            terms={terms}
          />
        ),
        formId: "payroll-terms-form",
        open: true,
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
            employees={employees}
            mutate={mutate}
            organizationSlug={organizationSlug}
          />
        ),
        formId: "payroll-draft-form",
        open: true,
        title: tAttendance("payrollStatus.options.draft"),
      }),
    [employees, mutate, organizationSlug, setDialog, tAttendance],
  );

  const handleTransitionDialog = useCallback(
    (statement: PayrollStatement) =>
      setDialog({
        confirmText: tAttendance("save"),
        content: (
          <TransitionDialog
            action={statement.status === "draft" ? "review" : "publish"}
            mutate={mutate}
            organizationSlug={organizationSlug}
            statement={statement}
          />
        ),
        formId: "payroll-transition-form",
        open: true,
        title: tAttendance(
          statement.status === "draft" ? "approve" : "publish",
        ),
      }),
    [mutate, organizationSlug, setDialog, tAttendance],
  );

  const handleStatementDialog = useCallback(
    (statement: PayrollStatement) =>
      setDialog({
        content: (
          <StatementDialogContent
            canManage={canManage}
            currency={currency}
            onTransition={() => handleTransitionDialog(statement)}
            statement={statement}
          />
        ),
        open: true,
        showConfirm: false,
        title: `${statement.employeeName} · ${statement.month}`,
      }),
    [canManage, currency, handleTransitionDialog, setDialog],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        disableColumnMenu: true,
        disableExport: true,
        field: "actions",
        filterable: false,
        headerName: tAttendance("actions"),
        renderCell: ({ row }: GridRenderCellParams<PayrollStatement>) => (
          <ActionsStack direction="row">
            <Tooltip title={tAttendance("payroll.actions.view")}>
              <IconButton
                onClick={() => handleStatementDialog(row)}
                size="small"
              >
                <Receipt fontSize="small" />
              </IconButton>
            </Tooltip>
          </ActionsStack>
        ),
        resizable: false,
        sortable: false,
      },
      {
        field: "employeeName",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("employee"),
      },
      {
        field: "month",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("month"),
      },
      {
        field: "status",
        filterOperators: enumFilterOperators,
        headerName: tAttendance("status.label"),
        type: "singleSelect",
        valueOptions: enumOptions.status,
      },
      {
        field: "gross",
        filterable: false,
        headerName: tAttendance("gross"),
        sortable: false,
        valueFormatter: (value: string) => money(value),
        valueGetter: (_value: unknown, { snapshot }: PayrollStatement) =>
          snapshot.grossCents,
      },
      {
        field: "net",
        filterable: false,
        headerName: tAttendance("net"),
        sortable: false,
        valueFormatter: (value: string) => money(value),
        valueGetter: (_value: unknown, { snapshot }: PayrollStatement) =>
          snapshot.netCents,
      },
    ],
    [
      enumFilterOperators,
      enumOptions.status,
      handleStatementDialog,
      money,
      stringFilterOperators,
      tAttendance,
    ],
  );

  return (
    <>
      {(canManageTerms || canCreate) && (
        <ToolbarStack direction="row">
          {canManageTerms && (
            <Button onClick={handleTermsDialog} size="small">
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
        columns={columns}
        filterMode="server"
        filterModel={filterModel}
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

export default Payroll;
