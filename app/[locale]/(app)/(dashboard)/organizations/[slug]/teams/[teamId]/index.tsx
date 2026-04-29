"use client";

import { useLocale, useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import { flushSync } from "react-dom";

import AddTeamMemberDialogContent from "./AddTeamMemberDialogContent";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";
import { Link } from "@/i18n/navigation";
import { authClient, getErrorMessage } from "@/lib/auth-client";

import { ArrowBack, PersonAdd, PersonRemove } from "@mui/icons-material";
import {
  Avatar,
  Button,
  Chip,
  DialogContentText,
  IconButton,
  Stack,
  styled,
  Tooltip,
  Typography,
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

type TeamMemberRecord = {
  id: string;
  teamId: string;
  userId: string;
  createdAt: Date;
};

type TeamMemberRow = {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  createdAt: Date;
};

const ROLE_COLOR_MAP: Record<string, "error" | "warning" | "default"> = {
  owner: "error",
  admin: "warning",
  member: "default",
};

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

interface OrganizationsSlugTeamsTeamIdProps {
  members: Member[];
  orgSlug: string;
  team: Team;
  teamMembers: TeamMemberRecord[];
}

const OrganizationsSlugTeamsTeamId = ({
  members,
  orgSlug,
  team,
  teamMembers: initialTeamMembers,
}: OrganizationsSlugTeamsTeamIdProps) => {
  const [teamMembers, setTeamMembers] = useState(initialTeamMembers);

  const apiRef = useGridApiRef();

  const locale = useLocale();
  const { session } = useAuthStore((state) => state);
  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();
  const tMembers = useTranslations("organizations.members");
  const tTeams = useTranslations("organizations.teams");

  const currentUserId = session?.user?.id;
  const currentUserRole = useMemo(
    () => members.find(({ userId }) => userId === currentUserId)?.role,
    [currentUserId, members],
  );

  const canUpdateTeam = useMemo(() => {
    if (!currentUserRole) return false;
    return authClient.organization.checkRolePermission({
      role: currentUserRole,
      permissions: { team: ["update"] },
    });
  }, [currentUserRole]);

  const fetchTeamMembers = useCallback(async () => {
    const { data } = await authClient.organization.listTeamMembers({
      query: { teamId: team.id },
    });
    if (!data) return;
    flushSync(() => setTeamMembers(data));
    setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
  }, [apiRef, team.id]);

  const rows = useMemo<TeamMemberRow[]>(
    () =>
      teamMembers.map(({ id, userId, createdAt }) => {
        const member = members.find((m) => m.userId === userId);
        return {
          id,
          userId,
          name: member?.user.name ?? userId,
          email: member?.user.email ?? "",
          avatar: member?.user.image ?? null,
          role: member?.role ?? "",
          createdAt,
        };
      }),
    [members, teamMembers],
  );

  const handleAddTeamMember = () => {
    setDialog({
      content: (
        <AddTeamMemberDialogContent
          fetchFullOrganization={fetchTeamMembers}
          members={members}
          teamId={team.id}
        />
      ),
      formId: "add-team-member-form",
      open: true,
      title: tTeams("actions.addTeamMember.title"),
    });
  };

  const handleRemoveTeamMember = useCallback(
    (userId: string) => {
      const member = members.find((m) => m.userId === userId);
      setDialog({
        content: (
          <DialogContentText>
            {tMembers.rich("actions.removeTeamMember.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              name: member?.user.name ?? userId,
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
                    email: member?.user.email ?? userId,
                  }),
                  { variant: "success" },
                );
                fetchTeamMembers();
              },
            },
          );
        },
        open: true,
        title: tMembers("actions.removeTeamMember.title"),
      });
    },
    [fetchTeamMembers, locale, members, setDialog, team.id, tMembers],
  );

  const columns = useMemo<GridColDef[]>(() => {
    const cols: GridColDef[] = [];

    if (canUpdateTeam) {
      cols.push({
        disableColumnMenu: true,
        field: "actions",
        headerName: tTeams("actions.label"),
        renderCell: ({ row }: GridRenderCellParams<TeamMemberRow>) => (
          <Stack height="100%" direction="row" alignItems="center">
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
          </Stack>
        ),
        resizable: false,
        sortable: false,
      });
    }

    cols.push(
      {
        field: "avatar",
        headerName: tMembers("avatar"),
        renderCell: ({ row }: GridRenderCellParams<TeamMemberRow>) => (
          <Stack height="100%" direction="row" alignItems="center">
            <StyledAvatar alt={row.name} src={row.avatar || undefined}>
              {row.name[0]}
            </StyledAvatar>
          </Stack>
        ),
        resizable: false,
        sortable: false,
      },
      {
        field: "name",
        headerName: tMembers("name"),
      },
      {
        field: "email",
        headerName: tMembers("email"),
      },
      {
        field: "role",
        headerName: tMembers("role.label"),
        renderCell: ({ row }: GridRenderCellParams<TeamMemberRow>) => (
          <Chip
            color={ROLE_COLOR_MAP[row.role] ?? "default"}
            label={tMembers(`role.${row.role as "owner" | "admin" | "member"}`)}
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
    );

    return cols;
  }, [canUpdateTeam, format, handleRemoveTeamMember, tMembers, tTeams]);

  return (
    <>
      <Stack direction="row" alignItems="center" gap={1}>
        <Tooltip title={tTeams("label")}>
          <IconButton
            component={Link}
            href={`/organizations/${orgSlug}`}
            size="small"
          >
            <ArrowBack fontSize="small" />
          </IconButton>
        </Tooltip>
        <Typography variant="h6">{team.name}</Typography>
      </Stack>
      {canUpdateTeam && (
        <Button
          onClick={handleAddTeamMember}
          size="small"
          startIcon={<PersonAdd />}
          variant="contained"
        >
          {tTeams("actions.addTeamMember.title")}
        </Button>
      )}
      <DataGrid
        {...DATA_GRID_PROPS}
        apiRef={apiRef}
        columns={columns}
        rows={rows}
      />
    </>
  );
};

export default OrganizationsSlugTeamsTeamId;
