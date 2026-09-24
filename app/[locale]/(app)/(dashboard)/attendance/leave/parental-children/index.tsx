"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import ChildDialog from "./ChildDialog";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import { getPageSizeOptions } from "@/constants/pagination";

import {
  useDateFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { Add } from "@mui/icons-material";
import { Alert, Button } from "@mui/material";
import { styled } from "@mui/material/styles";
import type {
  GridColDef,
  GridFilterModel,
  GridPaginationModel,
  GridSortModel,
} from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  AttendanceEmployee,
  AttendanceParentalChild,
  AttendanceParentalChildFilterField,
  AttendanceParentalChildPage,
  AttendanceParentalChildSortField,
} from "@/types/attendance";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization } from "@/types/organizations";

import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { attendancePath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

const StyledButton = styled(Button)({
  alignSelf: "flex-start",
});

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface ParentalChildrenProps {
  canViewAll: boolean;
  canWrite: boolean;
  employeeId?: string;
  employees: AttendanceEmployee[];
  filterField?: AttendanceParentalChildFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  organization: Organization;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  rowCount: number;
  rows: AttendanceParentalChild[];
  sortBy?: AttendanceParentalChildSortField;
  sortDirection?: SortDirection;
}

const ParentalChildren = ({
  canViewAll,
  canWrite,
  employeeId,
  employees,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  organization: { slug: organizationSlug },
  page,
  pageSize,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount,
  rows: initialRows,
  sortBy,
  sortDirection,
}: ParentalChildrenProps) => {
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
  const stringFilterOperators = useStringFilterOperators();

  const apiRef = useGridApiRef();

  const format = useFormatter();

  const tAttendance = useTranslations("attendance");

  const updateQuery = useUpdateQuery();

  const date = useCallback(
    (value: string) => format.dateTime(new Date(value), "short"),
    [format],
  );

  const base = attendancePath(
    organizationSlug,
    canViewAll ? "org" : "me",
    "children",
  );

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
      fetcher<AttendanceParentalChildPage>(
        `${base}?${getDataGridSearchParams(paginationModel, filterModel, sortModel)}`,
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

  const handleCreateChild = useCallback(
    () =>
      setDialog({
        confirmText: tAttendance("save"),
        content: (
          <ChildDialog
            employeeId={employeeId}
            employees={employees}
            mutate={mutate}
            organizationSlug={organizationSlug}
          />
        ),
        formId: "attendance-child-form",
        open: true,
        title: tAttendance("parentalChildren.actions.create"),
      }),
    [employeeId, employees, mutate, organizationSlug, setDialog, tAttendance],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: "employeeName",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("employee"),
      },
      {
        field: "label",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("childLabel"),
      },
      {
        field: "reference",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("childReference"),
      },
      {
        field: "birthDate",
        filterOperators: dateFilterOperators,
        headerName: tAttendance("childBirthDate"),
        valueFormatter: (value: string) => date(value),
      },
    ],
    [date, dateFilterOperators, stringFilterOperators, tAttendance],
  );

  return (
    <>
      <Alert severity="info">{tAttendance("parentalChildHint")}</Alert>
      {canWrite && (
        <StyledButton
          onClick={handleCreateChild}
          size="small"
          startIcon={<Add />}
          variant="contained"
        >
          {tAttendance("parentalChildren.actions.create")}
        </StyledButton>
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

export default ParentalChildren;
