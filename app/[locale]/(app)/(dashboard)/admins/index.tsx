// https://mui.com/x/react-data-grid/column-dimensions/#ColumnAutosizingAsync.tsx
// https://mui.com/x/react-data-grid/pagination/
// https://mui.com/x/react-data-grid/performance/
// https://mui.com/x/react-data-grid/server-side-data/

"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import { flushSync } from "react-dom";

import type { AdminUser } from "./page";

import CreateUserDialogContent from "./CreateUserDialogContent";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import {
  Block,
  CheckCircle,
  Delete,
  LockOpen,
  PersonAdd,
} from "@mui/icons-material";
import {
  Button,
  Chip,
  DialogContentText,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Tooltip,
} from "@mui/material";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface AdminUsersProps {
  rows: AdminUser[];
}

const AdminUsers = ({ rows: initialRows }: AdminUsersProps) => {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState(initialRows);

  const apiRef = useGridApiRef();

  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const locale = useLocale();

  const t = useTranslations("admins.users");

  const fetchData = useCallback(async () => {
    setLoading(true);

    const { data } = await authClient.admin.listUsers({
      query: { limit: 100, offset: 0 },
    });

    flushSync(() => {
      setRows(((data?.users as AdminUser[]) ?? []).toReversed());

      setLoading(false);
    });

    setTimeout(() => {
      apiRef.current?.autosizeColumns(autosizeOptions);
    }, 0);
  }, [apiRef]);

  const handleCreateUser = () => {
    setDialog({
      content: <CreateUserDialogContent fetchData={fetchData} />,
      formId: "create-user-form",
      open: true,
      title: t("create.title"),
    });
  };

  const handleSetRole = useCallback(
    async (userId: string, role: "user" | "admin") => {
      await authClient.admin.setRole(
        { userId, role },
        {
          onError: ({ error: { code } }) => {
            const message = getErrorMessage(code, locale);
            enqueueSnackbar(message, { variant: "error" });
          },
          onSuccess: () => {
            const message = t("setRole.success");
            enqueueSnackbar(message, { variant: "success" });

            fetchData();
          },
        },
      );
    },
    [fetchData, locale, t],
  );

  const handleBanUser = useCallback(
    ({ id, name }: AdminUser) => {
      setDialog({
        content: (
          <DialogContentText>
            {t.rich("ban.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              name,
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          await authClient.admin.banUser(
            { userId: id },
            {
              onError: ({ error: { code } }) => {
                const message = getErrorMessage(code, locale);
                enqueueSnackbar(message, { variant: "error" });
              },
              onSuccess: () => {
                const message = t("ban.success");
                enqueueSnackbar(message, { variant: "success" });

                fetchData();
              },
            },
          );
        },
        open: true,
        title: t("ban.title"),
      });
    },
    [fetchData, locale, setDialog, t],
  );

  const handleUnbanUser = useCallback(
    async (userId: string) => {
      await authClient.admin.unbanUser(
        { userId },
        {
          onError: ({ error: { code } }) => {
            const message = getErrorMessage(code, locale);
            enqueueSnackbar(message, { variant: "error" });
          },
          onSuccess: () => {
            const message = t("unban.success");
            enqueueSnackbar(message, { variant: "success" });

            fetchData();
          },
        },
      );
    },
    [fetchData, locale, t],
  );

  const handleDeleteUser = useCallback(
    ({ id, name }: AdminUser) => {
      setDialog({
        content: (
          <DialogContentText>
            {t.rich("delete.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              name,
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          await authClient.admin.removeUser(
            { userId: id },
            {
              onError: ({ error: { code } }) => {
                const message = getErrorMessage(code, locale);
                enqueueSnackbar(message, { variant: "error" });
              },
              onSuccess: () => {
                const message = t("delete.success");
                enqueueSnackbar(message, { variant: "success" });

                fetchData();
              },
            },
          );
        },
        open: true,
        title: t("delete.title"),
      });
    },
    [fetchData, locale, setDialog, t],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: "actions",
        headerName: t("columns.actions"),
        renderCell: ({ row }: GridRenderCellParams<AdminUser>) => (
          <Stack height="100%" direction="row" alignItems="center" gap={1}>
            {row.banned ? (
              <Tooltip title={t("actions.unban")}>
                <IconButton
                  color="success"
                  onClick={(event) => {
                    event.stopPropagation();

                    handleUnbanUser(row.id);
                  }}
                  size="small"
                >
                  <LockOpen fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title={t("actions.ban")}>
                <IconButton
                  color="warning"
                  onClick={(event) => {
                    event.stopPropagation();

                    handleBanUser(row);
                  }}
                  size="small"
                >
                  <Block fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title={t("actions.delete")}>
              <IconButton
                color="error"
                onClick={(event) => {
                  event.stopPropagation();

                  handleDeleteUser(row);
                }}
                size="small"
              >
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
        resizable: false,
        sortable: false,
      },
      {
        field: "name",
        headerName: t("columns.name"),
      },
      {
        field: "email",
        headerName: t("columns.email"),
      },
      {
        field: "role",
        headerName: t("columns.role"),
        renderCell: ({ row }: GridRenderCellParams<AdminUser>) => (
          <Select
            onChange={(event) =>
              handleSetRole(row.id, event.target.value as "user" | "admin")
            }
            onClick={(event) => event.stopPropagation()}
            size="small"
            sx={{ fontSize: "0.875rem" }}
            value={row.role || "user"}
            variant="standard"
          >
            <MenuItem value="user">{t("roles.user")}</MenuItem>
            <MenuItem value="admin">{t("roles.admin")}</MenuItem>
          </Select>
        ),
        sortable: false,
      },
      {
        field: "banned",
        headerName: t("columns.status"),
        renderCell: ({ row }: GridRenderCellParams<AdminUser>) => (
          <Chip
            color={row.banned ? "error" : "success"}
            icon={
              row.banned ? (
                <Block fontSize="small" />
              ) : (
                <CheckCircle fontSize="small" />
              )
            }
            label={row.banned ? t("status.banned") : t("status.active")}
            size="small"
            variant="outlined"
          />
        ),
        sortable: false,
      },
      {
        field: "createdAt",
        headerName: t("columns.createdAt"),
        valueFormatter: (value: Date) =>
          format.dateTime(new Date(value), "short"),
      },
    ],
    [
      format,
      handleBanUser,
      handleDeleteUser,
      handleSetRole,
      handleUnbanUser,
      t,
    ],
  );

  return (
    <>
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1}>
        <Button
          onClick={handleCreateUser}
          size="small"
          startIcon={<PersonAdd />}
          variant="contained"
        >
          {t("actions.create")}
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
    </>
  );
};

export default AdminUsers;
