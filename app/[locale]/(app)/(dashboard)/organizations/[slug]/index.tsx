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

import UpdateMemberRoleDialogContent from "./UpdateMemberRoleDialogContent";
import InviteMemberDialogContent from "./InviteMemberDialogContent";

import TabPanel from "@/components/TabPanel";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";

import { useRouter } from "@/i18n/navigation";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import {
  Delete,
  Edit,
  ExitToApp,
  GroupAdd,
  PersonRemove,
} from "@mui/icons-material";
import {
  Avatar,
  Button,
  Chip,
  DialogContentText,
  IconButton,
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

import type {
  ActiveOrganization,
  Invitation,
  Member,
} from "@/types/organizations";

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

const ROLE_RANK: Record<string, number> = {
  owner: 3,
  admin: 2,
  member: 1,
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

  const { session, setSession } = useAuthStore((state) => state);
  const { setDialog } = useDialogStore((state) => state);

  const currentUserId = session?.user?.id;
  const currentUserRole = useMemo(
    () => members.find(({ userId }) => userId === currentUserId)?.role,
    [currentUserId, members],
  );

  const {
    canCancelInvitation,
    canCreateInvitation,
    canDeleteMember,
    canUpdateMember,
  } = useMemo(() => {
    if (!currentUserRole)
      return {
        canCancelInvitation: false,
        canCreateInvitation: false,
        canDeleteMember: false,
        canUpdateMember: false,
      };

    return {
      canCancelInvitation: authClient.organization.checkRolePermission({
        role: currentUserRole,
        permissions: { invitation: ["cancel"] },
      }),
      canCreateInvitation: authClient.organization.checkRolePermission({
        role: currentUserRole,
        permissions: { invitation: ["create"] },
      }),
      canDeleteMember: authClient.organization.checkRolePermission({
        role: currentUserRole,
        permissions: { member: ["delete"] },
      }),
      canUpdateMember: authClient.organization.checkRolePermission({
        role: currentUserRole,
        permissions: { member: ["update"] },
      }),
    };
  }, [currentUserRole]);

  const ownerCount = useMemo(
    () => members.filter(({ role }) => role === "owner").length,
    [members],
  );

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

  const handleInviteMember = () => {
    setDialog({
      content: (
        <InviteMemberDialogContent fetchData={fetchData} organizationId={id} />
      ),
      formId: "invite-member-form",
      open: true,
      title: tMembers("actions.inviteMember.title"),
    });
  };

  const handleUpdateMemberRole = useCallback(
    (member: Member) => {
      setDialog({
        content: (
          <UpdateMemberRoleDialogContent
            fetchData={fetchData}
            member={member}
            organizationId={id}
          />
        ),
        formId: "update-member-role-form",
        open: true,
        title: tMembers("actions.updateMemberRole.title"),
      });
    },
    [fetchData, id, setDialog, tMembers],
  );

  const handleLeaveOrganization = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tOrganizations.rich("actions.leaveOrganization.confirm", {
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
            onSuccess: async () => {
              const message = tOrganizations(
                "actions.leaveOrganization.success",
              );
              enqueueSnackbar(message, { variant: "success" });

              const { data } = await authClient.organization.list();
              if (!data?.length) {
                enqueueSnackbar(
                  getErrorMessage("NO_ACTIVE_ORGANIZATION", locale),
                  { variant: "error" },
                );
                await authClient.signOut();
                setSession(null);
                router.replace("/");

                return;
              }

              router.replace("/organizations");
            },
          },
        );
      },
      open: true,
      title: tOrganizations("actions.leaveOrganization.title"),
    });
  }, [id, locale, name, router, setDialog, setSession, tOrganizations]);

  const handleRemoveMember = useCallback(
    ({ id: memberId, user: { name } }: Member) => {
      setDialog({
        content: (
          <DialogContentText>
            {tMembers.rich("actions.removeMember.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              name,
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          await authClient.organization.removeMember(
            { organizationId: id, memberIdOrEmail: memberId },
            {
              onError: ({ error: { code } }) => {
                const message = getErrorMessage(code, locale);
                enqueueSnackbar(message, { variant: "error" });
              },
              onSuccess: () => {
                const message = tMembers("actions.removeMember.success");
                enqueueSnackbar(message, { variant: "success" });

                fetchData();
              },
            },
          );
        },
        open: true,
        title: tMembers("actions.removeMember.title"),
      });
    },
    [fetchData, id, locale, setDialog, tMembers],
  );

  const memberColumns = useMemo<GridColDef[]>(
    () => [
      {
        disableColumnMenu: true,
        field: "actions",
        headerName: tMembers("actions.label"),
        renderCell: ({ row }: GridRenderCellParams<Member>) => {
          const isCurrentUser = row.userId === currentUserId;
          const isOnlyOwner = row.role === "owner" && ownerCount === 1;
          const isHigherRoleRank =
            ROLE_RANK[currentUserRole!] >= ROLE_RANK[row.role];

          return (
            <Stack direction="row" alignItems="center" height="100%" gap={0.5}>
              {canUpdateMember && !isOnlyOwner && isHigherRoleRank && (
                <Tooltip title={tMembers("actions.updateMemberRole.title")}>
                  <IconButton
                    onClick={(event) => {
                      event.stopPropagation();

                      handleUpdateMemberRole(row);
                    }}
                    size="small"
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {isCurrentUser && !isOnlyOwner && (
                <Tooltip
                  title={tOrganizations("actions.leaveOrganization.title")}
                >
                  <IconButton
                    color="error"
                    onClick={(event) => {
                      event.stopPropagation();

                      handleLeaveOrganization();
                    }}
                    size="small"
                  >
                    <ExitToApp fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {canDeleteMember && !isCurrentUser && !isOnlyOwner && (
                <Tooltip title={tMembers("actions.removeMember.title")}>
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
              )}
            </Stack>
          );
        },
        resizable: false,
        sortable: false,
      },
      {
        field: "avatar",
        headerName: tMembers("avatar"),
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
        headerName: tMembers("name"),
        valueGetter: (_value: unknown, { user: { name } }: Member) => name,
      },
      {
        field: "email",
        headerName: tMembers("email"),
        valueGetter: (_value: unknown, { user: { email } }: Member) => email,
      },
      {
        field: "role",
        headerName: tMembers("role.label"),
        renderCell: ({ row: { role } }: GridRenderCellParams<Member>) => (
          <Chip
            color={ROLE_COLOR_MAP[role]}
            label={tMembers(`role.${role}`)}
            size="small"
            variant="outlined"
          />
        ),
        sortable: false,
      },
      {
        field: "createdAt",
        headerName: tMembers("joinedAt"),
        valueFormatter: (value: Date | string) =>
          format.dateTime(new Date(value), "short"),
      },
    ],
    [
      canDeleteMember,
      canUpdateMember,
      currentUserId,
      currentUserRole,
      format,
      handleUpdateMemberRole,
      handleLeaveOrganization,
      handleRemoveMember,
      ownerCount,
      tMembers,
      tOrganizations,
    ],
  );

  const handleCancelInvitation = useCallback(
    ({ id: invitationId, email }: Invitation) => {
      setDialog({
        content: (
          <DialogContentText>
            {tInvitations.rich("actions.cancelInvitation.confirm", {
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
                const message = tInvitations(
                  "actions.cancelInvitation.success",
                );
                enqueueSnackbar(message, { variant: "success" });

                fetchData();
              },
            },
          );
        },
        open: true,
        title: tInvitations("actions.cancelInvitation.title"),
      });
    },
    [fetchData, locale, setDialog, tInvitations],
  );

  const invitationColumns = useMemo<GridColDef[]>(
    () => [
      {
        field: "actions",
        headerName: tInvitations("actions.label"),
        renderCell: ({ row }: GridRenderCellParams<Invitation>) => (
          <>
            {canCancelInvitation && (
              <Tooltip title={tInvitations("actions.cancelInvitation.title")}>
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
            )}
          </>
        ),
        disableColumnMenu: true,
        resizable: false,
        sortable: false,
      },
      {
        field: "email",
        headerName: tInvitations("email"),
      },
      {
        field: "role",
        headerName: tInvitations("role"),
        renderCell: ({ row: { role } }: GridRenderCellParams<Invitation>) => (
          <Chip
            color={ROLE_COLOR_MAP[role]}
            label={tMembers(`role.${role}`)}
            size="small"
            variant="outlined"
          />
        ),
        sortable: false,
      },
      {
        field: "expiresAt",
        headerName: tInvitations("expiresAt"),
        valueFormatter: (value: Date | string) =>
          format.dateTime(new Date(value), "short"),
      },
    ],
    [
      canCancelInvitation,
      format,
      handleCancelInvitation,
      tInvitations,
      tMembers,
    ],
  );

  const pendingCount = invitations.length;

  const tabs = [
    {
      children: (
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
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1}>
        {canCreateInvitation && (
          <Button
            onClick={handleInviteMember}
            size="small"
            startIcon={<GroupAdd />}
            variant="contained"
          >
            {tMembers("actions.inviteMember.title")}
          </Button>
        )}
      </Stack>
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
