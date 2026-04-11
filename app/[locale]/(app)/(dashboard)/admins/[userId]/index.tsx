"use client";

import type { UserWithRole } from "better-auth/client/plugins";
import type { Session } from "better-auth/types";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import { flushSync } from "react-dom";

import RevokeUserSessionDialogContent from "./RevokeUserSessionDialogContent";

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
} from "@mui/material";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { useAuthStore } from "@/providers/auth-store-provider";
import { useDialogStore } from "@/providers/dialog-store-provider";

import { formatUserAgent } from "@/utils/admins";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface UserSessionsProps {
  initialRows: Session[];
  user: UserWithRole;
}

const UserSessions = ({ initialRows, user }: UserSessionsProps) => {
  const [rows, setRows] = useState(initialRows);

  const apiRef = useGridApiRef();

  const { session: currentSession } = useAuthStore((state) => state);
  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const locale = useLocale();

  const tUserSessions = useTranslations("admins.userSessions");

  const [loading, setLoading] = useState(false);

  const fetchListUserSessions = useCallback(async () => {
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

  const handleRevokeUserSessions = () => {
    setDialog({
      content: (
        <DialogContentText>
          {tUserSessions.rich("actions.revokeUserSessions.confirm", {
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
                tUserSessions("actions.revokeUserSessions.success"),
                { variant: "success" },
              );

              fetchListUserSessions();
            },
          },
        );
      },
      open: true,
      title: tUserSessions("actions.revokeUserSessions.title"),
    });
  };

  const handleRevokeUserSession = useCallback(
    (session: Pick<Session, "token" | "ipAddress" | "userAgent">) => {
      setDialog({
        content: (
          <RevokeUserSessionDialogContent session={session} />
        ),
        onConfirm: async () => {
          await authClient.admin.revokeUserSession(
            { sessionToken: session.token },
            {
              onError: ({ error: { code } }) => {
                enqueueSnackbar(getErrorMessage(code, locale), {
                  variant: "error",
                });
              },
              onSuccess: () => {
                enqueueSnackbar(
                  tUserSessions("actions.revokeUserSession.success"),
                  { variant: "success" },
                );
                fetchListUserSessions();
              },
            },
          );
        },
        open: true,
        title: tUserSessions("actions.revokeUserSession.title"),
      });
    },
    [fetchListUserSessions, locale, setDialog, tUserSessions],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        disableColumnMenu: true,
        field: "actions",
        headerName: tUserSessions("actions.label"),
        renderCell: ({ row }: GridRenderCellParams<Session>) => {
          const isCurrent = row.token === currentSession?.session.token;

          return (
            <Stack height="100%" direction="row" alignItems="center" gap={1}>
              <Tooltip title={tUserSessions("actions.revokeUserSession.title")}>
                <IconButton
                  color="error"
                  onClick={(event) => {
                    event.stopPropagation();

                    handleRevokeUserSession(row);
                  }}
                  size="small"
                >
                  <DeleteOutline fontSize="small" />
                </IconButton>
              </Tooltip>
              {isCurrent && (
                <Chip
                  label={tUserSessions("current")}
                  size="small"
                  variant="outlined"
                />
              )}
            </Stack>
          );
        },
        resizable: false,
        sortable: false,
      },
      {
        field: "userAgent",
        headerName: tUserSessions("userAgent.label"),
        valueGetter: (_value: unknown, { userAgent }: Session) =>
          formatUserAgent(userAgent),
      },
      {
        field: "ipAddress",
        headerName: tUserSessions("ipAddress.label"),
        valueFormatter: (value: string | null) => value,
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
    [currentSession?.session, format, handleRevokeUserSession, tUserSessions],
  );

  return (
    <Stack gap={2}>
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1}>
        <Button
          color="error"
          onClick={handleRevokeUserSessions}
          size="small"
          startIcon={<LogoutOutlined />}
          variant="contained"
        >
          {tUserSessions("actions.revokeUserSessions.title")}
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

export default UserSessions;
