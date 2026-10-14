"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import AddTeamMemberDialog from "./AddTeamMemberDialog";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";
import { ROLE_RANK } from "@/constants/organizations";

import { useRowSelection } from "@/hooks/useRowSelection";

import {
  authClient,
  getErrorMessage,
  getAuthErrorMessage,
} from "@/lib/auth-client";

import { Cancel, PersonAdd, PersonRemove } from "@mui/icons-material";
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

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { ActiveOrganization, Team } from "@/types/organizations";

import { buildTeamMembers, type TeamMemberRow } from "@/utils/teams";
import { fetcher } from "@/utils/fetcher";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

const ROLE_COLOR_MAP: Record<string, "error" | "warning" | "default"> = {
  owner: "error",
  admin: "warning",
  member: "default",
};

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
  activeOrganization: ActiveOrganization;
  canUpdateTeam: boolean;
  currentUserId: string;
  team: Team;
  teamMembers: TeamMemberRow[];
}

const OrganizationsSlugTeamsTeamId = ({
  activeOrganization: { members },
  canUpdateTeam,
  currentUserId,
  team,
  teamMembers: initialTeamMembers,
}: OrganizationsSlugTeamsTeamIdProps) => {
  const [isSelectMode, setIsSelectMode] = useState(false);

  const apiRef = useGridApiRef();

  const { setDialog } = useDialogStore((state) => state);

  const locale = useLocale();

  const format = useFormatter();

  const tMembers = useTranslations("organizations.members");
  const tTeams = useTranslations("organizations.teams");

  const {
    data: rows = initialTeamMembers,
    mutate,
    isValidating: loading,
  } = useSWR(
    `team-members-${team.id}`,
    async () => {
      const { data, error } = await authClient.organization.listTeamMembers({
        query: { teamId: team.id },
      });
      if (error?.code === "USER_IS_NOT_A_MEMBER_OF_THE_TEAM") return [];
      if (error) throw error;

      return buildTeamMembers(data, members);
    },
    {
      fallbackData: initialTeamMembers,
      onError: (error) => {
        enqueueSnackbar(getErrorMessage(error.code, locale), {
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
              team: team.name,
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          await authClient.organization.removeTeamMember(
            { teamId: team.id, userId },
            {
              onError: ({ error: { code } }) => {
                enqueueSnackbar(getErrorMessage(code, locale), {
                  variant: "error",
                });
              },
              onSuccess: () => {
                enqueueSnackbar(
                  tMembers("actions.removeTeamMember.success", {
                    email: member?.user.email || "",
                    team: team.name,
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
    [locale, members, mutate, setDialog, team.id, team.name, tMembers],
  );

  const handleEnterTeamMemberBatchRemoveMode = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tMembers.rich("actions.batchRemoveTeamMember.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        setIsSelectMode(true);
        setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
      },
      open: true,
      title: tMembers("actions.batchRemoveTeamMember.title"),
    });
  }, [apiRef, setDialog, tMembers]);

  const handleSubmitTeamMemberBatchRemove = useCallback(() => {
    const count = selectedRows.length;

    setDialog({
      content: (
        <DialogContentText>
          {tMembers.rich("actions.batchRemoveTeamMember.submit.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
            count,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        try {
          await fetcher(
            `/api/organizations/${team.organizationId}/teams/${team.id}/members`,
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
          enqueueSnackbar(getAuthErrorMessage(error, locale), {
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
    locale,
    mutate,
    selectedRows,
    setDialog,
    team.id,
    team.organizationId,
    tMembers,
  ]);

  const handleCancelTeamMemberBatchRemove = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tMembers.rich("actions.batchRemoveTeamMember.cancel.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        setIsSelectMode(false);
        clearRowSelection();

        setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
      },
      open: true,
      title: tMembers("actions.batchRemoveTeamMember.cancel.label"),
    });
  }, [apiRef, clearRowSelection, setDialog, tMembers]);

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
        loading={loading}
        onPaginationModelChange={() =>
          apiRef.current?.autosizeColumns(autosizeOptions)
        }
        rows={rows}
      />
    </>
  );
};

export default OrganizationsSlugTeamsTeamId;
