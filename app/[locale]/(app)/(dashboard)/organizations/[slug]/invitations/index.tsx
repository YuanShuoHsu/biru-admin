"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import { flushSync } from "react-dom";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";
import { countKeys } from "@/constants/organizations";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { Delete } from "@mui/icons-material";
import { Chip, DialogContentText, IconButton, Tooltip } from "@mui/material";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { useCountStore } from "@/providers/count-store-provider";
import { useDialogStore } from "@/providers/dialog-store-provider";

import type { ActiveOrganization, Invitation } from "@/types/organizations";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

const ROLE_COLOR_MAP: Record<string, "error" | "warning" | "default"> = {
  owner: "error",
  admin: "warning",
  member: "default",
};

interface OrganizationsSlugInvitationsProps {
  activeOrganization: ActiveOrganization;
  canCancelInvitation: boolean;
}

const OrganizationsSlugInvitations = ({
  activeOrganization: { invitations: initialInvitations, teams: initialTeams },
  canCancelInvitation,
}: OrganizationsSlugInvitationsProps) => {
  const [loading, setLoading] = useState(false);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [teams, setTeams] = useState(initialTeams);

  const apiRef = useGridApiRef();

  const { setDialog } = useDialogStore((state) => state);
  const { setCount } = useCountStore((state) => state);

  const format = useFormatter();

  const locale = useLocale();

  const { slug } = useParams<{ slug: string }>();

  const tInvitations = useTranslations("organizations.invitations");
  const tMembers = useTranslations("organizations.members");
  const tTeams = useTranslations("organizations.teams");

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
        onSuccess: ({ data: { invitations, teams } }) => {
          const pendingInvitations = invitations
            .toReversed()
            .filter(({ status }: Invitation) => status === "pending");

          flushSync(() => {
            setInvitations(pendingInvitations);
            setTeams(teams);

            setLoading(false);
          });

          setCount(countKeys.pendingInvitations, pendingInvitations.length);

          setTimeout(() => {
            apiRef.current?.autosizeColumns(autosizeOptions);
          }, 0);
        },
      },
    );
  }, [apiRef, locale, setCount, slug]);

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
                enqueueSnackbar(getErrorMessage(code, locale), {
                  variant: "error",
                });
              },
              onSuccess: () => {
                enqueueSnackbar(
                  tInvitations("actions.cancelInvitation.success", { email }),
                  { variant: "success" },
                );

                fetchFullOrganization();
              },
            },
          );
        },
        open: true,
        title: tInvitations("actions.cancelInvitation.title"),
      });
    },
    [fetchFullOrganization, locale, setDialog, tInvitations],
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
        field: "teamId",
        headerName: tTeams("label"),
        valueGetter: (teamId?: string | null) => {
          if (!teamId) return "";

          return (
            teams.find(({ id }) => id === teamId)?.name || tTeams("unknown")
          );
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
      teams,
      tInvitations,
      tMembers,
      tTeams,
    ],
  );

  return (
    <DataGrid
      {...DATA_GRID_PROPS}
      apiRef={apiRef}
      columns={invitationColumns}
      loading={loading}
      onPaginationModelChange={() =>
        apiRef.current?.autosizeColumns(autosizeOptions)
      }
      rows={invitations}
    />
  );
};

export default OrganizationsSlugInvitations;
