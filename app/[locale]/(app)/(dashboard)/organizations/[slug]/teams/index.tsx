"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import UpdateTeamDialog from "./UpdateTeamDialog";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";

import { useRowSelection } from "@/hooks/useRowSelection";

import { useRouter } from "@/i18n/navigation";

import { authClient } from "@/lib/auth-client";

import {
  Cancel,
  Delete,
  Edit,
  FolderShared,
  People,
} from "@mui/icons-material";
import {
  Button,
  DialogContentText,
  IconButton,
  Stack,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { ActiveOrganization, Team } from "@/types/organizations";

import { sortByCreatedAtDesc } from "@/utils/organizations";
import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

const ActionsStack = styled(Stack)(({ theme }) => ({
  height: "100%",
  alignItems: "center",
  gap: theme.spacing(0.5),
}));

const ToolbarStack = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  alignItems: "center",
  gap: theme.spacing(1),
}));

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface OrganizationsSlugTeamsProps {
  activeOrganization: ActiveOrganization;
  canCreateTeam: boolean;
  canDeleteTeam: boolean;
  canUpdateTeam: boolean;
}

const OrganizationsSlugTeams = ({
  activeOrganization: { id: organizationId, teams: initialTeams },
  canCreateTeam,
  canDeleteTeam,
  canUpdateTeam,
}: OrganizationsSlugTeamsProps) => {
  const [isSelectMode, setIsSelectMode] = useState(false);

  const apiRef = useGridApiRef();

  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const { slug } = useParams<{ slug: string }>();

  const router = useRouter();

  const tTeams = useTranslations("organizations.teams");

  const {
    data: { rows } = { rows: initialTeams },
    mutate,
    isValidating: loading,
  } = useSWR(
    ["organization-teams", slug],
    async () => {
      const { data, error } = await authClient.organization.getFullOrganization(
        {
          query: { organizationSlug: decodeURIComponent(slug) },
        },
      );
      if (error) throw error;

      return { rows: sortByCreatedAtDesc(data.teams) };
    },
    {
      fallbackData: { rows: initialTeams },
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

  const handleCreateTeam = () => {
    setDialog({
      content: (
        <UpdateTeamDialog mutate={mutate} organizationId={organizationId} />
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
            mutate={mutate}
            organizationId={organizationId}
            team={team}
          />
        ),
        formId: "team-form",
        open: true,
        title: tTeams("actions.updateTeam.title"),
      });
    },
    [mutate, organizationId, setDialog, tTeams],
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
              onError: ({ error: { message } }) => {
                enqueueSnackbar(message, {
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
                mutate();
              },
            },
          );
        },
        open: true,
        title: tTeams("actions.removeTeam.title"),
      });
    },
    [mutate, organizationId, setDialog, tTeams],
  );

  const handleEnterTeamBatchRemoveMode = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tTeams.rich("actions.batchRemoveTeam.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        setIsSelectMode(true);
        setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
      },
      open: true,
      title: tTeams("actions.batchRemoveTeam.title"),
    });
  }, [apiRef, setDialog, tTeams]);

  const handleSubmitTeamBatchRemove = useCallback(() => {
    const count = selectedRows.length;

    setDialog({
      content: (
        <DialogContentText>
          {tTeams.rich("actions.batchRemoveTeam.submit.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
            count,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        try {
          await fetcher(`/api/organizations/${organizationId}/teams`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: selectedRows.map(({ id }) => id) }),
          });

          setIsSelectMode(false);
          clearRowSelection();

          setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);

          enqueueSnackbar(
            tTeams("actions.batchRemoveTeam.submit.success", { count }),
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
      title: tTeams("actions.batchRemoveTeam.submit.label", { count }),
    });
  }, [
    apiRef,
    clearRowSelection,
    mutate,
    organizationId,
    selectedRows,
    setDialog,
    tTeams,
  ]);

  const handleCancelTeamBatchRemove = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tTeams.rich("actions.batchRemoveTeam.cancel.confirm", {
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
      title: tTeams("actions.batchRemoveTeam.cancel.label"),
    });
  }, [apiRef, clearRowSelection, setDialog, tTeams]);

  const columns = useMemo<GridColDef[]>(
    () => [
      ...(!isSelectMode
        ? [
            {
              disableColumnMenu: true,
              disableExport: true,
              field: "actions",
              filterable: false,
              headerName: tTeams("actions.label"),
              renderCell: ({ row }: GridRenderCellParams<Team>) => (
                <ActionsStack direction="row">
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
                </ActionsStack>
              ),
              resizable: false,
              sortable: false,
            },
          ]
        : []),
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
      isSelectMode,
      tTeams,
    ],
  );

  return (
    <>
      {(canCreateTeam || canDeleteTeam) && (
        <ToolbarStack direction="row">
          {!isSelectMode && (
            <>
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
              {canDeleteTeam && (
                <Button
                  disabled={!hasSelectableRows}
                  onClick={handleEnterTeamBatchRemoveMode}
                  size="small"
                  startIcon={<Delete />}
                  variant="outlined"
                >
                  {tTeams("actions.batchRemoveTeam.title")}
                </Button>
              )}
            </>
          )}
          {isSelectMode && (
            <>
              <Button
                onClick={handleCancelTeamBatchRemove}
                size="small"
                startIcon={<Cancel />}
                variant="outlined"
              >
                {tTeams("actions.batchRemoveTeam.cancel.label")}
              </Button>
              <Button
                color="error"
                disabled={!selectedRows.length}
                onClick={handleSubmitTeamBatchRemove}
                size="small"
                startIcon={<Delete />}
                variant="contained"
              >
                {tTeams("actions.batchRemoveTeam.submit.label", {
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

export default OrganizationsSlugTeams;
