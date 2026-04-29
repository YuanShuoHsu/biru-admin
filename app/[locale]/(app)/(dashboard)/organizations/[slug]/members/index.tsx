"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useTransition } from "react";

import InviteMemberDialogContent from "./InviteMemberDialogContent";
import UpdateMemberRoleDialogContent from "./UpdateMemberRoleDialogContent";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";

import { useRouter } from "@/i18n/navigation";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import {
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
  Tooltip,
} from "@mui/material";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { useAuthStore } from "@/providers/auth-store-provider";
import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Member, Team } from "@/types/organizations";

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

const ROLE_RANK: Record<string, number> = {
  owner: 3,
  admin: 2,
  member: 1,
};

interface MembersContentProps {
  id: string;
  members: Member[];
  slug: string;
  teams: Team[];
}

const MembersContent = ({ id, members, slug, teams }: MembersContentProps) => {
  const [isPending, startTransition] = useTransition();

  const membersApiRef = useGridApiRef();

  const { session, setSession } = useAuthStore((state) => state);
  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();
  const locale = useLocale();
  const router = useRouter();

  const tMembers = useTranslations("organizations.members");
  const tOrganizations = useTranslations("organizations");

  const currentUserId = session?.user?.id;
  const currentUserRole = useMemo(
    () => members.find(({ userId }) => userId === currentUserId)?.role,
    [currentUserId, members],
  );

  const {
    canCancelInvitation: _,
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

  const getMemberPermissions = useCallback(
    ({ role, userId }: Pick<Member, "role" | "userId">) => {
      const isOnlyOwner = role === "owner" && ownerCount === 1;
      const isHigherRoleRank =
        !!currentUserRole && ROLE_RANK[currentUserRole] >= ROLE_RANK[role];
      const isCurrentUser = userId === currentUserId;

      return {
        canUpdateMemberRole:
          canUpdateMember && !isOnlyOwner && isHigherRoleRank,
        canRemoveMember: canDeleteMember && !isCurrentUser && !isOnlyOwner,
        canLeaveOrganization: isCurrentUser && !isOnlyOwner,
      };
    },
    [canDeleteMember, canUpdateMember, currentUserId, currentUserRole, ownerCount],
  );

  const { canUpdateMemberRoles, canRemoveMembers, canLeaveOrganizations } =
    useMemo(() => {
      let canUpdateMemberRoles = false;
      let canRemoveMembers = false;
      let canLeaveOrganizations = false;

      for (const member of members) {
        const { canUpdateMemberRole, canRemoveMember, canLeaveOrganization } =
          getMemberPermissions(member);

        canUpdateMemberRoles ||= canUpdateMemberRole;
        canRemoveMembers ||= canRemoveMember;
        canLeaveOrganizations ||= canLeaveOrganization;

        if (canUpdateMemberRoles && canRemoveMembers && canLeaveOrganizations)
          break;
      }

      return { canUpdateMemberRoles, canRemoveMembers, canLeaveOrganizations };
    }, [getMemberPermissions, members]);

  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
      setTimeout(() => membersApiRef.current?.autosizeColumns(autosizeOptions), 0);
    });
  }, [membersApiRef, router]);

  const handleInviteMember = () => {
    setDialog({
      content: (
        <InviteMemberDialogContent
          fetchFullOrganization={refresh}
          organizationId={id}
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
          <UpdateMemberRoleDialogContent
            fetchFullOrganization={refresh}
            member={member}
            organizationId={id}
          />
        ),
        formId: "update-member-role-form",
        open: true,
        title: tMembers("actions.updateMemberRole.title"),
      });
    },
    [id, refresh, setDialog, tMembers],
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
            { organizationId: id, memberIdOrEmail: memberId },
            {
              onError: ({ error: { code } }) => {
                enqueueSnackbar(getErrorMessage(code, locale), { variant: "error" });
              },
              onSuccess: () => {
                enqueueSnackbar(tMembers("actions.removeMember.success"), { variant: "success" });
                refresh();
              },
            },
          );
        },
        open: true,
        title: tMembers("actions.removeMember.title"),
      });
    },
    [id, locale, refresh, setDialog, tMembers],
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
          { organizationId: id },
          {
            onError: ({ error: { code } }) => {
              enqueueSnackbar(getErrorMessage(code, locale), { variant: "error" });
            },
            onSuccess: async () => {
              enqueueSnackbar(
                tOrganizations("actions.leaveOrganization.success"),
                { variant: "success" },
              );

              const { data } = await authClient.organization.list();
              if (!data?.length) {
                enqueueSnackbar(getErrorMessage("NO_ACTIVE_ORGANIZATION", locale), {
                  variant: "error",
                });
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
  }, [id, locale, router, setDialog, setSession, slug, tOrganizations]);

  const memberColumns = useMemo<GridColDef[]>(
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
                <Tooltip title={tOrganizations("actions.leaveOrganization.title")}>
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
        <Stack direction="row">
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
        apiRef={membersApiRef}
        columns={memberColumns}
        loading={isPending}
        onPaginationModelChange={() =>
          membersApiRef.current?.autosizeColumns(autosizeOptions)
        }
        rows={members}
      />
    </>
  );
};

export default MembersContent;
