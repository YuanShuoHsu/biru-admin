// https://better-auth.com/docs/plugins/admin

// https://mui.com/x/react-data-grid/column-dimensions/#ColumnAutosizingAsync.tsx
// https://mui.com/x/react-data-grid/filtering/
// https://mui.com/x/react-data-grid/filtering/customization/
// https://mui.com/x/react-data-grid/filtering/quick-filter/
// https://mui.com/x/react-data-grid/filtering/server-side/
// https://mui.com/x/react-data-grid/pagination/
// https://mui.com/x/react-data-grid/performance/
// https://mui.com/x/react-data-grid/server-side-data/

"use client";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR, { useSWRConfig } from "swr";

import BanUserDialogContent from "./BanUserDialogContent";
import CreateUserDialogContent from "./CreateUserDialogContent";
import SetRoleDialogContent from "./SetRoleDialogContent";
import SetUserPasswordDialogContent from "./SetUserPasswordDialogContent";
import UpdateUserDialogContent from "./UpdateUserDialogContent";

import {
  CustomizedDialogActions,
  CustomizedDialogContent,
} from "@/components/CustomizedDialogs";
import DataGrid from "@/components/DataGrid";
import EmptyCell, { renderEmptyableCell } from "@/components/EmptyCell";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import { DEFAULT_PAGE_SIZE, getPageSizeOptions } from "@/constants/pagination";
import {
  DEFAULT_AUTHENTICATED_ROUTE,
  IMPERSONATE_RETURN_KEY,
} from "@/constants/route";

import { deviceSessionsKey } from "@/hooks/useDeviceSessions";
import {
  useDateFilterOperators,
  useEnumFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
import { useRowSelection } from "@/hooks/useRowSelection";
import { useSession } from "@/hooks/useSession";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { usePathname, useRouter } from "@/i18n/navigation";

import { authClient } from "@/lib/auth-client";

import {
  AssignmentInd,
  Block,
  Cancel,
  CheckCircle,
  Delete,
  Devices,
  LockOpen,
  MailOutlined,
  ManageAccounts,
  Password,
  PersonAdd,
  SupervisorAccount,
  UnsubscribeOutlined,
} from "@mui/icons-material";
import {
  Avatar,
  Button,
  Chip,
  DialogContentText,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
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

import { useAuthStore } from "@/providers/auth-store-provider";
import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  User,
  UserFilterField,
  UserFilterOperator,
  UserListResponse,
  UserRole,
  UserSortField,
} from "@/types/admins";
import type { SortDirection } from "@/types/dataGrid";

import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { getAdminEnumOptions } from "@/utils/enumOptions";
import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

const ConfirmStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(1),
}));

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

const AvatarStack = styled(Stack)({
  height: "100%",
  alignItems: "center",
});

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: 24,
  height: 24,
  backgroundColor: theme.vars.palette.background.paper,
  border: `1px solid ${theme.vars.palette.primary.main}`,
  color: theme.vars.palette.primary.main,
  fontSize: 12,

  [theme.getColorSchemeSelector("dark")]: {
    backgroundColor: theme.vars.palette.common.white,
    border: `1px solid ${theme.vars.palette.primary.main}`,
    color: theme.vars.palette.primary.contrastText,
  },
}));

const StatusStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(0.5),
}));

const ToolbarStack = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  alignItems: "center",
  gap: theme.spacing(2),
}));

const ROLE_COLOR_MAP: Record<UserRole, "error" | "default"> = {
  admin: "error",
  user: "default",
};

interface AdminsProps {
  filterField?: UserFilterField;
  filterOperator?: UserFilterOperator;
  filterValue?: string;
  loading?: boolean;
  page?: number;
  pageSize?: number;
  quickFilterValue?: string;
  rowCount?: number;
  rows?: User[];
  sortBy?: UserSortField;
  sortDirection?: SortDirection;
}

