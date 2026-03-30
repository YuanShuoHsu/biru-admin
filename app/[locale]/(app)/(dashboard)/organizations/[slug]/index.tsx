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

import InviteMemberDialogContent from "./InviteMemberDialogContent";

import TabPanel from "@/components/TabPanel";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";

import { useRouter } from "@/i18n/navigation";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { Delete, ExitToApp, GroupAdd, PersonRemove } from "@mui/icons-material";
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
import { useGridApiRef } from "@mui/x-data-grid";

import { useAuthStore } from "@/providers/auth-store-provider";
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

interface OrganizationsSlugProps {
  activeOrganization: ActiveOrganization;
}

const OrganizationsSlug = ({
  activeOrganization: {
    id,
    invitations: initialInvitations,
    members: initialMembers,
    name,
    slug,
  },
}: OrganizationsSlugProps) => {
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState(initialMembers);
  const [invitations, setInvitations] = useState(
    initialInvitations.filter(({ status }) => status === "pending"),
  );

  const membersApiRef = useGridApiRef();
  const invitationsApiRef = useGridApiRef();

  const { session } = useAuthStore((state) => state);
  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const locale = useLocale();

  const router = useRouter();

  const tInvitations = useTranslations("organizations.invitations");
  const tMembers = useTranslations("organizations.members");
  const tOrganizations = useTranslations("organizations");

  const fetchData = useCallback(async () => {
    setLoading(true);

    const { data } = await authClient.organization.getFullOrganization({
      query: { organizationSlug: slug },
    });
    if (!data) {
      setLoading(false);

      return;
    }

    flushSync(() => {
      setMembers(data.members.toReversed());
      setInvitations(
        data.invitations
          .toReversed()
          .filter(({ status }) => status === "pending"),
      );

      setLoading(false);
    });

    setTimeout(() => {
      (value === 0
        ? membersApiRef
        : invitationsApiRef
      ).current?.autosizeColumns(autosizeOptions);
    }, 0);
  }, [invitationsApiRef, membersApiRef, slug, value]);

  const handleChange = (_: React.SyntheticEvent, newValue: number) =>
    setValue(newValue);

  const handleLeaveOrganization = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tOrganizations.rich("leave.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
            name,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        await authClient.organization.leave(
          { organizationId: id },
          {
            onError: ({ error: { code } }) => {
              const message = getErrorMessage(code, locale);
              enqueueSnackbar(message, { variant: "error" });
            },
            onSuccess: () => {
              const message = tOrganizations("leave.success");
              enqueueSnackbar(message, { variant: "success" });

              router.push("/organizations");
            },
          },
        );
      },
      open: true,
      title: tOrganizations("leave.title"),
    });
  }, [id, locale, name, router, setDialog, tOrganizations]);

  const handleInviteMember = () => {
    setDialog({
      content: (
        <InviteMemberDialogContent fetchData={fetchData} organizationId={id} />
      ),
      formId: "invite-member-form",
      open: true,
      title: tMembers("invite.title"),
    });
  };

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

                fetchData();
              },
            },
          );
        },
        open: true,
        title: tMembers("remove.title"),
      });
    },
    [fetchData, id, locale, setDialog, tMembers],
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

            fetchData();
          },
        },
      );
    },
    [fetchData, id, locale, tMembers],
  );

  const ownerCount = useMemo(
    () => members.filter(({ role }) => role === "owner").length,
    [members],
  );

  const memberColumns = useMemo<GridColDef[]>(
    () => [
      {
        field: "actions",
        headerName: tMembers("columns.actions"),
        renderCell: ({ row }: GridRenderCellParams<Member>) => {
          const isCurrentUser = row.userId === session?.user.id;
          const isOwner = row.role === "owner";

          const action = isCurrentUser
            ? isOwner && ownerCount === 1
              ? null
              : {
                  icon: <ExitToApp fontSize="small" />,
                  onClick: handleLeaveOrganization,
                  title: tOrganizations("actions.leave"),
                }
            : isOwner
              ? null
              : {
                  icon: <PersonRemove fontSize="small" />,
                  onClick: () => handleRemoveMember(row),
                  title: tMembers("actions.remove"),
                };
          if (!action) return null;
          const { icon, onClick, title } = action;

          return (
            <Tooltip title={title}>
              <IconButton
                color="error"
                onClick={(event) => {
                  event.stopPropagation();

                  onClick();
                }}
                size="small"
              >
                {icon}
              </IconButton>
            </Tooltip>
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
              <Chip
                label={tMembers("roles.owner")}
                color="error"
                size="small"
                variant="outlined"
              />
            );
          }

          return (
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
    [
      format,
      handleLeaveOrganization,
      handleRemoveMember,
      handleUpdateMemberRole,
      ownerCount,
      session,
      tMembers,
      tOrganizations,
    ],
  );

  const handleCancelInvitation = useCallback(
    ({ id: invitationId, email }: Invitation) => {
      setDialog({
        content: (
          <DialogContentText>
            {tInvitations.rich("cancel.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              email,
            })}
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

                fetchData();
              },
            },
          );
        },
        open: true,
        title: tInvitations("cancel.title"),
      });
    },
    [fetchData, locale, setDialog, tInvitations],
  );

  const invitationColumns = useMemo<GridColDef[]>(
    () => [
      {
        field: "actions",
        headerName: tInvitations("columns.actions"),
        renderCell: ({ row }: GridRenderCellParams<Invitation>) => (
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
        ),
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
          <Chip
            color={ROLE_COLOR_MAP[role]}
            label={tMembers(`roles.${role}`)}
            size="small"
            variant="outlined"
          />
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

  const pendingCount = invitations.length;

  const tabs = [
    {
      children: (
        <>
          <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1}>
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
            apiRef={membersApiRef}
            columns={memberColumns}
            loading={loading}
            onPaginationModelChange={() =>
              membersApiRef.current?.autosizeColumns(autosizeOptions)
            }
            rows={members}
          />
        </>
      ),
      label: tMembers("label"),
    },
    {
      children: (
        <DataGrid
          {...DATA_GRID_PROPS}
          apiRef={invitationsApiRef}
          columns={invitationColumns}
          loading={loading}
          onPaginationModelChange={() =>
            invitationsApiRef.current?.autosizeColumns(autosizeOptions)
          }
          rows={invitations}
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
