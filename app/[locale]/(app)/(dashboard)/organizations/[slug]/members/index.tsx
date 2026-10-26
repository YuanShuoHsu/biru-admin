"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR, { useSWRConfig } from "swr";

import InviteMemberDialog from "./InviteMemberDialog";
import UpdateMemberRoleDialog from "./UpdateMemberRoleDialog";

import DataGrid from "@/components/DataGrid";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";
import { countKeys, ROLE_RANK } from "@/constants/organizations";

import { useOrganizations } from "@/hooks/organizations";
import { useRowSelection } from "@/hooks/useRowSelection";
import { useSession } from "@/hooks/useSession";

import { useRouter } from "@/i18n/navigation";

import { authClient } from "@/lib/auth-client";

import {
  Cancel,
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
  List,
  ListItem,
  ListItemText,
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

import { isActiveSession } from "@/utils/auth";
import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";
import {
  defaultOrganizationSlugKey,
  sortByCreatedAtDesc,
} from "@/utils/organizations";

const ConfirmStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(1),
}));

const ActionsStack = styled(Stack)(({ theme }) => ({
  height: "100%",
  alignItems: "center",
  gap: theme.spacing(0.5),
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

const ToolbarStack = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  alignItems: "center",
  gap: theme.spacing(1),
}));

const ROLE_COLOR_MAP: Record<string, "error" | "warning" | "default"> = {
  owner: "error",
  admin: "warning",
  member: "default",
};

interface OrganizationsSlugMembersProps {
  activeOrganization?: ActiveOrganization;
  canCreateInvitation?: boolean;
  canDeleteMember?: boolean;
  canLeaveOrganizations?: boolean;
  canRemoveMembers?: boolean;
  canUpdateMember?: boolean;
  canUpdateMemberRoles?: boolean;
  currentUserId?: string;
  currentUserRole?: string;
  loading?: boolean;
}

