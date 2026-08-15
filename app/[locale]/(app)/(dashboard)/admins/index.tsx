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

import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import BanUserDialogContent from "./BanUserDialogContent";
import CreateUserDialogContent from "./CreateUserDialogContent";
import SetRoleDialogContent from "./SetRoleDialogContent";
import SetUserPasswordDialogContent from "./SetUserPasswordDialogContent";
import UpdateUserDialogContent from "./UpdateUserDialogContent";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import { getPageSizeOptions } from "@/constants/pagination";
import {
  DEFAULT_AUTHENTICATED_ROUTE,
  IMPERSONATE_RETURN_KEY,
} from "@/constants/route";

import {
  useDateFilterOperators,
  useEnumFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";

import { usePathname, useRouter } from "@/i18n/navigation";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import {
  AssignmentInd,
  Block,
  CheckCircle,
  Delete,
  Devices,
  LockOpen,
  MailOutline,
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
  UserRole,
  UserSortField,
} from "@/types/admins";
import type { SortDirection } from "@/types/dataGrid";

import { getUserSessions, type UserSessions } from "@/utils/admins";
import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { getAdminEnumOptions } from "@/utils/enumOptions";
import { fetcher } from "@/utils/fetcher";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

const StyledIconButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== "visible",
})<{ visible: boolean }>(({ visible }) => ({
  visibility: visible ? "visible" : "hidden",
}));

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

const ROLE_COLOR_MAP: Record<UserRole, "error" | "default"> = {
  admin: "error",
  user: "default",
};

interface AdminsProps {
  filterField?: UserFilterField;
  filterOperator?: UserFilterOperator;
  filterValue?: string;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  rowCount: number;
  rows: User[];
  sortBy?: UserSortField;
  sortDirection?: SortDirection;
  userSessions: UserSessions;
}

