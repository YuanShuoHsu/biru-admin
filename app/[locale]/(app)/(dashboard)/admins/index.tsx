// https://mui.com/x/react-data-grid/column-dimensions/
// https://mui.com/x/react-data-grid/pagination/
// https://mui.com/x/react-data-grid/performance/
// https://mui.com/x/react-data-grid/server-side-data/

"use client";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useSnackbar } from "notistack";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import useSWR, { mutate } from "swr";

import { DATA_GRID_PROPS } from "@/constants/dataGrid";

import { authClient } from "@/lib/auth-client";

import {
  Block,
  CheckCircle,
  Delete,
  LockOpen,
  PersonAdd,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import type {
  GridColDef,
  GridPaginationModel,
  GridRenderCellParams,
  GridValidRowModel,
} from "@mui/x-data-grid";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface AdminUsersQuery {
  page: number;
  limit: number;
  search: string;
  role: string;
}

interface AdminUsersProps {
  query: AdminUsersQuery;
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean;
  createdAt: string;
}

interface ListUsersResponse {
  users: UserRow[];
  total: number;
}

const USERS_SWR_KEY = "admin-users";

const fetchUsers = async (
  query: AdminUsersQuery,
): Promise<ListUsersResponse> => {
  const offset = (query.page - 1) * query.limit;
  const result = await authClient.admin.listUsers({
    query: {
      limit: query.limit,
      offset,
      ...(query.search
        ? { searchField: "email" as const, searchValue: query.search }
        : {}),
    },
  });
  if (result.error) throw result.error;
  return {
    users: (result.data?.users ?? []) as unknown as UserRow[],
    total: result.data?.total ?? 0,
  };
};

interface CreateUserForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: "user" | "admin";
}

interface ConfirmDialog {
  open: boolean;
  type: "ban" | "delete" | null;
  user: UserRow | null;
}

