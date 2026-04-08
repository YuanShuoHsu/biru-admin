"use client";

import type { UserWithRole } from "better-auth/client/plugins";
import type { Session } from "better-auth/types";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import useSWR from "swr";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { DeleteOutline, LogoutOutlined } from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  DialogContentText,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

import { useAuthStore } from "@/providers/auth-store-provider";
import { useDialogStore } from "@/providers/dialog-store-provider";

interface RevokeUserSessionsDialogContentProps {
  user: UserWithRole;
}

const RevokeUserSessionsDialogContent = ({
  user,
}: RevokeUserSessionsDialogContentProps) => {
  const apiRef = useGridApiRef();

  const { session: currentSession } = useAuthStore((state) => state);
  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const locale = useLocale();

  const tAdmins = useTranslations("admins");

  const {
    data: sessions = [],
    isLoading,
    mutate,
  } = useSWR(`user-sessions-${user.id}`, async () => {
    const { data } = await authClient.admin.listUserSessions({
      userId: user.id,
    });

    return data?.sessions;
  });

  const handleRevokeOne = async (token: string) => {
    await authClient.admin.revokeUserSession(
      { sessionToken: token },
      {
        onError: ({ error: { code } }) => {
          enqueueSnackbar(getErrorMessage(code, locale), { variant: "error" });
        },
        onSuccess: () => {
          enqueueSnackbar(
            tAdmins("actions.revokeUserSessions.revokeOne.success"),
            {
              variant: "success",
            },
          );
          mutate();
        },
      },
    );
  };

  const handleRevokeAll = () => {
    setDialog({
      content: (
        <DialogContentText>
          {tAdmins.rich("actions.revokeUserSessions.revokeAll.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
            name: user.name,
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
                {
                  variant: "success",
                },
              );
              mutate();
            },
          },
        );
      },
      open: true,
      title: tAdmins("actions.revokeUserSessions.revokeAll.title"),
    });
  };

  const columns: GridColDef[] = [
    {
      disableColumnMenu: true,
      field: "actions",
      headerName: tAdmins("actions.label"),
      renderCell: ({ row }: GridRenderCellParams<Session>) => (
        <Stack height="100%" direction="row" alignItems="center" gap={1}>
          <Tooltip
            title={tAdmins("actions.revokeUserSessions.revokeOne.title")}
          >
            <IconButton
              color="error"
              onClick={(event) => {
                event.stopPropagation();

                handleRevokeOne(row.token);
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
  ];

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (sessions.length === 0) {
    return (
      <Typography color="text.secondary" py={2} textAlign="center">
        {tAdmins("actions.revokeUserSessions.empty")}
      </Typography>
    );
  }

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
        loading={isLoading}
        onPaginationModelChange={() =>
          apiRef.current?.autosizeColumns(autosizeOptions)
        }
        rows={sessions}
      />
    </Stack>
  );
};

export default RevokeUserSessionsDialogContent;