const Admins = ({
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
}: AdminsProps) => {
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
              value:
                initialFilterOperator === "isAnyOf"
                  ? initialFilterValue?.split(",")
                  : initialFilterValue,
            },
          ]
        : [],
    quickFilterValues: initialQuickFilterValue ? [initialQuickFilterValue] : [],
  });

  const session = useSession();
  const { setSession } = useAuthStore((state) => state);
  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const apiRef = useGridApiRef();

  const pathname = usePathname();

  const router = useRouter();

  const { mutate } = useSWRConfig();

  const tAdmins = useTranslations("admins");
  const tCommon = useTranslations("common");

  const textFilterOperators = useStringFilterOperators();
  const enumFilterOperators = useEnumFilterOperators();
  const dateFilterOperators = useDateFilterOperators();

  const updateQuery = useUpdateQuery();

  const enumOptions = useMemo(() => getAdminEnumOptions(tAdmins), [tAdmins]);

  const {
    data: { data: rows, total: rowCount } = {
      data: initialRows,
      total: initialRowCount,
    },
    mutate: mutateAdmins,
    isValidating,
  } = useSWR(
    !loading && [
      "/api/admins",
      filterModel.items[0]?.field,
      filterModel.items[0]?.operator,
      filterModel.items[0]?.value,
      filterModel.quickFilterValues,
      paginationModel.page,
      paginationModel.pageSize,
      sortModel,
    ],
    async () => {
      const params = getDataGridSearchParams(
        paginationModel,
        filterModel,
        sortModel,
        enumOptions,
      );

      return fetcher<UserListResponse>(`/api/users/list?${params}`);
    },
    {
      fallbackData: { data: initialRows, total: initialRowCount },
      onSuccess: () => {
        setTimeout(() => {
          apiRef.current?.autosizeColumns(autosizeOptions);
        }, 0);
      },
    },
  );

  const currentUserId = session?.user?.id;

  const isUserSelectable = useCallback(
    ({ deletable, id }: User) => id !== currentUserId && deletable,
    [currentUserId],
  );

  const {
    clearRowSelection,
    hasSelectableRows,
    rowSelectionProps,
    selectedRows,
  } = useRowSelection({
    enabled: isSelectMode,
    isRowSelectable: isUserSelectable,
    rows,
  });
  const hasOtherUser = rows.some(({ id }) => id !== currentUserId);
  const hasSessionUser = rows.some(({ hasSession }) => hasSession);
  const hasImpersonableUser = rows.some(
    (row) => row.id !== currentUserId && row.role !== "admin",
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

  const handleCreateUser = () => {
    setDialog({
      content: <CreateUserDialogContent mutateAdmins={mutateAdmins} />,
      formId: "create-user-form",
      open: true,
      title: tAdmins("actions.createUser.title"),
    });
  };

  const handleUpdateUser = useCallback(
    (user: User) => {
      setDialog({
        content: (
          <UpdateUserDialogContent mutateAdmins={mutateAdmins} user={user} />
        ),
        formId: "update-user-form",
        open: true,
        title: tAdmins("actions.updateUser.title"),
      });
    },
    [mutateAdmins, setDialog, tAdmins],
  );

  const handleSetRole = useCallback(
    (user: User) => {
      setDialog({
        content: (
          <SetRoleDialogContent mutateAdmins={mutateAdmins} user={user} />
        ),
        formId: "set-role-form",
        open: true,
        title: tAdmins("actions.setRole.title"),
      });
    },
    [mutateAdmins, setDialog, tAdmins],
  );

  const handleSetUserPassword = useCallback(
    (user: User) => {
      setDialog({
        content: <SetUserPasswordDialogContent user={user} />,
        formId: "set-user-password-form",
        open: true,
        title: tAdmins("actions.setUserPassword.title"),
      });
    },
    [setDialog, tAdmins],
  );

  const handleBanUser = useCallback(
    (user: User) => {
      setDialog({
        content: (
          <BanUserDialogContent mutateAdmins={mutateAdmins} user={user} />
        ),
        formId: "ban-user-form",
        open: true,
        title: tAdmins("actions.banUser.title"),
      });
    },
    [mutateAdmins, setDialog, tAdmins],
  );

  const handleUnbanUser = useCallback(
    ({ id, email }: User) => {
      setDialog({
        content: (
          <>
            <CustomizedDialogContent>
              <DialogContentText>
                {tAdmins.rich("actions.unbanUser.confirm", {
                  bold: (chunks) => <strong>{chunks}</strong>,
                  email,
                })}
              </DialogContentText>
            </CustomizedDialogContent>
            <CustomizedDialogActions />
          </>
        ),
        onConfirm: async () => {
          await authClient.admin.unbanUser(
            { userId: id },
            {
              onError: ({ error: { message } }) => {
                enqueueSnackbar(message, { variant: "error" });
              },
              onSuccess: () => {
                const message = tAdmins("actions.unbanUser.success", { email });
                enqueueSnackbar(message, { variant: "success" });

                mutateAdmins();
              },
            },
          );
        },
        open: true,
        title: tAdmins("actions.unbanUser.title"),
      });
    },
    [mutateAdmins, setDialog, tAdmins],
  );

  const handleImpersonateUser = useCallback(
    (user: User) => {
      setDialog({
        content: (
          <>
            <CustomizedDialogContent>
              <DialogContentText>
                {tAdmins.rich("actions.impersonateUser.confirm", {
                  bold: (chunks) => <strong>{chunks}</strong>,
                  email: user.email,
                })}
              </DialogContentText>
            </CustomizedDialogContent>
            <CustomizedDialogActions />
          </>
        ),
        onConfirm: async () => {
          await authClient.admin.impersonateUser(
            { userId: user.id },
            {
              onError: ({ error: { message } }) => {
                enqueueSnackbar(message, {
                  variant: "error",
                });
              },
              onSuccess: async () => {
                const { data } = await authClient.getSession();
                setSession(data);

                enqueueSnackbar(
                  tAdmins("actions.impersonateUser.success", {
                    email: user.email,
                  }),
                  { variant: "success" },
                );

                sessionStorage.setItem(
                  IMPERSONATE_RETURN_KEY,
                  `${pathname}?page=${paginationModel.page + 1}&pageSize=${paginationModel.pageSize}`,
                );

                const canAccessAdmin =
                  data?.user.role === "admin" ||
                  !!(await authClient.organization.list()).data?.length;

                router.replace(
                  canAccessAdmin
                    ? DEFAULT_AUTHENTICATED_ROUTE
                    : "/auth/settings/account",
                );
              },
            },
          );
        },
        open: true,
        title: tAdmins("actions.impersonateUser.title"),
      });
    },
    [paginationModel, pathname, router, setDialog, setSession, tAdmins],
  );

  const handleRemoveUser = useCallback(
    ({ id, email }: User) => {
      setDialog({
        content: (
          <>
            <CustomizedDialogContent>
              <DialogContentText>
                {tAdmins.rich("actions.removeUser.confirm", {
                  bold: (chunks) => <strong>{chunks}</strong>,
                  email,
                })}
              </DialogContentText>
            </CustomizedDialogContent>
            <CustomizedDialogActions />
          </>
        ),
        onConfirm: async () => {
          await authClient.admin.removeUser(
            { userId: id },
            {
              onError: ({ error: { message } }) => {
                enqueueSnackbar(message, { variant: "error" });
              },
              onSuccess: () => {
                const message = tAdmins("actions.removeUser.success", {
                  email,
                });
                enqueueSnackbar(message, { variant: "success" });

                mutateAdmins();
                mutate(deviceSessionsKey);
              },
            },
          );
        },
        open: true,
        title: tAdmins("actions.removeUser.title"),
      });
    },
    [mutate, mutateAdmins, setDialog, tAdmins],
  );

  const handleEnterUserBatchRemoveMode = useCallback(() => {
    setIsSelectMode(true);
    setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
  }, [apiRef]);

  const handleSubmitUserBatchRemove = useCallback(() => {
    const count = selectedRows.length;

    setDialog({
      content: (
        <>
          <CustomizedDialogContent>
            <ConfirmStack>
              <DialogContentText>
                {tAdmins.rich("actions.batchRemoveUser.submit.confirm", {
                  bold: (chunks) => <strong>{chunks}</strong>,
                  count,
                })}
              </DialogContentText>
              <List dense disablePadding>
                {selectedRows.map(({ email, id }) => (
                  <ListItem disableGutters key={id}>
                    <ListItemText primary={email} />
                  </ListItem>
                ))}
              </List>
            </ConfirmStack>
          </CustomizedDialogContent>
          <CustomizedDialogActions />
        </>
      ),
      onConfirm: async () => {
        try {
          await fetcher(`/api/users`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: selectedRows.map(({ id }) => id) }),
          });

          setIsSelectMode(false);
          clearRowSelection();

          setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);

          enqueueSnackbar(
            tAdmins("actions.batchRemoveUser.submit.success", { count }),
            {
              variant: "success",
            },
          );
        } catch (error) {
          enqueueSnackbar(getErrorMessage(error), {
            variant: "error",
          });
        }

        mutateAdmins();
        mutate(deviceSessionsKey);
      },
      open: true,
      title: tAdmins("actions.batchRemoveUser.submit.label", { count }),
    });
  }, [
    apiRef,
    clearRowSelection,
    mutate,
    mutateAdmins,
    selectedRows,
    setDialog,
    tAdmins,
  ]);

  const handleCancelUserBatchRemove = useCallback(() => {
    setIsSelectMode(false);
    clearRowSelection();

    setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
  }, [apiRef, clearRowSelection]);

  const columns = useMemo<GridColDef[]>(
    () => [
      ...(!isSelectMode
        ? [
            {
              disableColumnMenu: true,
              disableExport: true,
              field: "actions",
              filterable: false,
              headerName: tAdmins("actions.label"),
              renderCell: ({ row }: GridRenderCellParams<User>) => {
                const isBanned =
                  row.banned &&
                  (!row.banExpires || new Date(row.banExpires) > new Date());
                const isCurrentUser = row.id === currentUserId;

                return (
                  <ActionsStack direction="row">
                    <Tooltip title={tAdmins("actions.updateUser.title")}>
                      <IconButton
                        onClick={(event) => {
                          event.stopPropagation();

                          handleUpdateUser(row);
                        }}
                        size="small"
                      >
                        <ManageAccounts fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={tAdmins("actions.setRole.title")}>
                      <IconButton
                        onClick={(event) => {
                          event.stopPropagation();

                          handleSetRole(row);
                        }}
                        size="small"
                      >
                        <AssignmentInd fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={tAdmins("actions.setUserPassword.title")}>
                      <IconButton
                        onClick={(event) => {
                          event.stopPropagation();

                          handleSetUserPassword(row);
                        }}
                        size="small"
                      >
                        <Password fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {hasOtherUser && (
                      <Tooltip
                        title={
                          isBanned
                            ? tAdmins("actions.unbanUser.title")
                            : tAdmins("actions.banUser.title")
                        }
                      >
                        <StyledIconButton
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
                          visible={!isCurrentUser}
                        >
                          {isBanned ? (
                            <LockOpen fontSize="small" />
                          ) : (
                            <Block fontSize="small" />
                          )}
                        </StyledIconButton>
                      </Tooltip>
                    )}
                    {hasSessionUser && (
                      <Tooltip title={tAdmins("userSessions.label")}>
                        <StyledIconButton
                          onClick={(event) => {
                            event.stopPropagation();

                            router.push(`/admins/${row.id}`);
                          }}
                          size="small"
                          visible={row.hasSession}
                        >
                          <Devices fontSize="small" />
                        </StyledIconButton>
                      </Tooltip>
                    )}
                    {hasImpersonableUser && (
                      <Tooltip title={tAdmins("actions.impersonateUser.title")}>
                        <StyledIconButton
                          color="info"
                          onClick={(event) => {
                            event.stopPropagation();

                            handleImpersonateUser(row);
                          }}
                          size="small"
                          visible={!isCurrentUser && row.role !== "admin"}
                        >
                          <SupervisorAccount fontSize="small" />
                        </StyledIconButton>
                      </Tooltip>
                    )}
                    {hasSelectableRows && (
                      <Tooltip title={tAdmins("actions.removeUser.title")}>
                        <StyledIconButton
                          color="error"
                          onClick={(event) => {
                            event.stopPropagation();

                            handleRemoveUser(row);
                          }}
                          size="small"
                          visible={isUserSelectable(row)}
                        >
                          <Delete fontSize="small" />
                        </StyledIconButton>
                      </Tooltip>
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
        field: "image",
        filterable: false,
        headerName: tAdmins("image"),
        renderCell: ({ row: { image, name } }: GridRenderCellParams<User>) => (
          <AvatarStack direction="row">
            <StyledAvatar alt={name} src={image || undefined}>
              {name[0]}
            </StyledAvatar>
          </AvatarStack>
        ),
        sortable: false,
      },
      {
        field: "name",
        filterOperators: textFilterOperators,
        headerName: tAdmins("name"),
      },
      {
        field: "bio",
        filterable: false,
        headerName: `${tAdmins("bio")} ${tCommon("optional")}`,
        renderCell: renderEmptyableCell,
      },
      {
        field: "email",
        filterOperators: textFilterOperators,
        headerName: tAdmins("email.label"),
      },
      {
        field: "role",
        filterOperators: enumFilterOperators,
        headerName: tAdmins("role.label"),
        renderCell: ({ row: { role } }: GridRenderCellParams<User>) =>
          role ? (
            <Chip
              color={ROLE_COLOR_MAP[role]}
              label={tAdmins(`role.${role}`)}
              size="small"
              variant="outlined"
            />
          ) : (
            <EmptyCell />
          ),
        type: "singleSelect",
        valueOptions: enumOptions.role,
      },
      {
        field: "banned",
        filterOperators: enumFilterOperators,
        headerName: tAdmins("status.label"),
        renderCell: ({ row }: GridRenderCellParams<User>) => {
          const isBanned =
            row.banned &&
            (!row.banExpires || new Date(row.banExpires) > new Date());

          return (
            <Tooltip
              title={
                isBanned ? (
                  <StatusStack>
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
                  </StatusStack>
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
        type: "singleSelect",
        valueOptions: enumOptions.banned,
      },
      {
        field: "emailSubscribed",
        filterOperators: enumFilterOperators,
        headerName: tAdmins("emailSubscribed.label"),
        renderCell: ({ row }: GridRenderCellParams<User>) => (
          <Chip
            color={row.emailSubscribed ? "primary" : "default"}
            icon={
              row.emailSubscribed ? (
                <MailOutlined fontSize="small" />
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
        type: "singleSelect",
        valueOptions: enumOptions.emailSubscribed,
      },
      {
        field: "createdAt",
        filterOperators: dateFilterOperators,
        headerName: tAdmins("createdAt"),
        type: "date",
        valueFormatter: (value: Date) =>
          format.dateTime(new Date(value), "short"),
        valueGetter: (value: Date) => new Date(value),
      },
    ],
    [
      currentUserId,
      dateFilterOperators,
      enumFilterOperators,
      enumOptions,
      format,
      handleBanUser,
      handleImpersonateUser,
      handleRemoveUser,
      handleSetRole,
      handleSetUserPassword,
      handleUnbanUser,
      handleUpdateUser,
      hasOtherUser,
      hasSelectableRows,
      hasSessionUser,
      hasImpersonableUser,
      isSelectMode,
      isUserSelectable,
      router,
      tAdmins,
      tCommon,
      textFilterOperators,
    ],
  );

  return (
    <>
      <ToolbarStack direction="row">
        {!isSelectMode && (
          <>
            <Button
              disabled={loading}
              onClick={handleCreateUser}
              size="small"
              startIcon={<PersonAdd />}
              variant="contained"
            >
              {tAdmins("actions.createUser.title")}
            </Button>
            <Button
              disabled={!hasSelectableRows}
              onClick={handleEnterUserBatchRemoveMode}
              size="small"
              startIcon={<Delete />}
              variant="outlined"
            >
              {tAdmins("actions.batchRemoveUser.title")}
            </Button>
          </>
        )}
        {isSelectMode && (
          <>
            <Button
              onClick={handleCancelUserBatchRemove}
              size="small"
              startIcon={<Cancel />}
              variant="outlined"
            >
              {tAdmins("actions.batchRemoveUser.cancel.label")}
            </Button>
            <Button
              color="error"
              disabled={!selectedRows.length}
              onClick={handleSubmitUserBatchRemove}
              size="small"
              startIcon={<Delete />}
              variant="contained"
            >
              {tAdmins("actions.batchRemoveUser.submit.label", {
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

export default Admins;
