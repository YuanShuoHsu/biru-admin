"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo } from "react";
import useSWR from "swr";

import InviteMemberDialog from "./InviteMemberDialog";
import UpdateMemberRoleDialog from "./UpdateMemberRoleDialog";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";
import { countKeys, ROLE_RANK } from "@/constants/organizations";

import { useRouter } from "@/i18n/navigation";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { Edit, ExitToApp, GroupAdd, PersonRemove } from "@mui/icons-material";
import {
  Avatar,
  Button,
  Chip,
  DialogContentText,
  IconButton,
  Stack,
  styled,
  Tooltip,
} from "@mui/material";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { useAuthStore } from "@/providers/auth-store-provider";
import { useCountStore } from "@/providers/count-store-provider";
import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  ActiveOrganization,
  Invitation,
  Member,
} from "@/types/organizations";

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

const ROLE_COLOR_MAP: Record<string, "error" | "warning" | "default"> = {
  owner: "error",
  admin: "warning",
  member: "default",
};

interface OrganizationsSlugMembersProps {
  activeOrganization: ActiveOrganization;
  canCreateInvitation: boolean;
  canDeleteMember: boolean;
  canLeaveOrganizations: boolean;
  canRemoveMembers: boolean;
  canUpdateMember: boolean;
  canUpdateMemberRoles: boolean;
  currentUserId: string;
  currentUserRole: string;
}

