"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import SubstituteDialog from "./SubstituteDialog";

import { renderEmptyableCell } from "@/components/EmptyCell";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";
import { getPageSizeOptions } from "@/constants/pagination";
import { STORE_TIMEZONE } from "@/constants/timezone";

import {
  useDateFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { EventAvailable, EventBusy } from "@mui/icons-material";
import { Chip, IconButton, MenuItem, TextField, Tooltip } from "@mui/material";
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
  AttendanceHolidaySubstitute,
  AttendanceHolidaySubstituteFilterField,
  AttendanceHolidaySubstitutePage,
  AttendanceHolidaySubstituteSortField,
} from "@/types/attendance";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization } from "@/types/organizations";

import { attendanceErrorKey, attendancePath } from "@/utils/attendance";
import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { fetcher } from "@/utils/fetcher";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

const YearTextField = styled(TextField)({
  alignSelf: "flex-start",
});

interface HolidaySubstitutesProps {
  canUpdate: boolean;
  filterField?: AttendanceHolidaySubstituteFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  organization: Organization;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  rowCount: number;
  rows: AttendanceHolidaySubstitute[];
  sortBy?: AttendanceHolidaySubstituteSortField;
  sortDirection?: SortDirection;
  year: number;
}

const HolidaySubstitutes = ({
  canUpdate,
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
  year: initialYear,
}: HolidaySubstitutesProps) => {
  const [year, setYear] = useState(initialYear);

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: page - 1,
    pageSize,
  });

  const [sortModel, setSortModel] = useState<GridSortModel>(
    sortBy && sortDirection ? [{ field: sortBy, sort: sortDirection }] : [],
  );

  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items:
      initialFilterField && initialFilterOperator && initialFilterValue
        ? [
            {
              field: initialFilterField,
              operator: initialFilterOperator,
              value: initialFilterValue,
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

  const {
    data: { data: rows, total: rowCount } = {
      data: initialRows,
      total: initialRowCount,
    },
    isValidating: loading,
    mutate,
  } = useSWR(
    [
      "attendance-holiday-substitutes",
      organizationSlug,
      year,
      paginationModel,
      filterModel,
      sortModel,
    ],
    () => {
      const params = getDataGridSearchParams(
        paginationModel,
        filterModel,
        sortModel,
      );

      params.set("year", String(year));

      return fetcher<AttendanceHolidaySubstitutePage>(
        `${attendancePath(organizationSlug, "org", "holiday-substitutes")}?${params}`,
      );
    },
    {
      fallbackData: { data: initialRows, total: initialRowCount },
      onSuccess: () => {
        setTimeout(() => {
          apiRef.current?.autosizeColumns(autosizeOptions);
        }, 0);
      },
    },
  );

  const handleYearChange = useCallback(
    (value: number) => {
      setYear(value);
      setPaginationModel((previous) => ({ ...previous, page: 0 }));

      updateQuery({ page: "1", year: String(value) });
    },
    [updateQuery],
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

  const handleDesignate = useCallback(
    (row: AttendanceHolidaySubstitute) =>
      setDialog({
        confirmText: tAttendance("save"),
        content: (
          <SubstituteDialog
            mutate={mutate}
            organizationSlug={organizationSlug}
            row={row}
          />
        ),
        formId: "attendance-holiday-substitute-form",
        open: true,
        title: tAttendance("holidaySubstitutes.actions.designate"),
      }),
    [mutate, organizationSlug, setDialog, tAttendance],
  );

  const handleRevoke = useCallback(
    ({
      employeeName,
      holidayName,
      substituteId,
    }: AttendanceHolidaySubstitute) =>
      setDialog({
        contentText: tAttendance("confirm"),
        onConfirm: async () => {
          try {
            await fetcher(
              attendancePath(
                organizationSlug,
                "org",
                `holiday-substitutes/${substituteId}`,
              ),
              { method: "DELETE" },
            );

            enqueueSnackbar(
              tAttendance("holidaySubstitutes.substituteRevoked", {
                holiday: holidayName,
                name: employeeName,
              }),
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
        title: tAttendance("holidaySubstitutes.actions.revoke"),
      }),
    [mutate, organizationSlug, setDialog, tAttendance],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      ...(canUpdate
        ? [
            {
              disableColumnMenu: true,
              disableExport: true,
              field: "actions",
              filterable: false,
              headerName: tAttendance("actions"),
              renderCell: ({
                row,
              }: GridRenderCellParams<AttendanceHolidaySubstitute>) =>
                row.substituteId ? (
                  <Tooltip
                    title={tAttendance("holidaySubstitutes.actions.revoke")}
                  >
                    <IconButton onClick={() => handleRevoke(row)} size="small">
                      <EventBusy fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Tooltip
                    title={tAttendance("holidaySubstitutes.actions.designate")}
                  >
                    <IconButton
                      onClick={() => handleDesignate(row)}
                      size="small"
                    >
                      <EventAvailable fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ),
              resizable: false,
              sortable: false,
            } satisfies GridColDef,
          ]
        : []),
      {
        field: "employeeName",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("employee"),
      },
      {
        field: "holidayDate",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("holidaySubstitutes.holidayDate"),
        valueFormatter: (value: string) =>
          format.dateTime(dayjs.tz(value, STORE_TIMEZONE).toDate(), "short"),
      },
      {
        field: "holidayName",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("holidaySubstitutes.holidayName"),
      },
      {
        field: "substituteStartsAt",
        filterOperators: dateFilterOperators,
        headerName: tAttendance("holidaySubstitutes.substituteDate"),
        renderCell: renderEmptyableCell,
        valueFormatter: (value: string | null) =>
          value ? format.dateTime(new Date(value), "short") : "",
      },
      {
        field: "status",
        filterable: false,
        headerName: tAttendance("status.label"),
        renderCell: ({
          row: { owed, substituteId },
        }: GridRenderCellParams<AttendanceHolidaySubstitute>) => {
          const status = !owed
            ? "notOwed"
            : substituteId
              ? "designated"
              : "pending";

          return (
            <Chip
              color={status === "pending" ? "warning" : "default"}
              label={tAttendance(`holidaySubstitutes.status.${status}`)}
              size="small"
            />
          );
        },
        sortable: false,
      },
    ],
    [
      canUpdate,
      dateFilterOperators,
      format,
      handleDesignate,
      handleRevoke,
      stringFilterOperators,
      tAttendance,
    ],
  );

  return (
    <>
      <YearTextField
        label={tAttendance("year")}
        onChange={(event) => handleYearChange(Number(event.target.value))}
        select
        size="small"
        value={year}
      >
        {[initialYear - 1, initialYear, initialYear + 1].map((value) => (
          <MenuItem key={value} value={value}>
            {value}
          </MenuItem>
        ))}
      </YearTextField>
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

export default HolidaySubstitutes;
