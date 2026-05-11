// https://mui.com/x/react-data-grid/column-dimensions/#ColumnAutosizingAsync.tsx
// https://mui.com/x/react-data-grid/filtering/
// https://mui.com/x/react-data-grid/filtering/customization/
// https://mui.com/x/react-data-grid/filtering/quick-filter/
// https://mui.com/x/react-data-grid/filtering/server-side/
// https://mui.com/x/react-data-grid/pagination/
// https://mui.com/x/react-data-grid/performance/
// https://mui.com/x/react-data-grid/server-side-data/

"use client";

import type { UserWithRole } from "better-auth/client/plugins";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import useSWR from "swr";

import BanUserDialogContent from "./BanUserDialogContent";
import { SEARCH_FIELDS, SEARCH_OPERATORS } from "./constants";
import CreateUserDialogContent from "./CreateUserDialogContent";
import { type SearchForm, useSearchFormSchema } from "./definitions";
import SetRoleDialogContent from "./SetRoleDialogContent";
import SetUserPasswordDialogContent from "./SetUserPasswordDialogContent";
import UpdateUserDialogContent from "./UpdateUserDialogContent";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";
import {
  DEFAULT_AUTHENTICATED_ROUTE,
  IMPERSONATE_RETURN_KEY,
} from "@/constants/route";

import { zodResolver } from "@hookform/resolvers/zod";

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
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import type {
  GridColDef,
  GridFilterModel,
  GridFilterOperator,
  GridPaginationModel,
  GridRenderCellParams,
  GridSortModel,
} from "@mui/x-data-grid";
import { GridFilterInputValue, useGridApiRef } from "@mui/x-data-grid";

import { useAuthStore } from "@/providers/auth-store-provider";
import { useDialogStore } from "@/providers/dialog-store-provider";

import type { AdminRole, AdminUser } from "@/types/admins";

import { getUserSessions, type UserSessions } from "@/utils/admins";

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

type ListUsersQuery = NonNullable<
  Parameters<typeof authClient.admin.listUsers>[0]["query"]
>;
type SearchField = NonNullable<ListUsersQuery["searchField"]>;
type SearchOperator = NonNullable<ListUsersQuery["searchOperator"]>;
type FilterOperator = NonNullable<ListUsersQuery["filterOperator"]>;
const COLUMN_FILTER_OPERATORS = [
  "contains",
  "starts_with",
  "ends_with",
] as const satisfies FilterOperator[];

const getQuickFilterValue = (model: GridFilterModel) => {
  return model.quickFilterValues?.join(" ") || "";
};

const isFilterOperator = (value: string): value is FilterOperator =>
  COLUMN_FILTER_OPERATORS.some((operator) => operator === value);

const getColumnFilterItem = (model: GridFilterModel) => {
  const item = model.items[0];

  return {
    filterValue: typeof item?.value === "string" ? item.value : "",
    filterField: item?.field || "",
    filterOperator: item?.operator || "",
  };
};

const ROLE_COLOR_MAP: Record<AdminRole, "error" | "default"> = {
  admin: "error",
  user: "default",
};

interface AdminsProps {
  page: number;
  pageSize: number;
  rows: UserWithRole[];
  rowCount: number;
  filterField?: string;
  filterOperator?: FilterOperator;
  filterValue?: string;
  searchField?: SearchField;
  searchOperator?: SearchOperator;
  searchValue?: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  userSessions: UserSessions;
}

