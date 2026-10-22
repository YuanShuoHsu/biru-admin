"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import DataGrid from "@/components/DataGrid";
import EmptyCell from "@/components/EmptyCell";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";
import { countKeys, ROLE_RANK } from "@/constants/organizations";

import { useRowSelection } from "@/hooks/useRowSelection";

import { authClient } from "@/lib/auth-client";

import { Cancel, Delete } from "@mui/icons-material";
import {
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

import { useCountStore } from "@/providers/count-store-provider";
import { useDialogStore } from "@/providers/dialog-store-provider";

import type { ActiveOrganization, Invitation } from "@/types/organizations";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";
import { sortByCreatedAtDesc } from "@/utils/organizations";

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

interface OrganizationsSlugInvitationsProps {
  activeOrganization?: ActiveOrganization;
  canCancelInvitation?: boolean;
  loading?: boolean;
}

const OrganizationsSlugInvitations = ({
  activeOrganization,
  canCancelInvitation = false,
  loading = false,
}: OrganizationsSlugInvitationsProps) => {
  const organizationId = activeOrganization?.id ?? "";
  const initialInvitations = activeOrganization?.invitations ?? [];
  const initialTeams = activeOrganization?.teams ?? [];

  const [isSelectMode, setIsSelectMode] = useState(false);

  const apiRef = useGridApiRef();

  const { setDialog } = useDialogStore((state) => state);
  const { setCount } = useCountStore((state) => state);

  const format = useFormatter();

  const { slug } = useParams<{ slug: string }>();

  const tCommon = useTranslations("common");
  const tInvitations = useTranslations("organizations.invitations");
  const tMembers = useTranslations("organizations.members");
  const tTeams = useTranslations("organizations.teams");

  const {
    data: { rows, teams } = {
      rows: initialInvitations,
      teams: initialTeams,
    },
    mutate,
    isValidating,
  } = useSWR(
    !loading && ["organization-invitations", slug],
    async () => {
      const { data, error } = await authClient.organization.getFullOrganization(
        {
          query: { organizationSlug: decodeURIComponent(slug) },
        },
      );
      if (error) throw error;

      const pendingInvitations = sortByCreatedAtDesc(
        data.invitations.filter(
          ({ status }: Invitation) => status === "pending",
        ),
      );

      return {
        rows: pendingInvitations,
        teams: data.teams,
        pendingInvitationCount: pendingInvitations.length,
      };
    },
    {
      fallbackData: {
        rows: initialInvitations,
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

  const {
    clearRowSelection,
    hasSelectableRows,
    rowSelectionProps,
    selectedRows,
  } = useRowSelection({ enabled: isSelectMode, rows });

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
              onError: ({ error: { message } }) => {
                enqueueSnackbar(message, {
                  variant: "error",
                });
              },
              onSuccess: () => {
                enqueueSnackbar(
                  tInvitations("actions.cancelInvitation.success", { email }),
                  { variant: "success" },
                );

                mutate();
              },
            },
          );
        },
        open: true,
        title: tInvitations("actions.cancelInvitation.title"),
      });
    },
    [mutate, setDialog, tInvitations],
  );

  const handleEnterInvitationBatchCancelMode = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tInvitations.rich("actions.batchCancelInvitation.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        setIsSelectMode(true);
        setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
      },
      open: true,
      title: tInvitations("actions.batchCancelInvitation.title"),
    });
  }, [apiRef, setDialog, tInvitations]);

  const handleSubmitInvitationBatchCancel = useCallback(() => {
    const count = selectedRows.length;

    setDialog({
      content: (
        <DialogContentText>
          {tInvitations.rich("actions.batchCancelInvitation.submit.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
            count,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        try {
          await fetcher(`/api/organizations/${organizationId}/invitations`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: selectedRows.map(({ id }) => id) }),
          });

          setIsSelectMode(false);
          clearRowSelection();

          setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);

          enqueueSnackbar(
            tInvitations("actions.batchCancelInvitation.submit.success", {
              count,
            }),
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
      title: tInvitations("actions.batchCancelInvitation.submit.label", {
        count,
      }),
    });
  }, [
    apiRef,
    clearRowSelection,
    mutate,
    organizationId,
    selectedRows,
    setDialog,
    tInvitations,
  ]);

  const handleCancelInvitationBatchCancel = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tInvitations.rich("actions.batchCancelInvitation.cancel.confirm", {
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
      title: tInvitations("actions.batchCancelInvitation.cancel.label"),
    });
  }, [apiRef, clearRowSelection, setDialog, tInvitations]);

  const columns = useMemo<GridColDef[]>(
    () => [
      ...(canCancelInvitation && !isSelectMode
        ? [
            {
              disableColumnMenu: true,
              disableExport: true,
              field: "actions",
              filterable: false,
              headerName: tInvitations("actions.label"),
              renderCell: ({ row }: GridRenderCellParams<Invitation>) => (
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
              ),
              resizable: false,
              sortable: false,
            },
          ]
        : []),
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
        sortComparator: (a, b) => ROLE_RANK[a] - ROLE_RANK[b],
      },
      {
        field: "teamId",
        headerName: `${tTeams("label")} ${tCommon("optional")}`,
        renderCell: ({ row: { teamId } }: GridRenderCellParams<Invitation>) =>
          teamId ? (
            <Chip
              label={teams.find(({ id }) => id === teamId)?.name}
              size="small"
              variant="outlined"
            />
          ) : (
            <EmptyCell />
          ),
        valueGetter: (teamId?: string | null) => {
          if (!teamId) return "";

          return teams.find(({ id }) => id === teamId)?.name;
        },
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
      isSelectMode,
      tCommon,
      teams,
      tInvitations,
      tMembers,
      tTeams,
    ],
  );

  return (
    <>
      {canCancelInvitation && (
        <ToolbarStack direction="row">
          {!isSelectMode && (
            <Button
              disabled={!hasSelectableRows}
              onClick={handleEnterInvitationBatchCancelMode}
              size="small"
              startIcon={<Delete />}
              variant="outlined"
            >
              {tInvitations("actions.batchCancelInvitation.title")}
            </Button>
          )}
          {isSelectMode && (
            <>
              <Button
                onClick={handleCancelInvitationBatchCancel}
                size="small"
                startIcon={<Cancel />}
                variant="outlined"
              >
                {tInvitations("actions.batchCancelInvitation.cancel.label")}
              </Button>
              <Button
                color="error"
                disabled={!selectedRows.length}
                onClick={handleSubmitInvitationBatchCancel}
                size="small"
                startIcon={<Delete />}
                variant="contained"
              >
                {tInvitations("actions.batchCancelInvitation.submit.label", {
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

export default OrganizationsSlugInvitations;