const AdminUsers = ({ query }: AdminUsersProps) => {
  const t = useTranslations("admins.users");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();

  const [searchValue, setSearchValue] = useState(query.search);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
    open: false,
    type: null,
    user: null,
  });

  const swrKey = [USERS_SWR_KEY, query] as const;
  const { data, isLoading } = useSWR(swrKey, ([, q]) => fetchUsers(q));

  const { control, handleSubmit, reset, formState } = useForm<CreateUserForm>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "user",
    },
  });

  const updateParams = useCallback(
    (updates: Partial<AdminUsersQuery>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined && value !== "" && value !== 1) {
          params.set(key, String(value));
        } else {
          params.delete(key);
        }
      });
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== query.search) {
        updateParams({ search: searchValue, page: 1 });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchValue, query.search, updateParams]);

  const handlePaginationChange = (model: GridPaginationModel) => {
    updateParams({ page: model.page + 1, limit: model.pageSize });
  };

  const handleBan = async (user: UserRow) => {
    await authClient.admin.banUser(
      { userId: user.id },
      {
        onError: () => {
          enqueueSnackbar(t("ban.error"), { variant: "error" });
        },
        onSuccess: () => {
          enqueueSnackbar(t("ban.success"), { variant: "success" });
          mutate(swrKey);
        },
      },
    );
    setConfirmDialog({ open: false, type: null, user: null });
  };

  const handleUnban = async (userId: string) => {
    await authClient.admin.unbanUser(
      { userId },
      {
        onError: () => {
          enqueueSnackbar(t("unban.error"), { variant: "error" });
        },
        onSuccess: () => {
          enqueueSnackbar(t("unban.success"), { variant: "success" });
          mutate(swrKey);
        },
      },
    );
  };

  const handleDelete = async (user: UserRow) => {
    await authClient.admin.removeUser(
      { userId: user.id },
      {
        onError: () => {
          enqueueSnackbar(t("delete.error"), { variant: "error" });
        },
        onSuccess: () => {
          enqueueSnackbar(t("delete.success"), { variant: "success" });
          mutate(swrKey);
        },
      },
    );
    setConfirmDialog({ open: false, type: null, user: null });
  };

  const handleSetRole = async (userId: string, role: "user" | "admin") => {
    await authClient.admin.setRole(
      { userId, role },
      {
        onError: () => {
          enqueueSnackbar(t("setRole.error"), { variant: "error" });
        },
        onSuccess: () => {
          enqueueSnackbar(t("setRole.success"), { variant: "success" });
          mutate(swrKey);
        },
      },
    );
  };

  const handleCreateSubmit = async (values: CreateUserForm) => {
    await authClient.admin.createUser(
      {
        name: `${values.firstName} ${values.lastName}`.trim(),
        email: values.email,
        password: values.password,
        role: values.role,
        data: {
          firstName: values.firstName,
          lastName: values.lastName,
          emailSubscribed: true,
          lang: "zh-TW",
        },
      },
      {
        onError: () => {
          enqueueSnackbar(t("create.error"), { variant: "error" });
        },
        onSuccess: () => {
          enqueueSnackbar(t("create.success"), { variant: "success" });
          setCreateOpen(false);
          reset();
          mutate(swrKey);
        },
      },
    );
  };

  const columns: GridColDef<GridValidRowModel>[] = [
    {
      field: "name",
      headerName: t("columns.name"),
      flex: 1,
      minWidth: 140,
    },
    {
      field: "email",
      headerName: t("columns.email"),
      flex: 1.5,
      minWidth: 200,
    },
    {
      field: "role",
      headerName: t("columns.role"),
      width: 130,
      renderCell: ({ row: r }: GridRenderCellParams) => {
        const row = r as UserRow;
        return (
          <Select
            size="small"
            value={row.role || "user"}
            onChange={(e) =>
              handleSetRole(row.id, e.target.value as "user" | "admin")
            }
            onClick={(e) => e.stopPropagation()}
            variant="standard"
            sx={{ fontSize: "0.875rem" }}
          >
            <MenuItem value="user">{t("roles.user")}</MenuItem>
            <MenuItem value="admin">{t("roles.admin")}</MenuItem>
          </Select>
        );
      },
    },
    {
      field: "banned",
      headerName: t("columns.status"),
      width: 110,
      renderCell: ({ row: r }: GridRenderCellParams) => {
        const row = r as UserRow;
        return (
          <Chip
            icon={
              row.banned ? (
                <Block fontSize="small" />
              ) : (
                <CheckCircle fontSize="small" />
              )
            }
            label={row.banned ? t("status.banned") : t("status.active")}
            color={row.banned ? "error" : "success"}
            size="small"
            variant="outlined"
          />
        );
      },
    },
    {
      field: "createdAt",
      headerName: t("columns.createdAt"),
      width: 170,
      valueFormatter: (value: string) =>
        value ? new Date(value).toLocaleString("zh-TW") : "",
    },
    {
      field: "actions",
      headerName: t("columns.actions"),
      width: 110,
      sortable: false,
      renderCell: ({ row: r }: GridRenderCellParams) => {
        const row = r as UserRow;
        return (
          <Stack direction="row" gap={0.5} alignItems="center" height="100%">
            {row.banned ? (
              <Tooltip title={t("actions.unban")}>
                <IconButton
                  size="small"
                  color="success"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnban(row.id);
                  }}
                >
                  <LockOpen fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title={t("actions.ban")}>
                <IconButton
                  size="small"
                  color="warning"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDialog({ open: true, type: "ban", user: row });
                  }}
                >
                  <Block fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title={t("actions.delete")}>
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDialog({ open: true, type: "delete", user: row });
                }}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        );
      },
    },
  ];

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        gap={2}
        mb={2}
      >
        <Box>
          <Typography variant="h6" fontWeight={600}>
            {t("title")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("subtitle")}
          </Typography>
        </Box>
        <Stack direction="row" gap={1}>
          <OutlinedInput
            size="small"
            placeholder={t("search.placeholder")}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            sx={{ width: 240 }}
          />
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => setCreateOpen(true)}
          >
            {t("actions.create")}
          </Button>
        </Stack>
      </Stack>

      <DataGrid
        {...DATA_GRID_PROPS}
        rows={(data?.users ?? []).toReversed()}
        columns={columns}
        rowCount={data?.total ?? 0}
        loading={isLoading}
        paginationMode="server"
        paginationModel={{
          page: query.page - 1,
          pageSize: query.limit,
        }}
        onPaginationModelChange={handlePaginationChange}
        autoHeight
        sx={{ bgcolor: "background.paper", borderRadius: 2 }}
      />

      {/* Create user dialog */}
      <Dialog
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          reset();
        }}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSubmit(handleCreateSubmit)}>
          <DialogTitle>{t("create.title")}</DialogTitle>
          <DialogContent>
            <Stack gap={2} pt={1}>
              <Stack direction="row" gap={2}>
                <Controller
                  name="firstName"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t("create.fields.firstName")}
                      size="small"
                      fullWidth
                      required
                    />
                  )}
                />
                <Controller
                  name="lastName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t("create.fields.lastName")}
                      size="small"
                      fullWidth
                    />
                  )}
                />
              </Stack>
              <Controller
                name="email"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t("create.fields.email")}
                    type="email"
                    size="small"
                    fullWidth
                    required
                  />
                )}
              />
              <Controller
                name="password"
                control={control}
                rules={{ required: true, minLength: 8 }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t("create.fields.password")}
                    type="password"
                    size="small"
                    fullWidth
                    required
                  />
                )}
              />
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <FormControl size="small" fullWidth>
                    <InputLabel>{t("create.fields.role")}</InputLabel>
                    <Select {...field} label={t("create.fields.role")}>
                      <MenuItem value="user">{t("roles.user")}</MenuItem>
                      <MenuItem value="admin">{t("roles.admin")}</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setCreateOpen(false);
                reset();
              }}
            >
              取消
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={formState.isSubmitting}
            >
              {t("actions.create")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Confirm dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() =>
          setConfirmDialog({ open: false, type: null, user: null })
        }
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {confirmDialog.type === "ban" ? t("ban.title") : t("delete.title")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.type === "ban"
              ? t("ban.confirm", { name: confirmDialog.user?.name ?? "" })
              : t("delete.confirm", { name: confirmDialog.user?.name ?? "" })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setConfirmDialog({ open: false, type: null, user: null })
            }
          >
            取消
          </Button>
          <Button
            variant="contained"
            color={confirmDialog.type === "delete" ? "error" : "warning"}
            onClick={() => {
              if (!confirmDialog.user) return;
              if (confirmDialog.type === "ban") handleBan(confirmDialog.user);
              else if (confirmDialog.type === "delete")
                handleDelete(confirmDialog.user);
            }}
          >
            確認
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminUsers;
