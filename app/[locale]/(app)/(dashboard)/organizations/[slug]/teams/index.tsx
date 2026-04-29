"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import { flushSync } from "react-dom";

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

import type { ActiveOrganization, Team } from "@/types/organizations";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface OrganizationsSlugTeamsProps {
  activeOrganization: ActiveOrganization;
}

const OrganizationsSlugTeams = ({
  activeOrganization: {
    id: organizationId,
    members: initialMembers,
    teams: initialTeams,
  },
}: OrganizationsSlugTeamsProps) => {
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState(initialMembers);
  const [teams, setTeams] = useState(initialTeams);

  const apiRef = useGridApiRef();

  const { session } = useAuthStore((state) => state);
  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const locale = useLocale();

  const { slug } = useParams<{ slug: string }>();

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

  const fetchFullOrganization = useCallback(async () => {
    await authClient.organization.getFullOrganization(
      { query: { organizationSlug: decodeURIComponent(slug) } },
      {
        onError: ({ error: { code } }) => {
          setLoading(false);

          enqueueSnackbar(getErrorMessage(code, locale), {
            variant: "error",
          });
        },
        onRequest: () => setLoading(true),
        onSuccess: ({ data: { members, teams } }) => {
          flushSync(() => {
            setMembers(members);
            setTeams(teams.toReversed());

            setLoading(false);
          });

          setTimeout(() => {
            apiRef.current?.autosizeColumns(autosizeOptions);
          }, 0);
        },
      },
    );
  }, [apiRef, locale, slug]);

  const handleCreateTeam = () => {
    setDialog({
      content: (
        <UpdateTeamDialog
          fetchFullOrganization={fetchFullOrganization}
          organizationId={organizationId}
        />
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
            fetchFullOrganization={fetchFullOrganization}
            organizationId={organizationId}
            team={team}
          />
        ),
        formId: "team-form",
        open: true,
        title: tTeams("actions.updateTeam.title"),
      });
    },
    [fetchFullOrganization, organizationId, setDialog, tTeams],
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
            { organizationId, teamId },
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
                fetchFullOrganization();
              },
            },
          );
        },
        open: true,
        title: tTeams("actions.removeTeam.title"),
      });
    },
    [fetchFullOrganization, locale, organizationId, setDialog, tTeams],
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
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1}>
        {canCreateTeam && (
          <Button
            onClick={handleCreateTeam}
            size="small"
            startIcon={<FolderShared />}
            variant="contained"
          >
            {tTeams("actions.createTeam.title")}
          </Button>
        )}
      </Stack>
      <DataGrid
        {...DATA_GRID_PROPS}
        apiRef={apiRef}
        columns={teamColumns}
        loading={loading}
        onPaginationModelChange={() =>
          apiRef.current?.autosizeColumns(autosizeOptions)
        }
        rows={teams}
      />
    </>
  );
};

export default OrganizationsSlugTeams;
