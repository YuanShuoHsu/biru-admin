"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import TabPanel from "@/components/TabPanel";

import { DATA_GRID_PROPS } from "@/constants/dataGrid";

import { useRouter } from "@/i18n/navigation";

import { authClient } from "@/lib/auth-client";

import { Business, Delete, GroupAdd, PersonRemove } from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { a11yProps } from "@/utils/tab";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface Member {
  id: string;
  userId: string;
  role: "owner" | "admin" | "member";
  createdAt: Date | string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

interface Invitation {
  id: string;
  email: string;
  role: "owner" | "admin" | "member";
  status: "pending" | "accepted" | "rejected" | "canceled" | "cancelled";
  expiresAt: Date | string;
  createdAt: Date | string;
}

interface FullOrganization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  createdAt: Date | string;
  members: Member[];
  invitations: Invitation[];
}

interface InviteForm {
  email: string;
  role: "admin" | "member";
}

const ROLE_COLOR_MAP: Record<string, "error" | "warning" | "default"> = {
  owner: "error",
  admin: "warning",
  member: "default",
};

const STATUS_COLOR_MAP: Record<
  string,
  "default" | "success" | "error" | "warning"
> = {
  pending: "warning",
  accepted: "success",
  rejected: "error",
  cancelled: "default",
};

interface OrganizationsSlugProps {
  org: FullOrganization;
}

