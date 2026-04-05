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
import SetRoleDialogContent from "./SetRoleDialogContent";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import {
  Block,
  CheckCircle,
  Delete,
  Edit,
  LockOpen,
  MailOutline,
  PersonAdd,
  UnsubscribeOutlined,
} from "@mui/icons-material";
import {
  Avatar,
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
  GridPaginationModel,
  GridRenderCellParams,
} from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { useAuthStore } from "@/providers/auth-store-provider";
import { useDialogStore } from "@/providers/dialog-store-provider";

import type { AdminRole, AdminUser } from "@/types/admins";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

const StyledAvatar = styled(Avatar)({
  width: 28,
  height: 28,
});

const ROLE_COLOR_MAP: Record<AdminRole, "error" | "default"> = {
  admin: "error",
  user: "default",
};

interface AdminsProps {
  page: number;
  pageSize: number;
  rows: UserWithRole[];
  rowCount: number;
}

const Admins = ({
  page,
  pageSize,
  rows: initialRows,
  rowCount: initialRowCount,
}: AdminsProps) => {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState(initialRows);
  const [rowCount, setRowCount] = useState(initialRowCount);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page,
    pageSize,
  });

  const apiRef = useGridApiRef();

  const { session } = useAuthStore((state) => state);
  const { setDialog } = useDialogStore((state) => state);

  const currentUserId = session?.user?.id;

  const format = useFormatter();

  const locale = useLocale();

  const tAdminsUsers = useTranslations("admins.users");

  const fetchData = useCallback(
    async ({ page, pageSize }: GridPaginationModel) => {
      setLoading(true);

      const { data } = await authClient.admin.listUsers({
        query: {
          limit: pageSize,
          offset: (page - 1) * pageSize,
          sortBy: "createdAt",
          sortDirection: "desc",
        },
      });

      const rows = data?.users || [];
      const rowCount = data?.total || 0;

      flushSync(() => {
        setRows(rows);
        setRowCount(rowCount);

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
      const model = { ...newModel, page: newModel.page + 1 };
      setPaginationModel(model);
      fetchData(model);
    },
    [fetchData],
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
    (user: UserWithRole) => {
      setDialog({
        content: (
          <SetRoleDialogContent
            fetchData={() => fetchData(paginationModel)}
            user={user}
          />
        ),
        formId: "set-role-form",
        open: true,
        title: tAdminsUsers("setRole.title"),
      });
    },
    [fetchData, paginationModel, setDialog, tAdminsUsers],
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
    ({ id, name }: UserWithRole) => {
      setDialog({
        content: (
          <DialogContentText>
            {tAdminsUsers.rich("unban.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              name,
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          await authClient.admin.unbanUser(
            { userId: id },
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
        open: true,
        title: tAdminsUsers("unban.title"),
      });
    },
    [fetchData, locale, paginationModel, setDialog, tAdminsUsers],
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
        renderCell: ({ row }: GridRenderCellParams<UserWithRole>) => {
          const isCurrentUser = row.id === currentUserId;

          return (
            <Stack height="100%" direction="row" alignItems="center" gap={1}>
              <Tooltip title={tAdminsUsers("actions.setRole")}>
                <IconButton
                  onClick={(event) => {
                    event.stopPropagation();

                    handleSetRole(row);
                  }}
                  size="small"
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
              {!isCurrentUser &&
                (row.banned ? (
                  <Tooltip title={tAdminsUsers("actions.unban")}>
                    <IconButton
                      color="success"
                      onClick={(event) => {
                        event.stopPropagation();

                        handleUnbanUser(row);
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
                ))}
              {!isCurrentUser && (
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
              )}
            </Stack>
          );
        },
        resizable: false,
        sortable: false,
      },
      {
        field: "image",
        headerName: tAdminsUsers("columns.image"),
        renderCell: ({
          row: { image, name },
        }: GridRenderCellParams<AdminUser>) => (
          <Stack height="100%" direction="row" alignItems="center">
            <StyledAvatar alt={name} src={image || undefined} />
          </Stack>
        ),
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
        renderCell: ({
          row: { role = "user" },
        }: GridRenderCellParams<AdminUser>) => (
          <Chip
            color={ROLE_COLOR_MAP[role]}
            label={tAdminsUsers(`roles.${role}`)}
            size="small"
            variant="outlined"
          />
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
        field: "emailSubscribed",
        headerName: tAdminsUsers("columns.emailSubscribed"),
        renderCell: ({ row }: GridRenderCellParams<AdminUser>) => (
          <Chip
            color={row.emailSubscribed ? "primary" : "default"}
            icon={
              row.emailSubscribed ? (
                <MailOutline fontSize="small" />
              ) : (
                <UnsubscribeOutlined fontSize="small" />
              )
            }
            label={
              row.emailSubscribed
                ? tAdminsUsers("status.subscribed")
                : tAdminsUsers("status.unsubscribed")
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
      currentUserId,
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
        paginationModel={{ ...paginationModel, page: paginationModel.page - 1 }}
        rowCount={rowCount}
        rows={rows}
      />
    </>
  );
};

export default Admins;
