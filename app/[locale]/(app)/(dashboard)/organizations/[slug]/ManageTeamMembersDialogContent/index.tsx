"use client";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useEffect, useState } from "react";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { PersonRemove } from "@mui/icons-material";
import {
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import type { Member } from "@/types/organizations";

interface ManageTeamMembersDialogContentProps {
  fetchFullOrganization: () => void;
  members: Member[];
  teamId: string;
}

type TeamMemberRecord = {
  id: string;
  teamId: string;
  userId: string;
  createdAt: Date;
};

const ManageTeamMembersDialogContent = ({
  fetchFullOrganization,
  members,
  teamId,
}: ManageTeamMembersDialogContentProps) => {
  const [teamMembers, setTeamMembers] = useState<TeamMemberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const locale = useLocale();
  const tMembers = useTranslations("organizations.members");
  const tTeams = useTranslations("organizations.teams");

  useEffect(() => {
    authClient.organization
      .listTeamMembers({ query: { teamId } })
      .then(({ data, error }) => {
        if (error) {
          setError(error.message ?? "");
        } else {
          setTeamMembers(data ?? []);
        }
        setLoading(false);
      });
  }, [teamId]);

  const handleRemove = async (userId: string) => {
    await authClient.organization.removeTeamMember(
      { teamId, userId },
      {
        onError: ({ error: { code } }) => {
          enqueueSnackbar(getErrorMessage(code, locale), { variant: "error" });
        },
        onSuccess: () => {
          const member = members.find((m) => m.userId === userId);
          enqueueSnackbar(
            tMembers("actions.removeTeamMember.success", {
              email: member?.user.email ?? userId,
            }),
            { variant: "success" },
          );
          setTeamMembers((prev) => prev.filter((m) => m.userId !== userId));
          fetchFullOrganization();
        },
      },
    );
  };

  if (loading) {
    return (
      <Stack alignItems="center" py={2}>
        <CircularProgress size={24} />
      </Stack>
    );
  }

  if (error) {
    return (
      <Typography color="error" variant="body2">
        {error}
      </Typography>
    );
  }

  if (teamMembers.length === 0) {
    return (
      <Typography color="text.secondary" variant="body2">
        {tTeams("members.empty")}
      </Typography>
    );
  }

  return (
    <List dense disablePadding>
      {teamMembers.map(({ userId }) => {
        const member = members.find((m) => m.userId === userId);
        return (
          <ListItem
            key={userId}
            disablePadding
            secondaryAction={
              <Tooltip title={tMembers("actions.removeTeamMember.title")}>
                <IconButton
                  color="error"
                  edge="end"
                  onClick={() => handleRemove(userId)}
                  size="small"
                >
                  <PersonRemove fontSize="small" />
                </IconButton>
              </Tooltip>
            }
          >
            <ListItemText
              primary={member?.user.name ?? userId}
              secondary={member?.user.email}
            />
          </ListItem>
        );
      })}
    </List>
  );
};

export default ManageTeamMembersDialogContent;