const OrganizationsSlugMembers = ({
  activeOrganization: {
    id: organizationId,
    members: initialMembers,
    teams: initialTeams,
  },
  canCreateInvitation,
  canDeleteMember,
  canLeaveOrganizations,
  canRemoveMembers,
  canUpdateMember,
  canUpdateMemberRoles,
  currentUserId,
  currentUserRole,
}: OrganizationsSlugMembersProps) => {
  const apiRef = useGridApiRef();

  const { session, setSession } = useAuthStore((state) => state);
  const { setCount } = useCountStore((state) => state);
  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const locale = useLocale();

  const { slug } = useParams<{ slug: string }>();

  const router = useRouter();

  const tMembers = useTranslations("organizations.members");
  const tOrganizations = useTranslations("organizations");

  const {
    data: { rows, teams } = { rows: initialMembers, teams: initialTeams },
    mutate,
    isValidating: loading,
  } = useSWR(
    `organization-members-${slug}`,
    async () => {
      const { data, error } = await authClient.organization.getFullOrganization(
        {
          query: { organizationSlug: decodeURIComponent(slug) },
        },
      );
      if (error) throw error;

      return {
        rows: data.members.toReversed(),
        teams: data.teams,
        pendingInvitationCount: data.invitations.filter(
          ({ status }: Invitation) => status === "pending",
        ).length,
      };
    },
    {
      fallbackData: {
        rows: initialMembers,
        teams: initialTeams,
        pendingInvitationCount: 0,
      },
      onError: (error) => {
        enqueueSnackbar(getErrorMessage(error.code, locale), {
          variant: "error",
        });
      },
      onSuccess: ({ pendingInvitationCount }) => {
        setCount(countKeys.pendingInvitations, pendingInvitationCount);
        setTimeout(() => {
          apiRef.current?.autosizeColumns(autosizeOptions);
        }, 0);
      },
    },
  );

  const ownerCount = useMemo(
    () => rows.filter(({ role }) => role === "owner").length,
    [rows],
  );

  const getMemberPermissions = useCallback(
    ({ role, userId }: Pick<Member, "role" | "userId">) => {
      const isOnlyOwner = role === "owner" && ownerCount === 1;
      const isHigherRoleRank = ROLE_RANK[currentUserRole] >= ROLE_RANK[role];
      const isCurrentUser = userId === currentUserId;

      return {
        canUpdateMemberRole:
          canUpdateMember && !isOnlyOwner && isHigherRoleRank,
        canRemoveMember: canDeleteMember && !isCurrentUser && !isOnlyOwner,
        canLeaveOrganization: isCurrentUser && !isOnlyOwner,
      };
    },
    [
      canDeleteMember,
      canUpdateMember,
      currentUserId,
      currentUserRole,
      ownerCount,
    ],
  );

  const handleInviteMember = () => {
    setDialog({
      content: (
        <InviteMemberDialog
          mutate={mutate}
          organizationId={organizationId}
          teams={teams}
        />
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
          <UpdateMemberRoleDialog
            member={member}
            mutate={mutate}
            organizationId={organizationId}
          />
        ),
        formId: "update-member-role-form",
        open: true,
        title: tMembers("actions.updateMemberRole.title"),
      });
    },
    [mutate, organizationId, setDialog, tMembers],
  );

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
            { organizationId, memberIdOrEmail: memberId },
            {
              onError: ({ error: { code } }) => {
                enqueueSnackbar(getErrorMessage(code, locale), {
                  variant: "error",
                });
              },
              onSuccess: () => {
                enqueueSnackbar(tMembers("actions.removeMember.success"), {
                  variant: "success",
                });
                mutate();
              },
            },
          );
        },
        open: true,
        title: tMembers("actions.removeMember.title"),
      });
    },
    [locale, mutate, organizationId, setDialog, tMembers],
  );

  const handleLeaveOrganization = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tOrganizations.rich("actions.leaveOrganization.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
            name: slug,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        await authClient.organization.leave(
          { organizationId },
          {
            onError: ({ error: { code } }) => {
              enqueueSnackbar(getErrorMessage(code, locale), {
                variant: "error",
              });
            },
            onSuccess: async () => {
              enqueueSnackbar(
                tOrganizations("actions.leaveOrganization.success"),
                { variant: "success" },
              );

              const { data } = await authClient.organization.list();
              if (!data?.length) {
                enqueueSnackbar(
                  getErrorMessage("NO_ACTIVE_ORGANIZATION", locale),
                  {
                    variant: "error",
                  },
                );

                if (session) {
                  await authClient.multiSession.revoke({
                    sessionToken: session.session.token,
                  });
                }

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
  }, [
    locale,
    organizationId,
    router,
    session,
    setDialog,
    setSession,
    slug,
    tOrganizations,
  ]);

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        disableColumnMenu: true,
        field: "actions",
        headerName: tMembers("actions.label"),
        renderCell: ({ row }: GridRenderCellParams<Member>) => {
          const { canUpdateMemberRole, canRemoveMember, canLeaveOrganization } =
            getMemberPermissions(row);

          return (
            <Stack height="100%" direction="row" alignItems="center" gap={0.5}>
              {canUpdateMemberRoles && (
                <Tooltip title={tMembers("actions.updateMemberRole.title")}>
                  <StyledIconButton
                    onClick={(event) => {
                      event.stopPropagation();
                      handleUpdateMemberRole(row);
                    }}
                    size="small"
                    visible={canUpdateMemberRole}
                  >
                    <Edit fontSize="small" />
                  </StyledIconButton>
                </Tooltip>
              )}
              {canRemoveMembers && (
                <Tooltip title={tMembers("actions.removeMember.title")}>
                  <StyledIconButton
                    color="error"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleRemoveMember(row);
                    }}
                    size="small"
                    visible={canRemoveMember}
                  >
                    <PersonRemove fontSize="small" />
                  </StyledIconButton>
                </Tooltip>
              )}
              {canLeaveOrganizations && (
                <Tooltip
                  title={tOrganizations("actions.leaveOrganization.title")}
                >
                  <StyledIconButton
                    color="error"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleLeaveOrganization();
                    }}
                    size="small"
                    visible={canLeaveOrganization}
                  >
                    <ExitToApp fontSize="small" />
                  </StyledIconButton>
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
            <StyledAvatar alt={name} src={image || undefined}>
              {name[0]}
            </StyledAvatar>
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
      canLeaveOrganizations,
      canRemoveMembers,
      canUpdateMemberRoles,
      format,
      getMemberPermissions,
      handleLeaveOrganization,
      handleRemoveMember,
      handleUpdateMemberRole,
      tMembers,
      tOrganizations,
    ],
  );

  return (
    <>
      {canCreateInvitation && (
        <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1}>
          <Button
            onClick={handleInviteMember}
            size="small"
            startIcon={<GroupAdd />}
            variant="contained"
          >
            {tMembers("actions.inviteMember.title")}
          </Button>
        </Stack>
      )}
      <DataGrid
        {...DATA_GRID_PROPS}
        apiRef={apiRef}
        columns={columns}
        loading={loading}
        onPaginationModelChange={() =>
          apiRef.current?.autosizeColumns(autosizeOptions)
        }
        rows={rows}
      />
    </>
  );
};

export default OrganizationsSlugMembers;
