// https://mui.com/x/react-data-grid/column-dimensions/#ColumnAutosizingAsync.tsx
// https://mui.com/x/react-data-grid/pagination/
// https://mui.com/x/react-data-grid/performance/
// https://mui.com/x/react-data-grid/server-side-data/

"use client";

import type { UserWithRole } from "better-auth/client/plugins";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import { flushSync } from "react-dom";

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
import type {
  GridColDef,
  GridPaginationModel,
  GridRenderCellParams,
} from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface AdminsProps {
  rows: UserWithRole[];
  total: number;
}

const Admins = ({ rows: initialRows, total }: AdminsProps) => {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState(initialRows);
  const [rowCount, setRowCount] = useState(total);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  const apiRef = useGridApiRef();

  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const locale = useLocale();

  const tAdminsUsers = useTranslations("admins.users");

  const fetchData = useCallback(
    async ({ page, pageSize }: GridPaginationModel) => {
      setLoading(true);

      const { data } = await authClient.admin.listUsers({
        query: {
          limit: pageSize,
          offset: page * pageSize,
          sortBy: "createdAt",
          sortDirection: "desc",
        },
      });

      const users = data?.users ?? [];
      const total = data?.total ?? 0;

      flushSync(() => {
        setRows(users);
        setRowCount(total);
        setLoading(false);
      });

      setTimeout(() => {
        apiRef.current?.autosizeColumns(autosizeOptions);
      }, 0);
    },
    [apiRef],
  );

  const handlePaginationModelChange = useCallback(
    (newModel: GridPaginationModel) => {
      setPaginationModel(newModel);
      fetchData(newModel);
      apiRef.current?.autosizeColumns(autosizeOptions);
    },
    [apiRef, fetchData],
  );

  const handleCreateUser = () => {
    setDialog({
      content: (
        <CreateUserDialogContent fetchData={() => fetchData(paginationModel)} />
      ),
      formId: "create-user-form",
      open: true,
      title: tAdminsUsers("create.title"),
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
            const message = tAdminsUsers("setRole.success");
            enqueueSnackbar(message, { variant: "success" });

            fetchData(paginationModel);
          },
        },
      );
    },
    [fetchData, locale, paginationModel, tAdminsUsers],
  );

  const handleBanUser = useCallback(
    ({ id, name }: UserWithRole) => {
      setDialog({
        content: (
          <DialogContentText>
            {tAdminsUsers.rich("ban.confirm", {
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
                const message = tAdminsUsers("ban.success");
                enqueueSnackbar(message, { variant: "success" });

                fetchData(paginationModel);
              },
            },
          );
        },
        open: true,
        title: tAdminsUsers("ban.title"),
      });
    },
    [fetchData, locale, paginationModel, setDialog, tAdminsUsers],
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
            const message = tAdminsUsers("unban.success");
            enqueueSnackbar(message, { variant: "success" });

            fetchData(paginationModel);
          },
        },
      );
    },
    [fetchData, locale, paginationModel, tAdminsUsers],
  );

  const handleDeleteUser = useCallback(
    ({ id, name }: UserWithRole) => {
      setDialog({
        content: (
          <DialogContentText>
            {tAdminsUsers.rich("delete.confirm", {
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
                const message = tAdminsUsers("delete.success");
                enqueueSnackbar(message, { variant: "success" });

                fetchData(paginationModel);
              },
            },
          );
        },
        open: true,
        title: tAdminsUsers("delete.title"),
      });
    },
    [fetchData, locale, paginationModel, setDialog, tAdminsUsers],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: "actions",
        headerName: tAdminsUsers("columns.actions"),
        renderCell: ({ row }: GridRenderCellParams<UserWithRole>) => (
          <Stack height="100%" direction="row" alignItems="center" gap={1}>
            {row.banned ? (
              <Tooltip title={tAdminsUsers("actions.unban")}>
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
              <Tooltip title={tAdminsUsers("actions.ban")}>
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
            <Tooltip title={tAdminsUsers("actions.delete")}>
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
        headerName: tAdminsUsers("columns.name"),
      },
      {
        field: "email",
        headerName: tAdminsUsers("columns.email"),
      },
      {
        field: "role",
        headerName: tAdminsUsers("columns.role"),
        renderCell: ({ row }: GridRenderCellParams<UserWithRole>) => (
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
            <MenuItem value="user">{tAdminsUsers("roles.user")}</MenuItem>
            <MenuItem value="admin">{tAdminsUsers("roles.admin")}</MenuItem>
          </Select>
        ),
        sortable: false,
      },
      {
        field: "banned",
        headerName: tAdminsUsers("columns.status"),
        renderCell: ({ row }: GridRenderCellParams<UserWithRole>) => (
          <Chip
            color={row.banned ? "error" : "success"}
            icon={
              row.banned ? (
                <Block fontSize="small" />
              ) : (
                <CheckCircle fontSize="small" />
              )
            }
            label={
              row.banned
                ? tAdminsUsers("status.banned")
                : tAdminsUsers("status.active")
            }
            size="small"
            variant="outlined"
          />
        ),
        sortable: false,
      },
      {
        field: "createdAt",
        headerName: tAdminsUsers("columns.createdAt"),
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
      tAdminsUsers,
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
          {tAdminsUsers("actions.create")}
        </Button>
      </Stack>
      <DataGrid
        {...DATA_GRID_PROPS}
        apiRef={apiRef}
        columns={columns}
        loading={loading}
        onPaginationModelChange={handlePaginationModelChange}
        paginationMode="server"
        paginationModel={paginationModel}
        rowCount={rowCount}
        rows={rows}
      />
    </>
  );
};

export default Admins;
