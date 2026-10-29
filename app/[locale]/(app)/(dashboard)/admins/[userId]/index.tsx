"use client";

import type { UserWithRole } from "better-auth/client/plugins";
import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR, { useSWRConfig } from "swr";

import RevokeUserSessionDialogContent from "./RevokeUserSessionDialogContent";

import DataGrid from "@/components/DataGrid";
import { renderEmptyableCell } from "@/components/EmptyCell";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import { DEFAULT_PAGE_SIZE, getPageSizeOptions } from "@/constants/pagination";

import { deviceSessionsKey } from "@/hooks/useDeviceSessions";
import {
  useDateFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
import { useRowSelection } from "@/hooks/useRowSelection";
import { useSession } from "@/hooks/useSession";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { Cancel, DeleteOutlined } from "@mui/icons-material";
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
  UserSession,
  UserSessionFilterField,
  UserSessionListResponse,
  UserSessionSortField,
} from "@/types/admins";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";

import { formatUserAgent, isActiveSession } from "@/utils/auth";
import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

const ActionsStack = styled(Stack)(({ theme }) => ({
  height: "100%",
  alignItems: "center",
  gap: theme.spacing(1),
}));

const ExpiresAtStack = styled(Stack)(({ theme }) => ({
  height: "100%",
  alignItems: "center",
  gap: theme.spacing(1),
}));

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

interface UserSessionsProps {
  filterField?: UserSessionFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  loading?: boolean;
  page?: number;
  pageSize?: number;
  quickFilterValue?: string;
  rowCount?: number;
  rows?: UserSession[];
  sortBy?: UserSessionSortField;
  sortDirection?: SortDirection;
  user?: UserWithRole;
}