const OrganizationsSlug = ({ org }: OrganizationsSlugProps) => {
  const [tab, setTab] = useState(0);
  const [inviteOpen, setInviteOpen] = useState(false);
  const { setDialog } = useDialogStore((state) => state);

  const { control, handleSubmit, reset, formState } = useForm<InviteForm>({
    defaultValues: { email: "", role: "member" },
  });

  const format = useFormatter();
  const router = useRouter();

  const tDialog = useTranslations("dialog");
  const tOrg = useTranslations("organizations");
  const tMembers = useTranslations("organizations.members");
  const tInvitations = useTranslations("organizations.invitations");

  const handleInviteSubmit = async (values: InviteForm) => {
    await authClient.organization.inviteMember(
      {
        organizationId: org.id,
        email: values.email,
        role: values.role,
      },
      {
        onError: () => {
          enqueueSnackbar(tMembers("invite.error"), { variant: "error" });
        },
        onSuccess: () => {
          enqueueSnackbar(tMembers("invite.success"), { variant: "success" });
          setInviteOpen(false);
          reset();
          router.refresh();
        },
      },
    );
  };

  const handleOpenRemoveConfirm = useCallback(
    (member: Member) => {
      setDialog({
        content: (
          <DialogContentText>
            {tMembers("remove.confirm", { name: member.user.name })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          await authClient.organization.removeMember(
            {
              organizationId: org.id,
              memberIdOrEmail: member.userId,
            },
            {
              onError: () => {
                throw new Error(tMembers("remove.error"));
              },
              onSuccess: () => {
                enqueueSnackbar(tMembers("remove.success"), {
                  variant: "success",
                });
                router.refresh();
              },
            },
          );
        },
        open: true,
        title: tMembers("remove.title"),
      });
    },
    [org.id, router, setDialog, tMembers],
  );

  const handleUpdateMemberRole = useCallback(
    async (memberId: string, role: "admin" | "member") => {
      await authClient.organization.updateMemberRole(
        {
          organizationId: org.id,
          memberId,
          role,
        },
        {
          onError: () => {
            enqueueSnackbar(tMembers("setRole.error"), { variant: "error" });
          },
          onSuccess: () => {
            enqueueSnackbar(tMembers("setRole.success"), {
              variant: "success",
            });
            router.refresh();
          },
        },
      );
    },
    [org.id, router, tMembers],
  );

  const handleOpenCancelConfirm = useCallback(
    (invitation: Invitation) => {
      setDialog({
        content: (
          <DialogContentText>
            {tInvitations("cancel.confirm", { email: invitation.email })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          await authClient.organization.cancelInvitation(
            { invitationId: invitation.id },
            {
              onError: () => {
                throw new Error(tInvitations("cancel.error"));
              },
              onSuccess: () => {
                enqueueSnackbar(tInvitations("cancel.success"), {
                  variant: "success",
                });
                router.refresh();
              },
            },
          );
        },
        open: true,
        title: tInvitations("cancel.title"),
      });
    },
    [router, setDialog, tInvitations],
  );

  const pendingInvitations = org.invitations.filter(
    (inv) => inv.status === "pending",
  );

  const memberColumns = useMemo<GridColDef[]>(
    () => [
      {
        field: "actions",
        headerName: tMembers("columns.actions"),
        resizable: false,
        renderCell: ({ row }: GridRenderCellParams<Member>) => {
          if (row.role === "owner") return null;
          return (
            <Stack height="100%" direction="row" alignItems="center" gap={1}>
              <Tooltip title={tMembers("actions.remove")}>
                <IconButton
                  size="small"
                  color="error"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleOpenRemoveConfirm(row);
                  }}
                >
                  <PersonRemove fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          );
        },
        sortable: false,
      },
      {
        field: "avatar",
        headerName: "",
        resizable: false,
        sortable: false,
        renderCell: ({ row }: GridRenderCellParams<Member>) => (
          <Stack height="100%" direction="row" alignItems="center">
            <Avatar
              src={row.user.image ?? undefined}
              sx={{ width: 24, height: 24, fontSize: 12 }}
            >
              {row.user.name?.[0]?.toUpperCase()}
            </Avatar>
          </Stack>
        ),
      },
      {
        field: "name",
        headerName: tMembers("columns.name"),
        valueGetter: (_value: unknown, row: Member) => row.user.name,
      },
      {
        field: "email",
        headerName: tMembers("columns.email"),
        valueGetter: (_value: unknown, row: Member) => row.user.email,
      },
      {
        field: "role",
        headerName: tMembers("columns.role"),
        renderCell: ({ row }: GridRenderCellParams<Member>) => {
          if (row.role === "owner") {
            return (
              <Stack height="100%" direction="row" alignItems="center">
                <Chip
                  label={tMembers("roles.owner")}
                  color="error"
                  size="small"
                  variant="outlined"
                />
              </Stack>
            );
          }
          return (
            <Stack height="100%" direction="row" alignItems="center">
              <Select
                size="small"
                value={row.role}
                onChange={(e) =>
                  handleUpdateMemberRole(
                    row.id,
                    e.target.value as "admin" | "member",
                  )
                }
                variant="standard"
                sx={{ fontSize: "0.8rem", minWidth: 90 }}
              >
                <MenuItem value="admin">{tMembers("roles.admin")}</MenuItem>
                <MenuItem value="member">{tMembers("roles.member")}</MenuItem>
              </Select>
            </Stack>
          );
        },
        sortable: false,
      },
      {
        field: "createdAt",
        headerName: tMembers("columns.joinedAt"),
        valueFormatter: (value: Date | string) =>
          format.dateTime(new Date(value), "short"),
      },
    ],
    [format, handleOpenRemoveConfirm, handleUpdateMemberRole, tMembers],
  );

  const invitationColumns = useMemo<GridColDef[]>(
    () => [
      {
        field: "actions",
        headerName: tInvitations("columns.actions"),
        resizable: false,
        renderCell: ({ row }: GridRenderCellParams<Invitation>) => {
          if (row.status !== "pending") return null;
          return (
            <Stack height="100%" direction="row" alignItems="center" gap={1}>
              <Tooltip title={tInvitations("actions.cancel")}>
                <IconButton
                  size="small"
                  color="error"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleOpenCancelConfirm(row);
                  }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          );
        },
        sortable: false,
      },
      {
        field: "email",
        headerName: tInvitations("columns.email"),
      },
      {
        field: "role",
        headerName: tInvitations("columns.role"),
        renderCell: ({ row }: GridRenderCellParams<Invitation>) => (
          <Stack height="100%" direction="row" alignItems="center">
            <Chip
              label={tMembers(
                `roles.${row.role}` as
                  | "roles.owner"
                  | "roles.admin"
                  | "roles.member",
              )}
              color={ROLE_COLOR_MAP[row.role] ?? "default"}
              size="small"
              variant="outlined"
            />
          </Stack>
        ),
        sortable: false,
      },
      {
        field: "status",
        headerName: tInvitations("columns.status"),
        renderCell: ({ row }: GridRenderCellParams<Invitation>) => (
          <Stack height="100%" direction="row" alignItems="center">
            <Chip
              label={tInvitations(
                `status.${row.status}` as
                  | "status.pending"
                  | "status.accepted"
                  | "status.rejected"
                  | "status.cancelled",
              )}
              color={STATUS_COLOR_MAP[row.status] ?? "default"}
              size="small"
              variant="outlined"
            />
          </Stack>
        ),
        sortable: false,
      },
      {
        field: "expiresAt",
        headerName: tInvitations("columns.expiresAt"),
        valueFormatter: (value: Date | string) =>
          format.dateTime(new Date(value), "short"),
      },
    ],
    [format, handleOpenCancelConfirm, tInvitations, tMembers],
  );

  return (
    <>
      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" alignItems="center" gap={2}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              bgcolor="primary.main"
              color="primary.contrastText"
              borderRadius={2}
              width={56}
              height={56}
              flexShrink={0}
            >
              <Business />
            </Box>
            <Box flexGrow={1}>
              <Typography variant="h6" fontWeight={700}>
                {org.name}
              </Typography>
              <Stack direction="row" gap={1} alignItems="center" mt={0.5}>
                <Chip
                  label={org.slug}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: "0.75rem" }}
                />
                <Typography variant="caption" color="text.secondary">
                  {format.dateTime(new Date(org.createdAt), "short")}
                </Typography>
              </Stack>
            </Box>
            <Grid container spacing={3} sx={{ maxWidth: 300 }}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  {tOrg("detail.info.memberCount")}
                </Typography>
                <Typography variant="h6" fontWeight={600}>
                  {org.members.length}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  {tInvitations("label")}
                </Typography>
                <Typography variant="h6" fontWeight={600}>
                  {pendingInvitations.length}
                </Typography>
              </Grid>
            </Grid>
          </Stack>
        </CardContent>
      </Card>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab {...a11yProps(0)} label={tMembers("label")} />
          <Tab
            {...a11yProps(1)}
            label={
              <Stack direction="row" gap={0.5} alignItems="center">
                {tInvitations("label")}
                {pendingInvitations.length > 0 && (
                  <Chip
                    label={pendingInvitations.length}
                    size="small"
                    color="warning"
                    sx={{ height: 18, fontSize: "0.7rem" }}
                  />
                )}
              </Stack>
            }
          />
        </Tabs>
      </Box>
      <TabPanel index={0} value={tab}>
        <Stack direction="row">
          <Button
            startIcon={<GroupAdd />}
            onClick={() => setInviteOpen(true)}
            size="small"
            variant="contained"
          >
            {tMembers("actions.invite")}
          </Button>
        </Stack>
        <DataGrid
          {...DATA_GRID_PROPS}
          columns={memberColumns}
          rows={org.members}
        />
      </TabPanel>
      <TabPanel index={1} value={tab}>
        <DataGrid
          {...DATA_GRID_PROPS}
          columns={invitationColumns}
          rows={org.invitations}
        />
      </TabPanel>
      <Dialog
        open={inviteOpen}
        onClose={() => {
          setInviteOpen(false);
          reset();
        }}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSubmit(handleInviteSubmit)}>
          <DialogTitle>{tMembers("invite.title")}</DialogTitle>
          <DialogContent>
            <Stack gap={2} pt={1}>
              <Controller
                name="email"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={tMembers("invite.fields.email")}
                    type="email"
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
                    <InputLabel>{tMembers("invite.fields.role")}</InputLabel>
                    <Select {...field} label={tMembers("invite.fields.role")}>
                      <MenuItem value="member">
                        {tMembers("roles.member")}
                      </MenuItem>
                      <MenuItem value="admin">
                        {tMembers("roles.admin")}
                      </MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              disabled={formState.isSubmitting}
              onClick={() => {
                setInviteOpen(false);
                reset();
              }}
            >
              {tDialog("cancel")}
            </Button>
            <Button
              loading={formState.isSubmitting}
              loadingPosition="end"
              type="submit"
              variant="contained"
            >
              {tMembers("actions.invite")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export default OrganizationsSlug;
