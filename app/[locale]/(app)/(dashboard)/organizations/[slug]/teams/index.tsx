"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useTransition } from "react";

import UpdateTeamDialog from "./UpdateTeamDialog";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";

import { useRouter } from "@/i18n/navigation";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { Delete, Edit, FolderShared, People } from "@mui/icons-material";
import {
  Button,
  DialogContentText,
  IconButton,
  Stack,
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

interface OrganizationsSlugTeamsProps {
  id: string;
  members: Member[];
  slug: string;
  teams: Team[];
}

const OrganizationsSlugTeams = ({
  id,
  members,
  slug,
  teams,
}: OrganizationsSlugTeamsProps) => {
  const [isPending, startTransition] = useTransition();

  const teamsApiRef = useGridApiRef();

  const { session } = useAuthStore((state) => state);
  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();
  const locale = useLocale();
  const router = useRouter();

  const tTeams = useTranslations("organizations.teams");

  const currentUserRole = useMemo(
    () => members.find(({ userId }) => userId === session?.user?.id)?.role,
    [members, session?.user?.id],
  );

  const { canCreateTeam, canUpdateTeam, canDeleteTeam } = useMemo(() => {
    if (!currentUserRole)
      return {
        canCreateTeam: false,
        canUpdateTeam: false,
        canDeleteTeam: false,
      };

    return {
      canCreateTeam: authClient.organization.checkRolePermission({
        role: currentUserRole,
        permissions: { team: ["create"] },
      }),
      canUpdateTeam: authClient.organization.checkRolePermission({
        role: currentUserRole,
        permissions: { team: ["update"] },
      }),
      canDeleteTeam: authClient.organization.checkRolePermission({
        role: currentUserRole,
        permissions: { team: ["delete"] },
      }),
    };
  }, [currentUserRole]);

  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
      setTimeout(
        () => teamsApiRef.current?.autosizeColumns(autosizeOptions),
        0,
      );
    });
  }, [router, teamsApiRef]);

  const handleCreateTeam = () => {
    setDialog({
      content: (
        <UpdateTeamDialog fetchFullOrganization={refresh} organizationId={id} />
      ),
      formId: "team-form",
      open: true,
      title: tTeams("actions.createTeam.title"),
    });
  };

  const handleViewTeamMembers = useCallback(
    ({ id: teamId }: Team) => {
      router.push(`/organizations/${slug}/teams/${teamId}`);
    },
    [router, slug],
  );

  const handleUpdateTeam = useCallback(
    (team: Team) => {
      setDialog({
        content: (
          <UpdateTeamDialog
            fetchFullOrganization={refresh}
            organizationId={id}
            team={team}
          />
        ),
        formId: "team-form",
        open: true,
        title: tTeams("actions.updateTeam.title"),
      });
    },
    [id, refresh, setDialog, tTeams],
  );

  const handleRemoveTeam = useCallback(
    ({ id: teamId, name }: Team) => {
      setDialog({
        content: (
          <DialogContentText>
            {tTeams.rich("actions.removeTeam.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              name,
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          await authClient.organization.removeTeam(
            { organizationId: id, teamId },
            {
              onError: ({ error: { code } }) => {
                enqueueSnackbar(getErrorMessage(code, locale), {
                  variant: "error",
                });
              },
              onSuccess: () => {
                enqueueSnackbar(
                  tTeams("actions.removeTeam.success", { name }),
                  {
                    variant: "success",
                  },
                );
                refresh();
              },
            },
          );
        },
        open: true,
        title: tTeams("actions.removeTeam.title"),
      });
    },
    [id, locale, refresh, setDialog, tTeams],
  );

  const teamColumns = useMemo<GridColDef[]>(
    () => [
      {
        disableColumnMenu: true,
        field: "actions",
        headerName: tTeams("actions.label"),
        renderCell: ({ row }: GridRenderCellParams<Team>) => (
          <Stack height="100%" direction="row" alignItems="center" gap={0.5}>
            {canUpdateTeam && (
              <Tooltip title={tTeams("actions.manageTeamMembers.title")}>
                <IconButton
                  onClick={(event) => {
                    event.stopPropagation();
                    handleViewTeamMembers(row);
                  }}
                  size="small"
                >
                  <People fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canUpdateTeam && (
              <Tooltip title={tTeams("actions.updateTeam.title")}>
                <IconButton
                  onClick={(event) => {
                    event.stopPropagation();
                    handleUpdateTeam(row);
                  }}
                  size="small"
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canDeleteTeam && (
              <Tooltip title={tTeams("actions.removeTeam.title")}>
                <IconButton
                  color="error"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleRemoveTeam(row);
                  }}
                  size="small"
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        ),
        resizable: false,
        sortable: false,
      },
      {
        field: "name",
        headerName: tTeams("name.label"),
      },
      {
        field: "createdAt",
        headerName: tTeams("createdAt"),
        valueFormatter: (value: Date | string) =>
          format.dateTime(new Date(value), "short"),
      },
    ],
    [
      canDeleteTeam,
      canUpdateTeam,
      format,
      handleRemoveTeam,
      handleUpdateTeam,
      handleViewTeamMembers,
      tTeams,
    ],
  );

  return (
    <>
      {canCreateTeam && (
        <Stack direction="row">
          <Button
            onClick={handleCreateTeam}
            size="small"
            startIcon={<FolderShared />}
            variant="contained"
          >
            {tTeams("actions.createTeam.title")}
          </Button>
        </Stack>
      )}
      <DataGrid
        {...DATA_GRID_PROPS}
        apiRef={teamsApiRef}
        columns={teamColumns}
        loading={isPending}
        onPaginationModelChange={() =>
          teamsApiRef.current?.autosizeColumns(autosizeOptions)
        }
        rows={teams}
      />
    </>
  );
};

export default OrganizationsSlugTeams;
