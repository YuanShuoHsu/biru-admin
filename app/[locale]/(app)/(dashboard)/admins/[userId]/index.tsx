"use client";

import type { UserWithRole } from "better-auth/client/plugins";
import type { Session } from "better-auth/types";
import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { useSWRConfig } from "swr";

import RevokeUserSessionDialogContent from "./RevokeUserSessionDialogContent";

import DataGrid from "@/components/DataGrid";
import { renderEmptyableCell } from "@/components/EmptyCell";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";

import { deviceSessionsKey } from "@/hooks/useDeviceSessions";
import { useRowSelection } from "@/hooks/useRowSelection";
import { useSession } from "@/hooks/useSession";

import { authClient } from "@/lib/auth-client";

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
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { formatUserAgent } from "@/utils/auth";
import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

const ActionsStack = styled(Stack)(({ theme }) => ({
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
  initialRows: Session[];
  user: UserWithRole;
}

const UserSessions = ({ initialRows, user }: UserSessionsProps) => {
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [rows, setRows] = useState(initialRows);

  const apiRef = useGridApiRef();

  const currentSession = useSession();

  const isUserSessionSelectable = useCallback(
    ({ token }: Session) => token !== currentSession?.session.token,
    [currentSession?.session.token],
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
  const { setDialog } = useDialogStore((state) => state);

  const { mutate } = useSWRConfig();

  const format = useFormatter();

  const tUserSessions = useTranslations("admins.userSessions");

  const [loading, setLoading] = useState(false);

  const fetchListUserSessions = useCallback(async () => {
    await authClient.admin.listUserSessions(
      { userId: user.id },
      {
        onError: ({ error: { message } }) => {
          setLoading(false);

          enqueueSnackbar(message, {
            variant: "error",
          });
        },
        onRequest: () => setLoading(true),
        onSuccess: ({ data: { sessions: rows } }) => {
          flushSync(() => {
            setRows(rows);

            setLoading(false);
          });

          setTimeout(() => {
            apiRef.current?.autosizeColumns(autosizeOptions);
          }, 0);
        },
      },
    );
  }, [apiRef, user.id]);

  const handleRevokeUserSession = useCallback(
    (session: Pick<Session, "token" | "ipAddress" | "userAgent">) => {
      setDialog({
        content: <RevokeUserSessionDialogContent session={session} />,
        onConfirm: async () => {
          await authClient.admin.revokeUserSession(
            { sessionToken: session.token },
            {
              onError: ({ error: { message } }) => {
                enqueueSnackbar(message, {
                  variant: "error",
                });
              },
              onSuccess: () => {
                enqueueSnackbar(
                  tUserSessions("actions.revokeUserSession.success", {
                    email: user.email,
                  }),
                  { variant: "success" },
                );

                mutate(deviceSessionsKey);
                fetchListUserSessions();
              },
            },
          );
        },
        open: true,
        title: tUserSessions("actions.revokeUserSession.title"),
      });
    },
    [fetchListUserSessions, mutate, setDialog, tUserSessions, user.email],
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
          await fetcher(`/api/users/${user.id}/sessions`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: selectedRows.map(({ id }) => id) }),
          });

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

        mutate(deviceSessionsKey);
        fetchListUserSessions();
      },
      open: true,
      title: tUserSessions("actions.batchRevokeUserSession.submit.label", {
        count,
      }),
    });
  }, [
    apiRef,
    clearRowSelection,
    fetchListUserSessions,
    mutate,
    selectedRows,
    setDialog,
    tUserSessions,
    user.id,
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
              renderCell: ({ row }: GridRenderCellParams<Session>) => {
                const isCurrent = row.token === currentSession?.session.token;

                return (
                  <ActionsStack direction="row">
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
        headerName: tUserSessions("userAgent.label"),
        renderCell: renderEmptyableCell,
        valueGetter: (_value: unknown, { userAgent }: Session) =>
          formatUserAgent(userAgent),
      },
      {
        field: "ipAddress",
        headerName: tUserSessions("ipAddress.label"),
        renderCell: renderEmptyableCell,
      },
      {
        field: "createdAt",
        headerName: tUserSessions("createdAt"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "short"),
      },
      {
        field: "expiresAt",
        headerName: tUserSessions("expiresAt"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "short"),
      },
    ],
    [
      currentSession?.session,
      format,
      handleRevokeUserSession,
      isSelectMode,
      isUserSessionSelectable,
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
        loading={loading}
        onPaginationModelChange={() =>
          apiRef.current?.autosizeColumns(autosizeOptions)
        }
        rows={rows}
      />
    </>
  );
};

export default UserSessions;
