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

import BanUserDialogContent from "./BanUserDialogContent";
import CreateUserDialogContent from "./CreateUserDialogContent";
import EditUserDialogContent from "./EditUserDialogContent";
import SetPasswordDialogContent from "./SetPasswordDialogContent";
import SetRoleDialogContent from "./SetRoleDialogContent";
import UserSessionsDialogContent from "./UserSessionsDialogContent";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";

import { useRouter } from "@/i18n/navigation";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import {
  Block,
  CheckCircle,
  Delete,
  Edit,
  LockOpen,
  MailOutline,
  ManageAccounts,
  Password,
  PersonAdd,
  SupervisorAccount,
  UnsubscribeOutlined,
  ViewList,
} from "@mui/icons-material";
import {
  Avatar,
  Button,
  Chip,
  DialogContentText,
  IconButton,
  Stack,
  Tooltip,
  Typography,
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

  const { session, setSession } = useAuthStore((state) => state);
  const { setDialog } = useDialogStore((state) => state);

  const currentUserId = session?.user?.id;

  const format = useFormatter();

  const locale = useLocale();

  const router = useRouter();

  const tAdmins = useTranslations("admins");

  const fetchData = useCallback(
    async ({ page, pageSize }: GridPaginationModel) => {
      await authClient.admin.listUsers(
        {
          query: {
            limit: pageSize,
            offset: (page - 1) * pageSize,
            sortBy: "createdAt",
            sortDirection: "desc",
          },
        },
        {
          onError: ({ error: { code } }) => {
            setLoading(false);

            enqueueSnackbar(getErrorMessage(code, locale), {
              variant: "error",
            });
          },
          onRequest: () => setLoading(true),
          onSuccess: ({ data: { users: rows, total: rowCount } }) => {
            flushSync(() => {
              setRows(rows);
              setRowCount(rowCount);

              setLoading(false);
            });

            setTimeout(() => {
              apiRef.current?.autosizeColumns(autosizeOptions);
            }, 0);
          },
        },
      );
    },
    [apiRef, locale],
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
      title: tAdmins("actions.create.title"),
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
        title: tAdmins("actions.setRole.title"),
      });
    },
    [fetchData, paginationModel, setDialog, tAdmins],
  );

  const handleBanUser = useCallback(
    (user: UserWithRole) => {
      setDialog({
        content: (
          <BanUserDialogContent
            fetchData={() => fetchData(paginationModel)}
            user={user}
          />
        ),
        formId: "ban-user-form",
        open: true,
        title: tAdmins("actions.ban.title"),
      });
    },
    [fetchData, paginationModel, setDialog, tAdmins],
  );

  const handleUnbanUser = useCallback(
    ({ id, name }: UserWithRole) => {
      setDialog({
        content: (
          <DialogContentText>
            {tAdmins.rich("actions.unban.confirm", {
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
                const message = tAdmins("actions.unban.success");
                enqueueSnackbar(message, { variant: "success" });

                fetchData(paginationModel);
              },
            },
          );
        },
        open: true,
        title: tAdmins("actions.unban.title"),
      });
    },
    [fetchData, locale, paginationModel, setDialog, tAdmins],
  );

  const handleDeleteUser = useCallback(
    ({ id, name }: UserWithRole) => {
      setDialog({
        content: (
          <DialogContentText>
            {tAdmins.rich("actions.delete.confirm", {
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
                const message = tAdmins("actions.delete.success");
                enqueueSnackbar(message, { variant: "success" });

                fetchData(paginationModel);
              },
            },
          );
        },
        open: true,
        title: tAdmins("actions.delete.title"),
      });
    },
    [fetchData, locale, paginationModel, setDialog, tAdmins],
  );

  const handleEditUser = useCallback(
    (user: AdminUser) => {
      setDialog({
        content: (
          <EditUserDialogContent
            fetchData={() => fetchData(paginationModel)}
            user={user}
          />
        ),
        formId: "edit-user-form",
        open: true,
        title: tAdmins("actions.edit.title"),
      });
    },
    [fetchData, paginationModel, setDialog, tAdmins],
  );

  const handleSetPassword = useCallback(
    (user: UserWithRole) => {
      setDialog({
        content: <SetPasswordDialogContent user={user} />,
        formId: "set-password-form",
        open: true,
        title: tAdmins("actions.setPassword.title"),
      });
    },
    [setDialog, tAdmins],
  );

  const handleSessions = useCallback(
    (user: UserWithRole) => {
      setDialog({
        content: <UserSessionsDialogContent user={user} />,
        open: true,
        title: tAdmins("actions.sessions.title"),
      });
    },
    [setDialog, tAdmins],
  );

  const handleImpersonate = useCallback(
    (user: UserWithRole) => {
      setDialog({
        content: (
          <DialogContentText>
            {tAdmins.rich("actions.impersonate.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              name: user.name,
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          await authClient.admin.impersonateUser(
            { userId: user.id },
            {
              onError: ({ error: { code } }) => {
                enqueueSnackbar(getErrorMessage(code, locale), {
                  variant: "error",
                });
              },
              onSuccess: async () => {
                const { data } = await authClient.getSession();
                setSession(data);

                enqueueSnackbar(
                  tAdmins("actions.impersonate.success", { name: user.email }),
                  { variant: "success" },
                );

                router.replace("/order");
              },
            },
          );
        },
        open: true,
        title: tAdmins("actions.impersonate.title"),
      });
    },
    [locale, router, setDialog, setSession, tAdmins],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        disableColumnMenu: true,
        field: "actions",
        headerName: tAdmins("actions.label"),
        renderCell: ({ row }: GridRenderCellParams<UserWithRole>) => {
          const isBanned =
            row.banned &&
            (!row.banExpires || new Date(row.banExpires) > new Date());
          const isCurrentUser = row.id === currentUserId;

          return (
            <Stack height="100%" direction="row" alignItems="center" gap={1}>
              <Tooltip title={tAdmins("actions.setRole.title")}>
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
              <Tooltip
                title={
                  isBanned
                    ? tAdmins("actions.unban.title")
                    : tAdmins("actions.ban.title")
                }
              >
                <IconButton
                  color={isBanned ? "success" : "warning"}
                  onClick={(event) => {
                    event.stopPropagation();

                    if (isBanned) {
                      handleUnbanUser(row);
                    } else {
                      handleBanUser(row);
                    }
                  }}
                  size="small"
                  sx={{ visibility: isCurrentUser ? "hidden" : "visible" }}
                >
                  {isBanned ? (
                    <LockOpen fontSize="small" />
                  ) : (
                    <Block fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
              <Tooltip title={tAdmins("actions.edit.title")}>
                <IconButton
                  onClick={(event) => {
                    event.stopPropagation();

                    handleEditUser(row as AdminUser);
                  }}
                  size="small"
                >
                  <ManageAccounts fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={tAdmins("actions.setPassword.title")}>
                <IconButton
                  onClick={(event) => {
                    event.stopPropagation();

                    handleSetPassword(row);
                  }}
                  size="small"
                >
                  <Password fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={tAdmins("actions.sessions.title")}>
                <IconButton
                  onClick={(event) => {
                    event.stopPropagation();

                    handleSessions(row);
                  }}
                  size="small"
                >
                  <ViewList fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={tAdmins("actions.impersonate.title")}>
                <IconButton
                  color="info"
                  onClick={(event) => {
                    event.stopPropagation();

                    handleImpersonate(row);
                  }}
                  size="small"
                  sx={{ visibility: isCurrentUser ? "hidden" : "visible" }}
                >
                  <SupervisorAccount fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={tAdmins("actions.delete.title")}>
                <IconButton
                  color="error"
                  onClick={(event) => {
                    event.stopPropagation();

                    handleDeleteUser(row);
                  }}
                  size="small"
                  sx={{ visibility: isCurrentUser ? "hidden" : "visible" }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          );
        },
        resizable: false,
        sortable: false,
      },
      {
        field: "image",
        headerName: tAdmins("image"),
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
        headerName: tAdmins("name"),
      },
      {
        field: "email",
        headerName: tAdmins("email.label"),
      },
      {
        field: "role",
        headerName: tAdmins("role.label"),
        renderCell: ({ row: { role } }: GridRenderCellParams<AdminUser>) => (
          <Chip
            color={ROLE_COLOR_MAP[role]}
            label={tAdmins(`role.${role}`)}
            size="small"
            variant="outlined"
          />
        ),
        sortable: false,
      },
      {
        field: "banned",
        headerName: tAdmins("status.label"),
        renderCell: ({ row }: GridRenderCellParams<UserWithRole>) => {
          const isBanned =
            row.banned &&
            (!row.banExpires || new Date(row.banExpires) > new Date());

          return (
            <Tooltip
              title={
                isBanned ? (
                  <Stack gap={0.5}>
                    {row.banReason && (
                      <Typography variant="body2">
                        {tAdmins("status.banReason", {
                          value: row.banReason,
                        })}
                      </Typography>
                    )}
                    <Typography variant="body2">
                      {tAdmins("status.banExpires", {
                        value: row.banExpires
                          ? format.dateTime(new Date(row.banExpires), "short")
                          : tAdmins("status.permanent"),
                      })}
                    </Typography>
                  </Stack>
                ) : (
                  ""
                )
              }
            >
              <Chip
                color={isBanned ? "error" : "success"}
                icon={
                  isBanned ? (
                    <Block fontSize="small" />
                  ) : (
                    <CheckCircle fontSize="small" />
                  )
                }
                label={
                  isBanned ? tAdmins("status.banned") : tAdmins("status.active")
                }
                size="small"
                variant="outlined"
              />
            </Tooltip>
          );
        },
        sortable: false,
      },
      {
        field: "emailSubscribed",
        headerName: tAdmins("emailSubscribed.label"),
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
                ? tAdmins("emailSubscribed.subscribed")
                : tAdmins("emailSubscribed.unsubscribed")
            }
            size="small"
            variant="outlined"
          />
        ),
        sortable: false,
      },
      {
        field: "createdAt",
        headerName: tAdmins("createdAt"),
        valueFormatter: (value: Date) =>
          format.dateTime(new Date(value), "short"),
      },
    ],
    [
      currentUserId,
      format,
      handleBanUser,
      handleDeleteUser,
      handleEditUser,
      handleImpersonate,
      handleSessions,
      handleSetPassword,
      handleSetRole,
      handleUnbanUser,
      tAdmins,
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
          {tAdmins("actions.create.title")}
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
