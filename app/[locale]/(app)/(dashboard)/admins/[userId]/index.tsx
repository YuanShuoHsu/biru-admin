"use client";

import type { UserWithRole } from "better-auth/client/plugins";
import type { Session } from "better-auth/types";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import { flushSync } from "react-dom";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { DeleteOutline, LogoutOutlined } from "@mui/icons-material";
import {
  Button,
  Chip,
  DialogContentText,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { useAuthStore } from "@/providers/auth-store-provider";
import { useDialogStore } from "@/providers/dialog-store-provider";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface SessionsProps {
  user: UserWithRole;
  initialRows: Session[];
}

const Sessions = ({ user, initialRows }: SessionsProps) => {
  const [rows, setRows] = useState(initialRows);

  const apiRef = useGridApiRef();

  const { session: currentSession } = useAuthStore((state) => state);
  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const locale = useLocale();

  const tAdmins = useTranslations("admins");

  const [loading, setLoading] = useState(false);

  const fetchSessions = useCallback(async () => {
    await authClient.admin.listUserSessions(
      { userId: user.id },
      {
        onError: ({ error: { code } }) => {
          setLoading(false);

          enqueueSnackbar(getErrorMessage(code, locale), {
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
  }, [apiRef, locale, user.id]);

  const handleRevokeAll = () => {
    setDialog({
      content: (
        <DialogContentText>
          {tAdmins.rich("actions.revokeUserSessions.revokeAll.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
            email: user.email,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        await authClient.admin.revokeUserSessions(
          { userId: user.id },
          {
            onError: ({ error: { code } }) => {
              enqueueSnackbar(getErrorMessage(code, locale), {
                variant: "error",
              });
            },
            onSuccess: () => {
              enqueueSnackbar(
                tAdmins("actions.revokeUserSessions.revokeAll.success"),
                { variant: "success" },
              );

              fetchSessions();
            },
          },
        );
      },
      open: true,
      title: tAdmins("actions.revokeUserSessions.revokeAll.title"),
    });
  };

  const handleRevokeOne = useCallback(
    (sessionToken: string) => {
      setDialog({
        content: (
          <DialogContentText>
            {tAdmins("actions.revokeUserSessions.revokeOne.confirm")}
          </DialogContentText>
        ),
        onConfirm: async () => {
          await authClient.admin.revokeUserSession(
            { sessionToken },
            {
              onError: ({ error: { code } }) => {
                enqueueSnackbar(getErrorMessage(code, locale), {
                  variant: "error",
                });
              },
              onSuccess: () => {
                enqueueSnackbar(
                  tAdmins("actions.revokeUserSessions.revokeOne.success"),
                  { variant: "success" },
                );
                fetchSessions();
              },
            },
          );
        },
        open: true,
        title: tAdmins("actions.revokeUserSessions.revokeOne.title"),
      });
    },
    [fetchSessions, locale, setDialog, tAdmins],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        disableColumnMenu: true,
        field: "actions",
        headerName: tAdmins("actions.label"),
        renderCell: ({ row: { token } }: GridRenderCellParams<Session>) => (
          <Stack height="100%" direction="row" alignItems="center" gap={1}>
            <Tooltip
              title={tAdmins("actions.revokeUserSessions.revokeOne.title")}
            >
              <IconButton
                color="error"
                onClick={(event) => {
                  event.stopPropagation();

                  handleRevokeOne(token);
                }}
                size="small"
              >
                <DeleteOutline fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
        resizable: false,
        sortable: false,
      },
      {
        field: "userAgent",
        headerName: tAdmins("actions.revokeUserSessions.userAgent"),
        renderCell: ({
          row: { token, userAgent },
        }: GridRenderCellParams<Session>) => {
          const isCurrent = token === currentSession?.session.token;

          return (
            <Stack height="100%" direction="row" alignItems="center" gap={1}>
              {isCurrent && (
                <Chip
                  label={tAdmins("actions.revokeUserSessions.current")}
                  size="small"
                  variant="outlined"
                />
              )}
              <Typography variant="body2">{userAgent}</Typography>
            </Stack>
          );
        },
      },
      {
        field: "ipAddress",
        headerName: tAdmins("actions.revokeUserSessions.ipAddress"),
        valueFormatter: (value: string | null) => value,
      },
      {
        field: "createdAt",
        headerName: tAdmins("actions.revokeUserSessions.createdAt"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "short"),
      },
      {
        field: "expiresAt",
        headerName: tAdmins("actions.revokeUserSessions.expiresAt"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "short"),
      },
    ],
    [currentSession?.session, format, handleRevokeOne, tAdmins],
  );

  return (
    <Stack gap={2}>
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1}>
        <Button
          color="error"
          onClick={handleRevokeAll}
          size="small"
          startIcon={<LogoutOutlined />}
          variant="contained"
        >
          {tAdmins("actions.revokeUserSessions.revokeAll.title")}
        </Button>
      </Stack>
      <DataGrid
        {...DATA_GRID_PROPS}
        apiRef={apiRef}
        columns={columns}
        loading={loading}
        onPaginationModelChange={() =>
          apiRef.current?.autosizeColumns(autosizeOptions)
        }
        rows={rows}
      />
    </Stack>
  );
};

export default Sessions;
