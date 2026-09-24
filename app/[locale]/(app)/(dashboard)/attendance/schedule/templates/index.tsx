"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import GenerateDialog from "../../GenerateDialog";
import TemplateDialog from "./TemplateDialog";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import { getPageSizeOptions } from "@/constants/pagination";

import {
  useBooleanFilterOperators,
  useEnumFilterOperators,
  useNumberFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { Add, Delete, Edit, EventRepeat } from "@mui/icons-material";
import { Button, Chip, IconButton, Stack, Tooltip } from "@mui/material";
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
  AttendanceTemplate,
  AttendanceTemplateFilterField,
  AttendanceTemplatePage,
  AttendanceTemplateSortField,
} from "@/types/attendance";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization } from "@/types/organizations";

import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { getAttendanceDayKindEnumOptions } from "@/utils/enumOptions";
import {
  attendanceErrorKey,
  attendancePath,
  weekdayDate,
} from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

const StyledStack = styled(Stack)(({ theme }) => ({
  height: "100%",
  alignItems: "center",
  gap: theme.spacing(1),
}));

const StyledButton = styled(Button)({
  alignSelf: "flex-start",
});

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface TemplatesProps {
  canCreate: boolean;
  canDelete: boolean;
  canGenerate: boolean;
  canUpdate: boolean;
  employees: AttendanceEmployee[];
  filterField?: AttendanceTemplateFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  organization: Organization;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  rowCount: number;
  rows: AttendanceTemplate[];
  sortBy?: AttendanceTemplateSortField;
  sortDirection?: SortDirection;
}

const Templates = ({
  canCreate,
  canDelete,
  canGenerate,
  canUpdate,
  employees,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  organization: { openingHours = "", slug: organizationSlug },
  page,
  pageSize,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount,
  rows: initialRows,
  sortBy,
  sortDirection,
}: TemplatesProps) => {
  const tAttendance = useTranslations("attendance");
  const format = useFormatter();
  const apiRef = useGridApiRef();

  const updateQuery = useUpdateQuery();

  const stringFilterOperators = useStringFilterOperators();
  const numberFilterOperators = useNumberFilterOperators();
  const enumFilterOperators = useEnumFilterOperators();
  const booleanFilterOperators = useBooleanFilterOperators();

  const enumOptions = useMemo(
    () => getAttendanceDayKindEnumOptions(tAttendance),
    [tAttendance],
  );

  const dayKindOptions = enumOptions.dayKind;

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

  const base = attendancePath(organizationSlug, "org", "templates");

  const {
    data: { data: rows, total: rowCount } = {
      data: initialRows,
      total: initialRowCount,
    },
    isValidating: loading,
    mutate,
  } = useSWR<AttendanceTemplatePage>(
    [base, paginationModel, filterModel, sortModel],
    () =>
      fetcher<AttendanceTemplatePage>(
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

  const { setDialog } = useDialogStore((state) => state);

  const handleTemplateDialog = useCallback(
    (template?: AttendanceTemplate) =>
      setDialog({
        confirmText: tAttendance("save"),
        content: (
          <TemplateDialog
            employees={employees}
            mutate={mutate}
            openingHours={openingHours}
            organizationSlug={organizationSlug}
            template={template}
          />
        ),
        formId: "attendance-template-form",
        open: true,
        title: tAttendance(
          template ? "templates.actions.update" : "templates.actions.create",
        ),
      }),
    [employees, mutate, openingHours, organizationSlug, setDialog, tAttendance],
  );

  const handleDeleteTemplate = useCallback(
    ({ id }: AttendanceTemplate) =>
      setDialog({
        contentText: tAttendance("confirm"),
        onConfirm: async () => {
          try {
            await fetcher(
              attendancePath(organizationSlug, "org", `templates/${id}`),
              { method: "DELETE" },
            );

            enqueueSnackbar(tAttendance("success"), { variant: "success" });
            mutate();
          } catch (error) {
            enqueueSnackbar(tAttendance(attendanceErrorKey(error)), {
              variant: "error",
            });
          }
        },
        open: true,
        title: tAttendance("templates.actions.delete"),
      }),
    [mutate, organizationSlug, setDialog, tAttendance],
  );

  const handleGenerateDialog = useCallback(
    (template: AttendanceTemplate) =>
      setDialog({
        confirmText: tAttendance("save"),
        content: (
          <GenerateDialog
            mutate={mutate}
            organizationSlug={organizationSlug}
            templateId={template.id}
          />
        ),
        formId: "attendance-template-generate-form",
        open: true,
        title: tAttendance("generate"),
      }),
    [mutate, organizationSlug, setDialog, tAttendance],
  );

  const weekday = useCallback(
    (day: number) => format.dateTime(weekdayDate(day), "weekdayLong"),
    [format],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      ...(canGenerate || canUpdate || canDelete
        ? [
            {
              disableColumnMenu: true,
              disableExport: true,
              field: "actions",
              filterable: false,
              headerName: tAttendance("actions"),
              renderCell: ({
                row,
              }: GridRenderCellParams<AttendanceTemplate>) => (
                <StyledStack direction="row">
                  {canGenerate && (
                    <Tooltip title={tAttendance("generate")}>
                      <IconButton
                        onClick={() => handleGenerateDialog(row)}
                        size="small"
                      >
                        <EventRepeat fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {canUpdate && (
                    <Tooltip title={tAttendance("templates.actions.update")}>
                      <IconButton
                        onClick={() => handleTemplateDialog(row)}
                        size="small"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {canDelete && (
                    <Tooltip title={tAttendance("templates.actions.delete")}>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteTemplate(row)}
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
        headerName: tAttendance("name"),
      },
      {
        field: "employeeName",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("employee"),
      },
      {
        field: "weekday",
        filterOperators: numberFilterOperators,
        headerName: tAttendance("weekday"),
        type: "number",
        valueFormatter: (value) => weekday(Number(value)),
      },
      {
        field: "startTime",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("startsAt"),
      },
      {
        field: "endTime",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("endsAt"),
        valueGetter: (value: string, row: AttendanceTemplate) =>
          row.nextDay ? `${tAttendance("nextDay")} ${value}` : value,
      },
      {
        field: "dayKind",
        filterOperators: enumFilterOperators,
        headerName: tAttendance("dayKind.label"),
        type: "singleSelect",
        valueOptions: dayKindOptions,
      },
      {
        field: "paidBreak",
        filterOperators: booleanFilterOperators,
        headerName: tAttendance("paidBreak"),
        type: "boolean",
        renderCell: ({
          row: { paidBreak },
        }: GridRenderCellParams<AttendanceTemplate>) => (
          <Chip
            color={paidBreak ? "success" : "default"}
            label={tAttendance(paidBreak ? "yes" : "no")}
            size="small"
            variant="outlined"
          />
        ),
      },
    ],
    [
      booleanFilterOperators,
      canDelete,
      canGenerate,
      canUpdate,
      dayKindOptions,
      enumFilterOperators,
      handleDeleteTemplate,
      handleGenerateDialog,
      handleTemplateDialog,
      numberFilterOperators,
      stringFilterOperators,
      tAttendance,
      weekday,
    ],
  );

  return (
    <>
      {canCreate && (
        <StyledButton
          onClick={() => handleTemplateDialog()}
          size="small"
          startIcon={<Add />}
          variant="contained"
        >
          {tAttendance("templates.actions.create")}
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

export default Templates;
