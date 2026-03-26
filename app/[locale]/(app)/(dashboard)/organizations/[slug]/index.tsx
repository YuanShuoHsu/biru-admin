"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";

import InviteMemberDialogContent from "./InviteMemberDialogContent";

import TabPanel from "@/components/TabPanel";

import { DATA_GRID_PROPS } from "@/constants/dataGrid";

import { useRouter } from "@/i18n/navigation";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { Delete, GroupAdd, PersonRemove } from "@mui/icons-material";
import {
  Avatar,
  Button,
  Chip,
  DialogContentText,
  IconButton,
  MenuItem,
  Select,
  Stack,
  styled,
  Tab,
  Tabs,
  Tooltip,
} from "@mui/material";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { ActiveOrganization, Invitation, Member } from "@/types/auth";

import { stringAvatar } from "@/utils/avatar";
import { a11yProps } from "@/utils/tab";

const StyledAvatar = styled(Avatar)({
  width: 24,
  height: 24,
  fontSize: 12,
});

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

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
  activeOrganization: ActiveOrganization;
}

const OrganizationsSlug = ({
  activeOrganization: { id, invitations, members },
}: OrganizationsSlugProps) => {
  const [value, setValue] = useState(0);

  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const locale = useLocale();

  const router = useRouter();

  const tInvitations = useTranslations("organizations.invitations");
  const tMembers = useTranslations("organizations.members");

  const handleChange = (_: React.SyntheticEvent, newValue: number) =>
    setValue(newValue);

  const handleRemoveMember = useCallback(
    ({ userId, user: { name } }: Member) => {
      setDialog({
        content: (
          <DialogContentText>
            {tMembers("remove.confirm", { name })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          await authClient.organization.removeMember(
            {
              organizationId: id,
              memberIdOrEmail: userId,
            },
            {
              onError: ({ error: { code } }) => {
                const message = getErrorMessage(code, locale);
                enqueueSnackbar(message, { variant: "error" });
              },
              onSuccess: () => {
                const message = tMembers("remove.success");
                enqueueSnackbar(message, {
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
    [id, locale, router, setDialog, tMembers],
  );

  const handleUpdateMemberRole = useCallback(
    async (memberId: string, role: Member["role"]) => {
      await authClient.organization.updateMemberRole(
        {
          organizationId: id,
          memberId,
          role,
        },
        {
          onError: ({ error: { code } }) => {
            const message = getErrorMessage(code, locale);
            enqueueSnackbar(message, { variant: "error" });
          },
          onSuccess: () => {
            const message = tMembers("setRole.success");
            enqueueSnackbar(message, { variant: "success" });

            router.refresh();
          },
        },
      );
    },
    [id, locale, router, tMembers],
  );

  const memberColumns = useMemo<GridColDef[]>(
    () => [
      {
        field: "actions",
        headerName: tMembers("columns.actions"),
        renderCell: ({ row }: GridRenderCellParams<Member>) => {
          if (row.role === "owner") return null;

          return (
            <Stack height="100%" direction="row" alignItems="center" gap={1}>
              <Tooltip title={tMembers("actions.remove")}>
                <IconButton
                  color="error"
                  onClick={(event) => {
                    event.stopPropagation();

                    handleRemoveMember(row);
                  }}
                  size="small"
                >
                  <PersonRemove fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          );
        },
        resizable: false,
        sortable: false,
      },
      {
        field: "avatar",
        headerName: tMembers("columns.avatar"),
        renderCell: ({
          row: {
            user: { image, name },
          },
        }: GridRenderCellParams<Member>) => (
          <Stack height="100%" direction="row" alignItems="center">
            <StyledAvatar
              alt={name}
              src={image || undefined}
              {...stringAvatar(name)}
            />
          </Stack>
        ),
        resizable: false,
        sortable: false,
      },
      {
        field: "name",
        headerName: tMembers("columns.name"),
        valueGetter: (_value: unknown, { user: { name } }: Member) => name,
      },
      {
        field: "email",
        headerName: tMembers("columns.email"),
        valueGetter: (_value: unknown, { user: { email } }: Member) => email,
      },
      {
        field: "role",
        headerName: tMembers("columns.role"),
        renderCell: ({ row: { id, role } }: GridRenderCellParams<Member>) => {
          if (role === "owner") {
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
                value={role}
                onChange={({ target: { value } }) =>
                  handleUpdateMemberRole(id, value)
                }
                variant="standard"
              >
                <MenuItem value="admin">{tMembers("roles.admin")}</MenuItem>
                <MenuItem value="member">{tMembers("roles.member")}</MenuItem>
              </Select>
            </Stack>
          );
        },
      },
      {
        field: "createdAt",
        headerName: tMembers("columns.joinedAt"),
        valueFormatter: (value: Date | string) =>
          format.dateTime(new Date(value), "short"),
      },
    ],
    [format, handleRemoveMember, handleUpdateMemberRole, tMembers],
  );

  const handleCancelInvitation = useCallback(
    ({ id: invitationId, email }: Invitation) => {
      setDialog({
        content: (
          <DialogContentText>
            {tInvitations("cancel.confirm", { email })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          await authClient.organization.cancelInvitation(
            { invitationId },
            {
              onError: ({ error: { code } }) => {
                const message = getErrorMessage(code, locale);
                enqueueSnackbar(message, { variant: "error" });
              },
              onSuccess: () => {
                const message = tInvitations("cancel.success");
                enqueueSnackbar(message, { variant: "success" });

                router.refresh();
              },
            },
          );
        },
        open: true,
        title: tInvitations("cancel.title"),
      });
    },
    [locale, router, setDialog, tInvitations],
  );

  const invitationColumns = useMemo<GridColDef[]>(
    () => [
      {
        field: "actions",
        headerName: tInvitations("columns.actions"),
        renderCell: ({ row }: GridRenderCellParams<Invitation>) => {
          if (row.status !== "pending") return null;

          return (
            <Stack height="100%" direction="row" alignItems="center" gap={1}>
              <Tooltip title={tInvitations("actions.cancel")}>
                <IconButton
                  color="error"
                  onClick={(event) => {
                    event.stopPropagation();

                    handleCancelInvitation(row);
                  }}
                  size="small"
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
        field: "email",
        headerName: tInvitations("columns.email"),
      },
      {
        field: "role",
        headerName: tInvitations("columns.role"),
        renderCell: ({ row: { role } }: GridRenderCellParams<Invitation>) => (
          <Stack height="100%" direction="row" alignItems="center">
            <Chip
              color={ROLE_COLOR_MAP[role] ?? "default"}
              label={tMembers(
                `roles.${role}` as
                  | "roles.owner"
                  | "roles.admin"
                  | "roles.member",
              )}
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
        renderCell: ({ row: { status } }: GridRenderCellParams<Invitation>) => (
          <Stack height="100%" direction="row" alignItems="center">
            <Chip
              color={STATUS_COLOR_MAP[status] || "default"}
              label={tInvitations(
                `status.${status}` as
                  | "status.pending"
                  | "status.accepted"
                  | "status.rejected"
                  | "status.cancelled",
              )}
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
    [format, handleCancelInvitation, tInvitations, tMembers],
  );

  const handleInviteMember = () => {
    setDialog({
      content: <InviteMemberDialogContent organizationId={id} />,
      formId: "invite-member-form",
      open: true,
      title: tMembers("invite.title"),
    });
  };

  const pendingCount = invitations.filter(
    ({ status }) => status === "pending",
  ).length;

  const tabs = [
    {
      children: (
        <>
          <Stack direction="row">
            <Button
              onClick={handleInviteMember}
              size="small"
              startIcon={<GroupAdd />}
              variant="contained"
            >
              {tMembers("actions.invite")}
            </Button>
          </Stack>
          <DataGrid
            {...DATA_GRID_PROPS}
            columns={memberColumns}
            rows={members.toReversed()}
          />
        </>
      ),
      label: tMembers("label"),
    },
    {
      children: (
        <DataGrid
          {...DATA_GRID_PROPS}
          columns={invitationColumns}
          rows={invitations.toReversed()}
        />
      ),
      label: (
        <Stack alignItems="center" direction="row" gap={1}>
          {tInvitations("label")}
          {pendingCount > 0 && (
            <Chip color="secondary" label={pendingCount} size="small" />
          )}
        </Stack>
      ),
    },
  ];

  return (
    <>
      <Tabs
        aria-label="organization tabs"
        onChange={handleChange}
        value={value}
        variant="scrollable"
      >
        {tabs.map(({ label }, index) => (
          <Tab key={index} label={label} {...a11yProps(index)} />
        ))}
      </Tabs>
      {tabs.map(({ children }, index) => (
        <TabPanel index={index} key={index} value={value}>
          {children}
        </TabPanel>
      ))}
    </>
  );
};

export default OrganizationsSlug;
