"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR, { mutate as mutateCache } from "swr";

import SubstituteDialog from "./SubstituteDialog";

import AuditLogButton from "@/components/AuditLogButton";
import {
  CustomizedDialogActions,
  CustomizedDialogContent,
} from "@/components/CustomizedDialogs";
import DataGrid from "@/components/DataGrid";
import { renderEmptyableCell } from "@/components/EmptyCell";

import { HOLIDAY_SUBSTITUTE_STATUS_COLORS } from "@/constants/attendance";
import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";
import { DEFAULT_PAGE_SIZE, getPageSizeOptions } from "@/constants/pagination";
import { STORE_TIMEZONE } from "@/constants/timezone";

import { attendanceReviewCountsKey } from "@/hooks/useAttendanceReviewCounts";
import {
  useDateFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
import { useRowSelection } from "@/hooks/useRowSelection";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { Cancel, EventAvailable, EventBusy } from "@mui/icons-material";
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
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  AttendanceHolidaySubstitute,
  AttendanceHolidaySubstituteFilterField,
  AttendanceHolidaySubstitutePage,
  AttendanceHolidaySubstituteSortField,
} from "@/types/attendance";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization } from "@/types/organizations";

import { attendancePath } from "@/utils/attendance";
import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const YearDatePicker = styled(DatePicker)({
  alignSelf: "flex-start",
});

const ActionsStack = styled(Stack)(({ theme }) => ({
  height: "100%",
  alignItems: "center",
  gap: theme.spacing(1),
}));

const ToolbarStack = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  alignItems: "center",
  gap: theme.spacing(1),
}));

interface HolidaySubstitutesProps {
  canUpdate?: boolean;
  canViewAuditLog?: boolean;
  filterField?: AttendanceHolidaySubstituteFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  loading?: boolean;
  organization?: Organization;
  page?: number;
  pageSize?: number;
  quickFilterValue?: string;
  rowCount?: number;
  rows?: AttendanceHolidaySubstitute[];
  sortBy?: AttendanceHolidaySubstituteSortField;
  sortDirection?: SortDirection;
  year?: number;
}

