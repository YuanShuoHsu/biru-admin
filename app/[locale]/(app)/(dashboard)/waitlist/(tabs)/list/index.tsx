"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import WaitlistTicketDialog, {
  WAITLIST_TICKET_FORM_ID,
} from "../../WaitlistTicketDialog";

import AuditLogButton from "@/components/AuditLogButton";
import { renderEmptyableCell } from "@/components/EmptyCell";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import { getPageSizeOptions } from "@/constants/pagination";
import { WAITLIST_STATUS_COLORS } from "@/constants/waitlist";

import {
  useDateFilterOperators,
  useEnumFilterOperators,
  useNumberFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { Edit } from "@mui/icons-material";
import { Chip, IconButton, Stack, Tooltip } from "@mui/material";
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

import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization } from "@/types/organizations";
import type {
  AdminWaitlistResponse,
  WaitlistTicketFilterField,
  WaitlistTicketListItem,
  WaitlistTicketSortField,
} from "@/types/waitlist";

import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { getWaitlistEnumOptions } from "@/utils/enumOptions";
import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

const ActionsStack = styled(Stack)(({ theme }) => ({
  height: "100%",
  alignItems: "center",
  gap: theme.spacing(0.5),
}));

const StyledIconButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== "visible",
})<{ visible: boolean }>(({ visible }) => ({
  visibility: visible ? "visible" : "hidden",
}));

const isEditable = ({ status }: WaitlistTicketListItem) =>
  status === "waiting" || status === "called";

interface WaitlistTicketsProps {
  canUpdate: boolean;
  canViewAuditLog: boolean;
  filterField?: WaitlistTicketFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  organization: Organization;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  rowCount: number;
  rows: WaitlistTicketListItem[];
  sortBy?: WaitlistTicketSortField;
  sortDirection?: SortDirection;
}