const Admins = ({
  page,
  pageSize,
  rows: initialRows,
  rowCount: initialRowCount,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  searchField: initialSearchField = "name",
  searchOperator: initialSearchOperator = "contains",
  searchValue: initialSearchValue,
  sortBy,
  sortDirection,
  userSessions: initialUserSessions,
}: AdminsProps) => {
  const initialFilterItems: GridFilterModel["items"] =
    initialFilterField && initialFilterOperator && initialFilterValue
      ? [
          {
            field: initialFilterField,
            operator: initialFilterOperator,
            value: initialFilterValue,
          },
        ]
      : [];

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: page - 1,
    pageSize,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>(
    sortBy && sortDirection ? [{ field: sortBy, sort: sortDirection }] : [],
  );
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: initialFilterItems,
    quickFilterValues: initialSearchValue ? initialSearchValue.split(" ") : [],
  });

  const { session, setSession } = useAuthStore((state) => state);
  const { setDialog } = useDialogStore((state) => state);

  const searchFormSchema = useSearchFormSchema();
  const {
    control,
    formState: { errors },
    register,
  } = useForm<SearchForm>({
    defaultValues: {
      searchField: initialSearchField,
      searchOperator: initialSearchOperator,
      searchValue: initialSearchValue ?? "",
    },
    resolver: zodResolver(searchFormSchema),
  });

  const searchField = useWatch({ control, name: "searchField" });
  const searchOperator = useWatch({ control, name: "searchOperator" });
  const searchValue = useWatch({ control, name: "searchValue" });

  const format = useFormatter();

  const apiRef = useGridApiRef();

  const locale = useLocale();

  const pathname = usePathname();

  const router = useRouter();

  const searchParams = useSearchParams();

  const columnFilterItem = getColumnFilterItem(filterModel);

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
      paginationModel.page,
      paginationModel.pageSize,
      sortModel,
      searchValue,
      searchField,
      searchOperator,
      columnFilterItem.filterField,
      columnFilterItem.filterOperator,
      columnFilterItem.filterValue,
    ],
    async ([
      ,
      page,
      pageSize,
      sortModel,
      searchValue,
      searchField,
      searchOperator,
      filterField,
      filterOperator,
      filterValue,
    ]: [
      string,
      number,
      number,
      GridSortModel,
      string,
      SearchField,
      SearchOperator,
      string,
      string,
      string,
    ]) => {
      const baseQuery = {
        limit: pageSize,
        offset: page * pageSize,
        sortBy: sortModel[0]?.field || "createdAt",
        sortDirection: sortModel[0]?.sort || "desc",
      };
      const query: NonNullable<
        Parameters<typeof authClient.admin.listUsers>[0]["query"]
      > = {
        ...baseQuery,
      };

      const validFilterOperator = isFilterOperator(filterOperator)
        ? filterOperator
        : undefined;

      if (filterField && validFilterOperator && filterValue) {
        query.filterField = filterField;
        query.filterOperator = validFilterOperator;
        query.filterValue = filterValue;
      }

      if (searchField && searchOperator && searchValue) {
        query.searchValue = searchValue;
        query.searchField = searchField;
        query.searchOperator = searchOperator;
      }

      const { data } = await authClient.admin.listUsers({
        query,
      });
      const userRows = data?.users || [];
      const userSessions = await getUserSessions(userRows);

      return {
        rows: userRows,
        rowCount: data?.total || 0,
        userSessions,
      };
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

  const tAdmins = useTranslations("admins");
  const tToolbar = useTranslations("dataGrid.toolbar");

  const fieldLabelMap: Record<SearchField, string> = {
    name: tAdmins("name"),
    email: tAdmins("email.label"),
  };

  const filterOperators = useMemo<GridFilterOperator[]>(
    () =>
      COLUMN_FILTER_OPERATORS.map((value) => ({
        getApplyFilterFn: () => null,
        InputComponent: GridFilterInputValue,
        label: tToolbar(`search.operator.${value}`),
        value,
      })),
    [tToolbar],
  );

  const handlePaginationModelChange = useCallback(
    (newModel: GridPaginationModel) => {
      setPaginationModel(newModel);

      const params = new URLSearchParams({
        ...Object.fromEntries(searchParams),
        page: String(newModel.page + 1),
        pageSize: String(newModel.pageSize),
      });
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const handleSortModelChange = useCallback(
    (newModel: GridSortModel) => {
      setSortModel(newModel);
      setPaginationModel((prev) => ({ ...prev, page: 0 }));

      const sortItem = newModel[0];
      const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        sortBy: _sortBy,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        sortDirection: _sortDirection,
        ...rest
      } = Object.fromEntries(searchParams);
      const params = new URLSearchParams({
        ...rest,
        page: "1",
        ...(sortItem?.field && { sortBy: sortItem.field }),
        ...(sortItem?.sort && { sortDirection: sortItem.sort }),
      });

      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const handleFilterModelChange = useCallback(
    (newModel: GridFilterModel) => {
      setFilterModel(newModel);

      const nextQuickSearchValue = getQuickFilterValue(newModel);
      const nextColumnFilterItem = getColumnFilterItem(newModel);

      setPaginationModel((prev) => ({ ...prev, page: 0 }));

      const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        filterField: _ff,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        filterOperator: _fo,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        filterValue: _fv,
        ...rest
      } = Object.fromEntries(searchParams);

      const params = new URLSearchParams({
        ...rest,
        page: "1",
        ...(nextColumnFilterItem.filterValue &&
          nextColumnFilterItem.filterField &&
          nextColumnFilterItem.filterOperator && {
            filterField: nextColumnFilterItem.filterField,
            filterOperator: nextColumnFilterItem.filterOperator,
            filterValue: nextColumnFilterItem.filterValue,
          }),
        ...(nextQuickSearchValue && {
          searchValue: nextQuickSearchValue,
        }),
      });
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

  const handleSetRole = useCallback(
    (user: UserWithRole) => {
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
    (user: UserWithRole) => {
      setDialog({
        content: <SetUserPasswordDialogContent user={user} />,
        formId: "set-user-password-form",
        open: true,
        title: tAdmins("actions.setUserPassword.title"),
      });
    },
    [setDialog, tAdmins],
  );

  const handleUpdateUser = useCallback(
    (user: AdminUser) => {
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

  const handleBanUser = useCallback(
    (user: UserWithRole) => {
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
    ({ id, email }: UserWithRole) => {
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
    (user: UserWithRole) => {
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
    ({ id, email }: UserWithRole) => {
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
        renderCell: ({ row }: GridRenderCellParams<UserWithRole>) => {
          const isBanned =
            row.banned &&
            (!row.banExpires || new Date(row.banExpires) > new Date());
          const isCurrentUser = row.id === currentUserId;

          const { hasUserSessions, userSession } = userSessions;
          const hasUserSession = userSession[row.id];

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
              <Tooltip title={tAdmins("actions.updateUser.title")}>
                <IconButton
                  onClick={(event) => {
                    event.stopPropagation();

                    handleUpdateUser(row as AdminUser);
                  }}
                  size="small"
                >
                  <ManageAccounts fontSize="small" />
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
        renderCell: ({
          row: { image, name },
        }: GridRenderCellParams<AdminUser>) => (
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
        filterOperators,
        headerName: tAdmins("name"),
      },
      {
        field: "email",
        filterOperators,
        headerName: tAdmins("email.label"),
      },
      {
        field: "role",
        filterable: false,
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
        filterable: false,
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
        filterable: false,
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
        filterable: false,
        headerName: tAdmins("createdAt"),
        valueFormatter: (value: Date) =>
          format.dateTime(new Date(value), "short"),
      },
    ],
    [
      currentUserId,
      filterOperators,
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
      userSessions,
    ],
  );

  return (
    <>
      <Stack
        direction="row"
        flexWrap="wrap"
        justifyContent="space-between"
        alignItems="center"
        gap={1}
      >
        <Button
          onClick={handleCreateUser}
          size="small"
          startIcon={<PersonAdd />}
          variant="contained"
        >
          {tAdmins("actions.createUser.title")}
        </Button>
        <Stack
          marginLeft="auto"
          direction="row"
          flexWrap="wrap"
          justifyContent="flex-end"
          alignItems="center"
          gap={1}
        >
          <TextField
            error={!!errors.searchField}
            helperText={errors.searchField?.message}
            label={tToolbar("search.field")}
            select
            size="small"
            slotProps={{
              inputLabel: { shrink: true },
              select: {
                displayEmpty: true,
                renderValue: (selected) =>
                  selected ? (
                    fieldLabelMap[selected as SearchField]
                  ) : (
                    <em>{tToolbar("search.fieldPlaceholder")}</em>
                  ),
              },
            }}
            value={searchField}
            {...register("searchField", {
              onChange: (e) => {
                setPaginationModel((prev) => ({ ...prev, page: 0 }));

                const newField = e.target.value as SearchField;
                const params = new URLSearchParams(searchParams.toString());
                params.set("page", "1");
                params.delete("searchField");
                params.delete("searchOperator");
                params.delete("searchValue");
                if (searchValue) {
                  params.set("searchField", newField);
                  params.set("searchOperator", searchOperator);
                  params.set("searchValue", searchValue);
                }
                router.replace(`${pathname}?${params.toString()}`);
              },
            })}
          >
            <MenuItem disabled value="">
              <em>{tToolbar("search.fieldPlaceholder")}</em>
            </MenuItem>
            {SEARCH_FIELDS.map((field) => (
              <MenuItem key={field} value={field}>
                {fieldLabelMap[field]}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label={tToolbar("search.operator.label")}
            select
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
            value={searchOperator}
            {...register("searchOperator", {
              onChange: (e) => {
                setPaginationModel((prev) => ({ ...prev, page: 0 }));

                const newOperator = e.target.value as SearchOperator;
                const params = new URLSearchParams(searchParams.toString());
                params.set("page", "1");
                params.delete("searchField");
                params.delete("searchOperator");
                params.delete("searchValue");
                if (searchValue) {
                  params.set("searchField", searchField);
                  params.set("searchOperator", newOperator);
                  params.set("searchValue", searchValue);
                }
                router.replace(`${pathname}?${params.toString()}`);
              },
            })}
          >
            {SEARCH_OPERATORS.map((op) => (
              <MenuItem key={op} value={op}>
                {tToolbar(`search.operator.${op}`)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            error={!!errors.searchValue}
            helperText={errors.searchValue?.message}
            label={tToolbar("search.label")}
            placeholder={tToolbar("search.placeholder")}
            size="small"
            {...register("searchValue", {
              onChange: (e) => {
                setPaginationModel((prev) => ({ ...prev, page: 0 }));

                const newSearchValue = e.target.value as string;
                const params = new URLSearchParams(searchParams.toString());
                params.set("page", "1");
                params.delete("searchField");
                params.delete("searchOperator");
                params.delete("searchValue");
                if (newSearchValue) {
                  params.set("searchField", searchField);
                  params.set("searchOperator", searchOperator);
                  params.set("searchValue", newSearchValue);
                }
                router.replace(`${pathname}?${params.toString()}`);
              },
            })}
          />
        </Stack>
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
