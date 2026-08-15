"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo } from "react";
import useSWR from "swr";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";
import { countKeys, ROLE_RANK } from "@/constants/organizations";

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
  const apiRef = useGridApiRef();

  const { setDialog } = useDialogStore((state) => state);
  const { setCount } = useCountStore((state) => state);

  const format = useFormatter();

  const locale = useLocale();

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
    isValidating: loading,
  } = useSWR(
    `organization-invitations-${slug}`,
    async () => {
      const { data, error } = await authClient.organization.getFullOrganization(
        {
          query: { organizationSlug: decodeURIComponent(slug) },
        },
      );
      if (error) throw error;

      const pendingInvitations = data.invitations
        .toReversed()
        .filter(({ status }: Invitation) => status === "pending");

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

                mutate();
              },
            },
          );
        },
        open: true,
        title: tInvitations("actions.cancelInvitation.title"),
      });
    },
    [locale, mutate, setDialog, tInvitations],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      ...(canCancelInvitation
        ? [
            {
              disableColumnMenu: true,
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
          teamId && (
            <Chip
              label={teams.find(({ id }) => id === teamId)?.name}
              size="small"
              variant="outlined"
            />
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
      teams,
      tCommon,
      tInvitations,
      tMembers,
      tTeams,
    ],
  );

  return (
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
  );
};

export default OrganizationsSlugInvitations;