const WaitlistTickets = ({
  canUpdate,
  canViewAuditLog,
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
}: WaitlistTicketsProps) => {
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

  const format = useFormatter();

  const apiRef = useGridApiRef();

  const tWaitlist = useTranslations("waitlist");

  const enumOptions = useMemo(
    () => getWaitlistEnumOptions(tWaitlist),
    [tWaitlist],
  );

  const {
    data: { data: rows, total: rowCount } = {
      data: initialRows,
      total: initialRowCount,
    },
    isValidating: loading,
    mutate,
  } = useSWR(
    [
      `/api/organizations/${organizationSlug}/waitlist/tickets/list`,
      filterModel.items[0]?.field,
      filterModel.items[0]?.operator,
      filterModel.items[0]?.value,
      filterModel.quickFilterValues,
      paginationModel.page,
      paginationModel.pageSize,
      sortModel,
    ],
    async ([url]) =>
      fetcher<{ data: WaitlistTicketListItem[]; total: number }>(
        `${url}?${getDataGridSearchParams(
          paginationModel,
          filterModel,
          sortModel,
          enumOptions,
        )}`,
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

  const stringFilterOperators = useStringFilterOperators();
  const enumFilterOperators = useEnumFilterOperators();
  const dateFilterOperators = useDateFilterOperators();
  const numberFilterOperators = useNumberFilterOperators();

  const updateQuery = useUpdateQuery();

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

  const handleEditDialog = useCallback(
    async (ticket: WaitlistTicketListItem) => {
      const groups = await fetcher<AdminWaitlistResponse>(
        `/api/organizations/${organizationSlug}/waitlist/tickets`,
      ).then(
        (waitlist) => waitlist.groups,
        (error) => {
          enqueueSnackbar(getErrorMessage(error), { variant: "error" });
        },
      );
      if (!groups) return;

      setDialog({
        content: (
          <WaitlistTicketDialog
            maxPartySize={Math.max(
              ...groups.map(({ maxPartySize }) => maxPartySize),
            )}
            mutate={() => mutate()}
            organizationSlug={organizationSlug}
            ticket={ticket}
          />
        ),
        formId: WAITLIST_TICKET_FORM_ID,
        open: true,
        title: tWaitlist("edit.label"),
      });
    },
    [mutate, organizationSlug, setDialog, tWaitlist],
  );

  const hasEditable = useMemo(
    () => canUpdate && rows.some(isEditable),
    [canUpdate, rows],
  );

  const columns = useMemo<GridColDef[]>(() => {
    const formatSameDayTime = (
      value: string | null,
      { createdAt }: WaitlistTicketListItem,
    ) => {
      if (!value) return "";

      const date = new Date(value);
      const isSameDay =
        format.dateTime(date, "date") ===
        format.dateTime(new Date(createdAt), "date");

      return format.dateTime(date, isSameDay ? "time" : "compact");
    };

    return [
      ...(hasEditable || canViewAuditLog
        ? [
            {
              disableColumnMenu: true,
              disableExport: true,
              field: "actions",
              filterable: false,
              headerName: tWaitlist("list.actions"),
              renderCell: ({
                row,
              }: GridRenderCellParams<WaitlistTicketListItem>) => (
                <ActionsStack direction="row">
                  {hasEditable && (
                    <Tooltip title={tWaitlist("edit.label")}>
                      <StyledIconButton
                        onClick={() => {
                          if (isEditable(row)) handleEditDialog(row);
                        }}
                        size="small"
                        visible={isEditable(row)}
                      >
                        <Edit fontSize="small" />
                      </StyledIconButton>
                    </Tooltip>
                  )}
                  {canViewAuditLog && <AuditLogButton resourceId={row.id} />}
                </ActionsStack>
              ),
              resizable: false,
              sortable: false,
            },
          ]
        : []),
      {
        field: "ticketNumber",
        filterOperators: stringFilterOperators,
        headerName: tWaitlist("list.ticketNumber"),
      },
      {
        field: "status",
        filterOperators: enumFilterOperators,
        headerName: tWaitlist("list.status"),
        renderCell: ({
          row: { status },
        }: GridRenderCellParams<WaitlistTicketListItem>) => (
          <Chip
            color={WAITLIST_STATUS_COLORS[status]}
            label={tWaitlist(`status.${status}`)}
            size="small"
            variant="outlined"
          />
        ),
        type: "singleSelect",
        valueOptions: enumOptions.status,
      },
      {
        field: "partySize",
        filterOperators: numberFilterOperators,
        headerName: tWaitlist("list.partySize"),
      },
      {
        field: "name",
        filterOperators: stringFilterOperators,
        headerName: tWaitlist("list.name"),
      },
      {
        field: "phoneNumber",
        filterOperators: stringFilterOperators,
        headerName: tWaitlist("list.phoneNumber"),
      },
      {
        field: "email",
        filterOperators: stringFilterOperators,
        headerName: tWaitlist("list.email"),
        renderCell: renderEmptyableCell,
      },
      {
        field: "createdAt",
        filterOperators: dateFilterOperators,
        headerName: tWaitlist("list.createdAt"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "short"),
      },
      {
        field: "calledAt",
        filterOperators: dateFilterOperators,
        headerName: tWaitlist("list.calledAt"),
        renderCell: renderEmptyableCell,
        valueFormatter: formatSameDayTime,
      },
      {
        field: "endedAt",
        filterOperators: dateFilterOperators,
        headerName: tWaitlist("list.endedAt"),
        renderCell: renderEmptyableCell,
        valueFormatter: formatSameDayTime,
      },
    ];
  }, [
    canViewAuditLog,
    dateFilterOperators,
    enumFilterOperators,
    enumOptions,
    format,
    handleEditDialog,
    hasEditable,
    numberFilterOperators,
    stringFilterOperators,
    tWaitlist,
  ]);

  return (
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
      slotProps={{
        ...DATA_GRID_PROPS.slotProps,
        toolbar: {
          exportDateField: "createdAt",
        },
      }}
    />
  );
};

export default WaitlistTickets;