const UserSessions = ({
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  loading = false,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount = 0,
  rows: initialRows = [],
  sortBy,
  sortDirection,
  user,
}: UserSessionsProps) => {
  const userEmail = user?.email ?? "";
  const userId = user?.id ?? "";

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
              value: initialFilterValue,
            },
          ]
        : [],
    quickFilterValues: initialQuickFilterValue ? [initialQuickFilterValue] : [],
  });

  const apiRef = useGridApiRef();

  const currentSession = useSession();

  const { setDialog } = useDialogStore((state) => state);

  const { mutate: mutateGlobal } = useSWRConfig();

  const format = useFormatter();

  const tUserSessions = useTranslations("admins.userSessions");

  const dateFilterOperators = useDateFilterOperators();
  const stringFilterOperators = useStringFilterOperators();

  const updateQuery = useUpdateQuery();

  const {
    data: { data: rows, total: rowCount } = {
      data: initialRows,
      total: initialRowCount,
    },
    mutate,
    isValidating,
  } = useSWR(
    !loading && [
      `/api/users/${userId}/sessions`,
      filterModel.items[0]?.field,
      filterModel.items[0]?.operator,
      filterModel.items[0]?.value,
      filterModel.quickFilterValues,
      paginationModel.page,
      paginationModel.pageSize,
      sortModel,
    ],
    ([url]) =>
      fetcher<UserSessionListResponse>(
        `${url}?${getDataGridSearchParams(paginationModel, filterModel, sortModel)}`,
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

  const isUserSessionSelectable = useCallback(
    (session: UserSession) =>
      session.id !== currentSession?.session.id && isActiveSession(session),
    [currentSession?.session.id],
  );

  const {
    clearRowSelection,
    hasSelectableRows,
    rowSelectionProps,
    selectedRows,
  } = useRowSelection({
    enabled: isSelectMode,
    isRowSelectable: isUserSessionSelectable,
    rows,
  });

  const revokeUserSessions = useCallback(
    async (ids: string[]) => {
      await fetcher(`/api/users/${userId}/sessions`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });

      mutateGlobal(deviceSessionsKey);
      mutate();
    },
    [mutate, mutateGlobal, userId],
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

  const handleRevokeUserSession = useCallback(
    (session: UserSession) => {
      setDialog({
        content: <RevokeUserSessionDialogContent session={session} />,
        onConfirm: async () => {
          try {
            await revokeUserSessions([session.id]);

            enqueueSnackbar(
              tUserSessions("actions.revokeUserSession.success", {
                email: userEmail,
              }),
              { variant: "success" },
            );
          } catch (error) {
            enqueueSnackbar(getErrorMessage(error), {
              variant: "error",
            });
          }
        },
        open: true,
        title: tUserSessions("actions.revokeUserSession.title"),
      });
    },
    [revokeUserSessions, setDialog, tUserSessions, userEmail],
  );

  const handleEnterUserSessionBatchRevokeMode = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tUserSessions.rich("actions.batchRevokeUserSession.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        setIsSelectMode(true);
        setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
      },
      open: true,
      title: tUserSessions("actions.batchRevokeUserSession.title"),
    });
  }, [apiRef, setDialog, tUserSessions]);

  const handleSubmitUserSessionBatchRevoke = useCallback(() => {
    const count = selectedRows.length;

    setDialog({
      content: (
        <DialogContentText>
          {tUserSessions.rich("actions.batchRevokeUserSession.submit.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
            count,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        try {
          await revokeUserSessions(selectedRows.map(({ id }) => id));

          setIsSelectMode(false);
          clearRowSelection();

          setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);

          enqueueSnackbar(
            tUserSessions("actions.batchRevokeUserSession.submit.success", {
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
      },
      open: true,
      title: tUserSessions("actions.batchRevokeUserSession.submit.label", {
        count,
      }),
    });
  }, [
    apiRef,
    clearRowSelection,
    revokeUserSessions,
    selectedRows,
    setDialog,
    tUserSessions,
  ]);

  const handleCancelUserSessionBatchRevoke = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tUserSessions.rich("actions.batchRevokeUserSession.cancel.confirm", {
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
      title: tUserSessions("actions.batchRevokeUserSession.cancel.label"),
    });
  }, [apiRef, clearRowSelection, setDialog, tUserSessions]);

  const columns = useMemo<GridColDef[]>(
    () => [
      ...(!isSelectMode
        ? [
            {
              disableColumnMenu: true,
              disableExport: true,
              field: "actions",
              filterable: false,
              headerName: tUserSessions("actions.label"),
              renderCell: ({ row }: GridRenderCellParams<UserSession>) => {
                const isCurrent = row.id === currentSession?.session.id;

                return (
                  <ActionsStack direction="row">
                    {hasSelectableRows && (
                      <Tooltip
                        title={tUserSessions("actions.revokeUserSession.title")}
                      >
                        <StyledIconButton
                          color="error"
                          onClick={(event) => {
                            event.stopPropagation();

                            handleRevokeUserSession(row);
                          }}
                          size="small"
                          visible={isUserSessionSelectable(row)}
                        >
                          <DeleteOutlined fontSize="small" />
                        </StyledIconButton>
                      </Tooltip>
                    )}
                    {isCurrent && (
                      <Chip
                        label={tUserSessions("current")}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </ActionsStack>
                );
              },
              resizable: false,
              sortable: false,
            },
          ]
        : []),
      {
        field: "userAgent",
        filterOperators: stringFilterOperators,
        headerName: tUserSessions("userAgent.label"),
        renderCell: renderEmptyableCell,
        valueGetter: (_value: unknown, { userAgent }: UserSession) =>
          formatUserAgent(userAgent),
      },
      {
        field: "ipAddress",
        filterOperators: stringFilterOperators,
        headerName: tUserSessions("ipAddress.label"),
        renderCell: renderEmptyableCell,
      },
      {
        field: "createdAt",
        filterOperators: dateFilterOperators,
        headerName: tUserSessions("createdAt"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "short"),
      },
      {
        field: "expiresAt",
        filterOperators: dateFilterOperators,
        headerName: tUserSessions("expiresAt"),
        renderCell: ({
          formattedValue,
          row,
        }: GridRenderCellParams<UserSession>) => (
          <ExpiresAtStack direction="row">
            {formattedValue}
            {!isActiveSession(row) && (
              <Chip
                label={tUserSessions("expired")}
                size="small"
                variant="outlined"
              />
            )}
          </ExpiresAtStack>
        ),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "short"),
      },
    ],
    [
      currentSession?.session,
      dateFilterOperators,
      format,
      handleRevokeUserSession,
      hasSelectableRows,
      isSelectMode,
      isUserSessionSelectable,
      stringFilterOperators,
      tUserSessions,
    ],
  );

  return (
    <>
      <ToolbarStack direction="row">
        {!isSelectMode && (
          <Button
            disabled={!hasSelectableRows}
            onClick={handleEnterUserSessionBatchRevokeMode}
            size="small"
            startIcon={<DeleteOutlined />}
            variant="outlined"
          >
            {tUserSessions("actions.batchRevokeUserSession.title")}
          </Button>
        )}
        {isSelectMode && (
          <>
            <Button
              onClick={handleCancelUserSessionBatchRevoke}
              size="small"
              startIcon={<Cancel />}
              variant="outlined"
            >
              {tUserSessions("actions.batchRevokeUserSession.cancel.label")}
            </Button>
            <Button
              color="error"
              disabled={!selectedRows.length}
              onClick={handleSubmitUserSessionBatchRevoke}
              size="small"
              startIcon={<DeleteOutlined />}
              variant="contained"
            >
              {tUserSessions("actions.batchRevokeUserSession.submit.label", {
                count: selectedRows.length,
              })}
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

export default UserSessions;