const Admins = ({
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  page,
  pageSize,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount,
  rows: initialRows,
  sortBy,
  sortDirection,
  userSessions: initialUserSessions,
}: AdminsProps) => {
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

  const { session, setSession } = useAuthStore((state) => state);
  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const apiRef = useGridApiRef();

  const locale = useLocale();

  const pathname = usePathname();

  const router = useRouter();

  const searchParams = useSearchParams();

  const tAdmins = useTranslations("admins");
  const tCommon = useTranslations("common");

  const textFilterOperators = useStringFilterOperators();
  const enumFilterOperators = useEnumFilterOperators();
  const dateFilterOperators = useDateFilterOperators();

  const enumOptions = useMemo(() => getAdminEnumOptions(tAdmins), [tAdmins]);

  const {
    data: { rows, rowCount, userSessions } = {
      rows: initialRows,
      rowCount: initialRowCount,
      userSessions: initialUserSessions,
    },
    mutate: mutateAdmins,
    isValidating,
  } = useSWR(
    [
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

      const { data: userRows, total } = await fetcher<{
        data: User[];
        total: number;
      }>(`/api/users/list?${params}`);

      const userSessions = await getUserSessions(userRows);

      return { rows: userRows, rowCount: total, userSessions };
    },
    {
      fallbackData: {
        rows: initialRows,
        rowCount: initialRowCount,
        userSessions: initialUserSessions,
      },
      onSuccess: () => {
        setTimeout(() => {
          apiRef.current?.autosizeColumns(autosizeOptions);
        }, 0);
      },
    },
  );

  const currentUserId = session?.user?.id;
  const hasImpersonableUser = rows.some(
    (row) => row.id !== currentUserId && row.role !== "admin",
  );

  const handlePaginationModelChange = useCallback(
    (newModel: GridPaginationModel) => {
      setPaginationModel(newModel);

      const params = new URLSearchParams(searchParams);
      params.set("page", String(newModel.page + 1));
      params.set("pageSize", String(newModel.pageSize));

      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const handleSortModelChange = useCallback(
    (newModel: GridSortModel) => {
      setSortModel(newModel);
      setPaginationModel((prev) => ({ ...prev, page: 0 }));

      const sortItem = newModel[0];
      const params = new URLSearchParams(searchParams);
      params.delete("sortBy");
      params.delete("sortDirection");
      params.set("page", "1");
      if (sortItem?.field) params.set("sortBy", sortItem.field);
      if (sortItem?.sort) params.set("sortDirection", sortItem.sort);

      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const handleFilterModelChange = useCallback(
    (newModel: GridFilterModel) => {
      setFilterModel(newModel);
      setPaginationModel((prev) => ({ ...prev, page: 0 }));

      const filterItem = newModel.items[0];
      const newQuickFilterValue = (newModel.quickFilterValues || [])
        .join(" ")
        .trim();

      const params = new URLSearchParams(searchParams);
      const { filterField, filterOperator, filterValue } =
        getFilterItemParams(filterItem);
      params.delete("filterField");
      params.delete("filterOperator");
      params.delete("filterValue");
      params.delete("quickFilterValue");
      params.set("page", "1");
      if (filterField) params.set("filterField", filterField);
      if (filterOperator) params.set("filterOperator", filterOperator);
      if (filterValue) params.set("filterValue", filterValue);
      if (newQuickFilterValue)
        params.set("quickFilterValue", newQuickFilterValue);

      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
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
          <DialogContentText>
            {tAdmins.rich("actions.unbanUser.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              email,
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
                const message = tAdmins("actions.unbanUser.success");
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
    [locale, mutateAdmins, setDialog, tAdmins],
  );

  const handleImpersonateUser = useCallback(
    (user: User) => {
      setDialog({
        content: (
          <DialogContentText>
            {tAdmins.rich("actions.impersonateUser.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              email: user.email,
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
                  tAdmins("actions.impersonateUser.success", {
                    email: user.email,
                  }),
                  { variant: "success" },
                );

                sessionStorage.setItem(
                  IMPERSONATE_RETURN_KEY,
                  `${pathname}?page=${paginationModel.page + 1}&pageSize=${paginationModel.pageSize}`,
                );

                router.replace(DEFAULT_AUTHENTICATED_ROUTE);
              },
            },
          );
        },
        open: true,
        title: tAdmins("actions.impersonateUser.title"),
      });
    },
    [locale, paginationModel, pathname, router, setDialog, setSession, tAdmins],
  );

  const handleRemoveUser = useCallback(
    ({ id, email }: User) => {
      setDialog({
        content: (
          <DialogContentText>
            {tAdmins.rich("actions.removeUser.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              email,
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
                const message = tAdmins("actions.removeUser.success");
                enqueueSnackbar(message, { variant: "success" });

                mutateAdmins();
              },
            },
          );
        },
        open: true,
        title: tAdmins("actions.removeUser.title"),
      });
    },
    [locale, mutateAdmins, setDialog, tAdmins],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        disableColumnMenu: true,
        field: "actions",
        filterable: false,
        headerName: tAdmins("actions.label"),
        renderCell: ({ row }: GridRenderCellParams<User>) => {
          const isBanned =
            row.banned &&
            (!row.banExpires || new Date(row.banExpires) > new Date());
          const isCurrentUser = row.id === currentUserId;

          const { hasUserSessions, userSession } = userSessions;
          const hasUserSession = userSession[row.id];

          return (
            <Stack height="100%" direction="row" alignItems="center" gap={1}>
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
              {hasUserSessions && (
                <Tooltip title={tAdmins("userSessions.label")}>
                  <StyledIconButton
                    onClick={(event) => {
                      event.stopPropagation();

                      router.push(`/admins/${row.id}`);
                    }}
                    size="small"
                    visible={hasUserSession}
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
              <Tooltip title={tAdmins("actions.removeUser.title")}>
                <StyledIconButton
                  color="error"
                  onClick={(event) => {
                    event.stopPropagation();

                    handleRemoveUser(row);
                  }}
                  size="small"
                  visible={!isCurrentUser}
                >
                  <Delete fontSize="small" />
                </StyledIconButton>
              </Tooltip>
            </Stack>
          );
        },
        resizable: false,
        sortable: false,
      },
      {
        field: "image",
        filterable: false,
        headerName: tAdmins("image"),
        renderCell: ({ row: { image, name } }: GridRenderCellParams<User>) => (
          <Stack height="100%" direction="row" alignItems="center">
            <StyledAvatar alt={name} src={image || undefined}>
              {name[0]}
            </StyledAvatar>
          </Stack>
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
          role && (
            <Chip
              color={ROLE_COLOR_MAP[role]}
              label={tAdmins(`role.${role}`)}
              size="small"
              variant="outlined"
            />
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
      hasImpersonableUser,
      router,
      tAdmins,
      tCommon,
      textFilterOperators,
      userSessions,
    ],
  );

  return (
    <>
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={2}>
        <Button
          onClick={handleCreateUser}
          size="small"
          startIcon={<PersonAdd />}
          variant="contained"
        >
          {tAdmins("actions.createUser.title")}
        </Button>
      </Stack>
      <DataGrid
        {...DATA_GRID_PROPS}
        apiRef={apiRef}
        columns={columns}
        filterMode="server"
        filterModel={filterModel}
        loading={isValidating}
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