const HolidaySubstitutes = ({
  canUpdate = false,
  canViewAuditLog = false,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  loading = false,
  organization,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount = 0,
  rows: initialRows = [],
  sortBy,
  sortDirection,
  year: initialYear,
}: HolidaySubstitutesProps) => {
  const organizationSlug = organization?.slug ?? "";

  const [isSelectMode, setIsSelectMode] = useState(false);
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
    isValidating,
    mutate,
  } = useSWR(
    !loading && [
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
        mutateCache(attendanceReviewCountsKey(organizationSlug));
      },
    },
  );

  const isHolidaySubstituteSelectable = useCallback(
    ({ substituteId }: AttendanceHolidaySubstitute) => !!substituteId,
    [],
  );

  const {
    clearRowSelection,
    hasSelectableRows,
    rowSelectionProps,
    selectedRows,
  } = useRowSelection({
    enabled: isSelectMode,
    isRowSelectable: isHolidaySubstituteSelectable,
    rows,
  });

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
        content: (
          <>
            <CustomizedDialogContent>
              <DialogContentText>
                {tAttendance.rich("holidaySubstitutes.revokeConfirm", {
                  bold: (chunks) => <strong>{chunks}</strong>,
                  holiday: holidayName,
                  name: employeeName,
                })}
              </DialogContentText>
            </CustomizedDialogContent>
            <CustomizedDialogActions />
          </>
        ),
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
            enqueueSnackbar(getErrorMessage(error), {
              variant: "error",
            });
          }
        },
        open: true,
        title: tAttendance("holidaySubstitutes.actions.revoke"),
      }),
    [mutate, organizationSlug, setDialog, tAttendance],
  );

  const handleEnterHolidaySubstituteBatchRevokeMode = useCallback(() => {
    setDialog({
      content: (
        <>
          <CustomizedDialogContent>
            <DialogContentText>
              {tAttendance.rich(
                "holidaySubstitutes.actions.batchRevoke.confirm",
                {
                  bold: (chunks) => <strong>{chunks}</strong>,
                },
              )}
            </DialogContentText>
          </CustomizedDialogContent>
          <CustomizedDialogActions />
        </>
      ),
      onConfirm: async () => {
        setIsSelectMode(true);
        setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
      },
      open: true,
      title: tAttendance("holidaySubstitutes.actions.batchRevoke.title"),
    });
  }, [apiRef, setDialog, tAttendance]);

  const handleSubmitHolidaySubstituteBatchRevoke = useCallback(() => {
    const count = selectedRows.length;

    setDialog({
      content: (
        <>
          <CustomizedDialogContent>
            <DialogContentText>
              {tAttendance.rich(
                "holidaySubstitutes.actions.batchRevoke.submit.confirm",
                {
                  bold: (chunks) => <strong>{chunks}</strong>,
                  count,
                },
              )}
            </DialogContentText>
          </CustomizedDialogContent>
          <CustomizedDialogActions />
        </>
      ),
      onConfirm: async () => {
        try {
          await fetcher(
            attendancePath(organizationSlug, "org", "holiday-substitutes"),
            {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ids: selectedRows.flatMap(
                  ({ substituteId }) => substituteId ?? [],
                ),
              }),
            },
          );

          setIsSelectMode(false);
          clearRowSelection();

          setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);

          enqueueSnackbar(
            tAttendance(
              "holidaySubstitutes.actions.batchRevoke.submit.success",
              { count },
            ),
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
      title: tAttendance(
        "holidaySubstitutes.actions.batchRevoke.submit.label",
        { count },
      ),
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

  const handleCancelHolidaySubstituteBatchRevoke = useCallback(() => {
    setDialog({
      content: (
        <>
          <CustomizedDialogContent>
            <DialogContentText>
              {tAttendance.rich(
                "holidaySubstitutes.actions.batchRevoke.cancel.confirm",
                {
                  bold: (chunks) => <strong>{chunks}</strong>,
                },
              )}
            </DialogContentText>
          </CustomizedDialogContent>
          <CustomizedDialogActions />
        </>
      ),
      onConfirm: async () => {
        setIsSelectMode(false);
        clearRowSelection();

        setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
      },
      open: true,
      title: tAttendance("holidaySubstitutes.actions.batchRevoke.cancel.label"),
    });
  }, [apiRef, clearRowSelection, setDialog, tAttendance]);

  const columns = useMemo<GridColDef[]>(
    () => [
      ...((canUpdate || canViewAuditLog) && !isSelectMode
        ? [
            {
              disableColumnMenu: true,
              disableExport: true,
              field: "actions",
              filterable: false,
              headerName: tAttendance("actions"),
              renderCell: ({
                row,
              }: GridRenderCellParams<AttendanceHolidaySubstitute>) => (
                <ActionsStack direction="row">
                  {canUpdate &&
                    (row.substituteId ? (
                      <Tooltip
                        title={tAttendance("holidaySubstitutes.actions.revoke")}
                      >
                        <IconButton
                          onClick={() => handleRevoke(row)}
                          size="small"
                        >
                          <EventBusy fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip
                        title={tAttendance(
                          "holidaySubstitutes.actions.designate",
                        )}
                      >
                        <IconButton
                          onClick={() => handleDesignate(row)}
                          size="small"
                        >
                          <EventAvailable fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ))}
                  {canViewAuditLog && row.substituteId && (
                    <AuditLogButton resourceId={row.substituteId} />
                  )}
                </ActionsStack>
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
        field: "employeeEmail",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("account"),
      },
      {
        field: "holidayDate",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("holidaySubstitutes.holidayDate"),
        valueFormatter: (value: string) =>
          format.dateTime(dayjs.tz(value, STORE_TIMEZONE).toDate(), "date"),
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
          value ? format.dateTime(new Date(value), "date") : "",
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
              color={HOLIDAY_SUBSTITUTE_STATUS_COLORS[status]}
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
      canViewAuditLog,
      dateFilterOperators,
      format,
      handleDesignate,
      handleRevoke,
      isSelectMode,
      stringFilterOperators,
      tAttendance,
    ],
  );

  return (
    <>
      <ToolbarStack direction="row">
        {!isSelectMode && (
          <>
            <YearDatePicker
              disabled={loading}
              label={tAttendance("year")}
              onChange={(value) =>
                value?.isValid() && handleYearChange(value.year())
              }
              value={year ? dayjs(`${year}-01-01`) : null}
              views={["year"]}
            />
            {canUpdate && (
              <Button
                disabled={!hasSelectableRows}
                onClick={handleEnterHolidaySubstituteBatchRevokeMode}
                size="small"
                startIcon={<EventBusy />}
                variant="outlined"
              >
                {tAttendance("holidaySubstitutes.actions.batchRevoke.title")}
              </Button>
            )}
          </>
        )}
        {isSelectMode && (
          <>
            <Button
              onClick={handleCancelHolidaySubstituteBatchRevoke}
              size="small"
              startIcon={<Cancel />}
              variant="outlined"
            >
              {tAttendance(
                "holidaySubstitutes.actions.batchRevoke.cancel.label",
              )}
            </Button>
            <Button
              color="error"
              disabled={!selectedRows.length}
              onClick={handleSubmitHolidaySubstituteBatchRevoke}
              size="small"
              startIcon={<EventBusy />}
              variant="contained"
            >
              {tAttendance(
                "holidaySubstitutes.actions.batchRevoke.submit.label",
                { count: selectedRows.length },
              )}
            </Button>
          </>
        )}
      </ToolbarStack>
      <DataGrid
        {...DATA_GRID_PROPS}
        {...rowSelectionProps}
        apiRef={apiRef}
        columns={columns}
        filterMode="server"
        filterModel={filterModel}
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

export default HolidaySubstitutes;