const OrganizationsSlugMembers = ({
  activeOrganization,
  canCreateInvitation = false,
  canDeleteMember = false,
  canLeaveOrganizations = false,
  canRemoveMembers = false,
  canUpdateMember = false,
  canUpdateMemberRoles = false,
  currentUserId = "",
  currentUserRole = "",
  loading = false,
}: OrganizationsSlugMembersProps) => {
  const organizationId = activeOrganization?.id ?? "";
  const initialMembers = activeOrganization?.members ?? [];
  const initialTeams = activeOrganization?.teams ?? [];

  const [isSelectMode, setIsSelectMode] = useState(false);

  const apiRef = useGridApiRef();

  const session = useSession();
  const { setSession } = useAuthStore((state) => state);
  const { setCount } = useCountStore((state) => state);
  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const { slug } = useParams<{ slug: string }>();

  const router = useRouter();

  const { mutate: mutateOrganizations } = useOrganizations();
  const { mutate: mutateCache } = useSWRConfig();

  const tMembers = useTranslations("organizations.members");
  const tOrganizations = useTranslations("organizations");

  const {
    data: { rows, teams } = {
      rows: initialMembers,
      teams: initialTeams,
    },
    mutate,
    isValidating,
  } = useSWR(
    !loading && ["organization-members", slug],
    async () => {
      const { data, error } = await authClient.organization.getFullOrganization(
        {
          query: { organizationSlug: decodeURIComponent(slug) },
        },
      );
      if (error) throw error;

      return {
        rows: sortByCreatedAtDesc(data.members),
        teams: data.teams,
        pendingInvitationCount: data.invitations.filter(
          (invitation: Invitation) =>
            invitation.status === "pending" && isActiveSession(invitation),
        ).length,
      };
    },
    {
      fallbackData: {
        rows: initialMembers,
        teams: initialTeams,
        pendingInvitationCount: 0,
      },
      onError: ({ message }) => {
        enqueueSnackbar(message, {
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

  const isMemberSelectable = useCallback(
    (member: Member) => getMemberPermissions(member).canRemoveMember,
    [getMemberPermissions],
  );

  const {
    clearRowSelection,
    hasSelectableRows,
    rowSelectionProps,
    selectedRows,
  } = useRowSelection({
    enabled: isSelectMode,
    isRowSelectable: isMemberSelectable,
    rows,
  });

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
    ({ id: memberId, user: { email } }: Member) => {
      setDialog({
        content: (
          <DialogContentText>
            {tMembers.rich("actions.removeMember.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              email,
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          await authClient.organization.removeMember(
            { organizationId, memberIdOrEmail: memberId },
            {
              onError: ({ error: { message } }) => {
                enqueueSnackbar(message, {
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
    [mutate, organizationId, setDialog, tMembers],
  );

  const handleEnterMemberBatchRemoveMode = useCallback(() => {
    setIsSelectMode(true);
    setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
  }, [apiRef]);

  const handleSubmitMemberBatchRemove = useCallback(() => {
    const count = selectedRows.length;

    setDialog({
      content: (
        <ConfirmStack>
          <DialogContentText>
            {tMembers.rich("actions.batchRemoveMember.submit.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              count,
            })}
          </DialogContentText>
          <List dense disablePadding>
            {selectedRows.map(({ id, user: { email } }) => (
              <ListItem disableGutters key={id}>
                <ListItemText primary={email} />
              </ListItem>
            ))}
          </List>
        </ConfirmStack>
      ),
      onConfirm: async () => {
        try {
          await fetcher(`/api/organizations/${organizationId}/members`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: selectedRows.map(({ id }) => id) }),
          });

          setIsSelectMode(false);
          clearRowSelection();

          setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);

          enqueueSnackbar(
            tMembers("actions.batchRemoveMember.submit.success", { count }),
            {
              variant: "success",
            },
          );
        } catch (error) {
          enqueueSnackbar(getErrorMessage(error), {
            variant: "error",
          });
        }

        mutate();
      },
      open: true,
      title: tMembers("actions.batchRemoveMember.submit.label", { count }),
    });
  }, [
    apiRef,
    clearRowSelection,
    mutate,
    organizationId,
    selectedRows,
    setDialog,
    tMembers,
  ]);

  const handleCancelMemberBatchRemove = useCallback(() => {
    setIsSelectMode(false);
    clearRowSelection();

    setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
  }, [apiRef, clearRowSelection]);

  const handleLeaveOrganization = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tOrganizations.rich("actions.leaveOrganization.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
            name: activeOrganization?.name ?? slug,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        await authClient.organization.leave(
          { organizationId },
          {
            onError: ({ error: { message } }) => {
              enqueueSnackbar(message, {
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
                  tOrganizations("actions.leaveOrganization.noAccess"),
                  { variant: "error" },
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

              await Promise.all([
                mutateOrganizations(),
                mutateCache(defaultOrganizationSlugKey),
              ]);

              router.replace("/organizations");
            },
          },
        );
      },
      open: true,
      title: tOrganizations("actions.leaveOrganization.title"),
    });
  }, [
    activeOrganization?.name,
    mutateCache,
    mutateOrganizations,
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
      ...((canUpdateMemberRoles || canRemoveMembers || canLeaveOrganizations) &&
      !isSelectMode
        ? [
            {
              disableColumnMenu: true,
              disableExport: true,
              field: "actions",
              filterable: false,
              headerName: tMembers("actions.label"),
              renderCell: ({ row }: GridRenderCellParams<Member>) => {
                const {
                  canUpdateMemberRole,
                  canRemoveMember,
                  canLeaveOrganization,
                } = getMemberPermissions(row);

                return (
                  <ActionsStack direction="row">
                    {canUpdateMemberRoles && (
                      <Tooltip
                        title={tMembers("actions.updateMemberRole.title")}
                      >
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
                        title={tOrganizations(
                          "actions.leaveOrganization.title",
                        )}
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
                  </ActionsStack>
                );
              },
              resizable: false,
              sortable: false,
            },
          ]
        : []),
      {
        field: "avatar",
        headerName: tMembers("avatar"),
        renderCell: ({
          row: {
            user: { image, name },
          },
        }: GridRenderCellParams<Member>) => (
          <AvatarStack direction="row">
            <StyledAvatar alt={name} src={image || undefined}>
              {name[0]}
            </StyledAvatar>
          </AvatarStack>
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
        sortComparator: (a, b) => ROLE_RANK[a] - ROLE_RANK[b],
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
      isSelectMode,
      tMembers,
      tOrganizations,
    ],
  );

  return (
    <>
      {(canCreateInvitation || canRemoveMembers) && (
        <ToolbarStack direction="row">
          {!isSelectMode && (
            <>
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
              {canRemoveMembers && (
                <Button
                  disabled={!hasSelectableRows}
                  onClick={handleEnterMemberBatchRemoveMode}
                  size="small"
                  startIcon={<PersonRemove />}
                  variant="outlined"
                >
                  {tMembers("actions.batchRemoveMember.title")}
                </Button>
              )}
            </>
          )}
          {isSelectMode && (
            <>
              <Button
                onClick={handleCancelMemberBatchRemove}
                size="small"
                startIcon={<Cancel />}
                variant="outlined"
              >
                {tMembers("actions.batchRemoveMember.cancel.label")}
              </Button>
              <Button
                color="error"
                disabled={!selectedRows.length}
                onClick={handleSubmitMemberBatchRemove}
                size="small"
                startIcon={<PersonRemove />}
                variant="contained"
              >
                {tMembers("actions.batchRemoveMember.submit.label", {
                  count: selectedRows.length,
                })}
              </Button>
            </>
          )}
        </ToolbarStack>
      )}
      <DataGrid
        {...DATA_GRID_PROPS}
        {...rowSelectionProps}
        apiRef={apiRef}
        columns={columns}
        loading={loading || isValidating}
        onPaginationModelChange={() =>
          apiRef.current?.autosizeColumns(autosizeOptions)
        }
        rows={rows}
      />
    </>
  );
};

export default OrganizationsSlugMembers;
