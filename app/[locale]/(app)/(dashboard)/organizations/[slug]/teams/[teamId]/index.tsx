"use client";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import AddTeamMemberDialog from "./AddTeamMemberDialog";

import DataGrid from "@/components/DataGrid";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";
import { ROLE_RANK } from "@/constants/organizations";

import { useRowSelection } from "@/hooks/useRowSelection";

import { authClient } from "@/lib/auth-client";

import { Cancel, PersonAdd, PersonRemove } from "@mui/icons-material";
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

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { ActiveOrganization, Team } from "@/types/organizations";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";
import { buildTeamMembers, type TeamMemberRow } from "@/utils/teams";

const ROLE_COLOR_MAP: Record<string, "error" | "warning" | "default"> = {
  owner: "error",
  admin: "warning",
  member: "default",
};

const ConfirmStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(1),
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

interface OrganizationsSlugTeamsTeamIdProps {
  activeOrganization?: ActiveOrganization;
  canUpdateTeam?: boolean;
  currentUserId?: string;
  loading?: boolean;
  team?: Team;
  teamMembers?: TeamMemberRow[];
}

const OrganizationsSlugTeamsTeamId = ({
  activeOrganization,
  canUpdateTeam = false,
  currentUserId = "",
  loading = false,
  team,
  teamMembers: initialTeamMembers = [],
}: OrganizationsSlugTeamsTeamIdProps) => {
  const members = useMemo(
    () => activeOrganization?.members ?? [],
    [activeOrganization],
  );
  const teamId = team?.id ?? "";
  const teamName = team?.name ?? "";
  const teamOrganizationId = team?.organizationId ?? "";

  const [isSelectMode, setIsSelectMode] = useState(false);

  const apiRef = useGridApiRef();

  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const tMembers = useTranslations("organizations.members");
  const tTeams = useTranslations("organizations.teams");

  const {
    data: rows = initialTeamMembers,
    mutate,
    isValidating,
  } = useSWR(
    !loading && `team-members-${teamId}`,
    async () => {
      const { data, error } = await authClient.organization.listTeamMembers({
        query: { teamId },
      });
      if (error?.code === "USER_IS_NOT_A_MEMBER_OF_THE_TEAM") return [];
      if (error) throw error;

      return buildTeamMembers(data, members);
    },
    {
      fallbackData: initialTeamMembers,
      onError: ({ message }) => {
        enqueueSnackbar(message, {
          variant: "error",
        });
      },
      onSuccess: () => {
        setTimeout(() => {
          apiRef.current?.autosizeColumns(autosizeOptions);
        }, 0);
      },
    },
  );

  const {
    clearRowSelection,
    hasSelectableRows,
    rowSelectionProps,
    selectedRows,
  } = useRowSelection({ enabled: isSelectMode, rows });

  const handleAddTeamMember = () => {
    if (!team) return;

    const teamMemberIds = new Set(rows.map(({ userId }) => userId));
    const isCurrentUserTeamMember =
      currentUserId && teamMemberIds.has(currentUserId);
    const availableMembers = members.filter(({ userId }) => {
      if (!isCurrentUserTeamMember) return userId === currentUserId;

      return !teamMemberIds.has(userId);
    });

    setDialog({
      content: (
        <AddTeamMemberDialog
          availableMembers={availableMembers}
          mutate={mutate}
          team={team}
        />
      ),
      formId: "add-team-member-form",
      open: true,
      title: tTeams("actions.addTeamMember.title"),
    });
  };

  const handleRemoveTeamMember = useCallback(
    (userId: string) => {
      const member = members.find(
        ({ userId: memberId }) => memberId === userId,
      );

      setDialog({
        content: (
          <DialogContentText>
            {tMembers.rich("actions.removeTeamMember.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              email: member?.user.email || "",
              team: teamName,
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          await authClient.organization.removeTeamMember(
            { teamId, userId },
            {
              onError: ({ error: { message } }) => {
                enqueueSnackbar(message, {
                  variant: "error",
                });
              },
              onSuccess: () => {
                enqueueSnackbar(
                  tMembers("actions.removeTeamMember.success", {
                    email: member?.user.email || "",
                    team: teamName,
                  }),
                  { variant: "success" },
                );

                mutate();
              },
            },
          );
        },
        open: true,
        title: tMembers("actions.removeTeamMember.title"),
      });
    },
    [members, mutate, setDialog, teamId, teamName, tMembers],
  );

  const handleEnterTeamMemberBatchRemoveMode = useCallback(() => {
    setIsSelectMode(true);
    setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
  }, [apiRef]);

  const handleSubmitTeamMemberBatchRemove = useCallback(() => {
    const count = selectedRows.length;

    setDialog({
      content: (
        <ConfirmStack>
          <DialogContentText>
            {tMembers.rich("actions.batchRemoveTeamMember.submit.confirm", {
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
          await fetcher(
            `/api/organizations/${teamOrganizationId}/teams/${teamId}/members`,
            {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ids: selectedRows.map(({ id }) => id) }),
            },
          );

          setIsSelectMode(false);
          clearRowSelection();

          setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);

          enqueueSnackbar(
            tMembers("actions.batchRemoveTeamMember.submit.success", { count }),
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
      title: tMembers("actions.batchRemoveTeamMember.submit.label", { count }),
    });
  }, [
    apiRef,
    clearRowSelection,
    mutate,
    selectedRows,
    setDialog,
    tMembers,
    teamId,
    teamOrganizationId,
  ]);

  const handleCancelTeamMemberBatchRemove = useCallback(() => {
    setIsSelectMode(false);
    clearRowSelection();

    setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
  }, [apiRef, clearRowSelection]);

  const columns = useMemo<GridColDef[]>(
    () => [
      ...(canUpdateTeam && !isSelectMode
        ? [
            {
              disableColumnMenu: true,
              disableExport: true,
              field: "actions",
              filterable: false,
              headerName: tTeams("actions.label"),
              renderCell: ({ row }: GridRenderCellParams<TeamMemberRow>) => (
                <Tooltip title={tMembers("actions.removeTeamMember.title")}>
                  <IconButton
                    color="error"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleRemoveTeamMember(row.userId);
                    }}
                    size="small"
                  >
                    <PersonRemove fontSize="small" />
                  </IconButton>
                </Tooltip>
              ),
              resizable: false,
              sortable: false,
            },
          ]
        : []),
      {
        field: "avatar",
        headerName: tMembers("avatar"),
        renderCell: ({ row }: GridRenderCellParams<TeamMemberRow>) => (
          <AvatarStack direction="row">
            <StyledAvatar alt={row.user.name} src={row.user.image || undefined}>
              {row.user.name[0]}
            </StyledAvatar>
          </AvatarStack>
        ),
        resizable: false,
        sortable: false,
      },
      {
        field: "name",
        headerName: tMembers("name"),
        valueGetter: (_value, row: TeamMemberRow) => row.user.name,
      },
      {
        field: "email",
        headerName: tMembers("email"),
        valueGetter: (_value, row: TeamMemberRow) => row.user.email,
      },
      {
        field: "role",
        headerName: tMembers("role.label"),
        renderCell: ({ row }: GridRenderCellParams<TeamMemberRow>) => (
          <Chip
            color={ROLE_COLOR_MAP[row.role] || "default"}
            label={tMembers(`role.${row.role as "owner" | "admin" | "member"}`)}
            size="small"
            variant="outlined"
          />
        ),
        sortComparator: (a, b) => ROLE_RANK[a] - ROLE_RANK[b],
      },
      {
        field: "joinedAt",
        headerName: tMembers("joinedAt"),
        valueFormatter: (value: Date | string) =>
          format.dateTime(new Date(value), "short"),
      },
    ],
    [
      canUpdateTeam,
      format,
      handleRemoveTeamMember,
      isSelectMode,
      tMembers,
      tTeams,
    ],
  );

  return (
    <>
      {canUpdateTeam && (
        <ToolbarStack direction="row">
          {!isSelectMode && (
            <>
              <Button
                onClick={handleAddTeamMember}
                size="small"
                startIcon={<PersonAdd />}
                variant="contained"
              >
                {tTeams("actions.addTeamMember.title")}
              </Button>
              <Button
                disabled={!hasSelectableRows}
                onClick={handleEnterTeamMemberBatchRemoveMode}
                size="small"
                startIcon={<PersonRemove />}
                variant="outlined"
              >
                {tMembers("actions.batchRemoveTeamMember.title")}
              </Button>
            </>
          )}
          {isSelectMode && (
            <>
              <Button
                onClick={handleCancelTeamMemberBatchRemove}
                size="small"
                startIcon={<Cancel />}
                variant="outlined"
              >
                {tMembers("actions.batchRemoveTeamMember.cancel.label")}
              </Button>
              <Button
                color="error"
                disabled={!selectedRows.length}
                onClick={handleSubmitTeamMemberBatchRemove}
                size="small"
                startIcon={<PersonRemove />}
                variant="contained"
              >
                {tMembers("actions.batchRemoveTeamMember.submit.label", {
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

export default OrganizationsSlugTeamsTeamId;
