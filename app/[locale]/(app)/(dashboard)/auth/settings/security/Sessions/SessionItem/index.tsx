import { useFormatter, useNow, useTranslations } from "next-intl";

import { StyledListItem, StyledListItemText } from "@/components/FormCard";

import { Computer } from "@mui/icons-material";
import { Avatar, Chip, ListItemIcon } from "@mui/material";
import { styled } from "@mui/material/styles";

import type { Session } from "@/stores/auth-store";

import { formatUserAgent } from "@/utils/auth";

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  backgroundColor: theme.vars.palette.action.hover,
  color: theme.vars.palette.text.secondary,
}));

interface SessionItemProps {
  isCurrent?: boolean;
  secondaryAction: React.ReactNode;
  session: Session["session"];
}

const SessionItem = ({
  isCurrent,
  secondaryAction,
  session: { createdAt, userAgent },
}: SessionItemProps) => {
  const format = useFormatter();

  const now = useNow();

  const tAuth = useTranslations("auth");

  return (
    <StyledListItem disablePadding secondaryAction={secondaryAction}>
      <ListItemIcon>
        <StyledAvatar variant="rounded">
          <Computer fontSize="small" />
        </StyledAvatar>
      </ListItemIcon>
      <StyledListItemText
        primary={formatUserAgent(userAgent)}
        secondary={
          isCurrent ? (
            <Chip
              color="primary"
              label={tAuth("settings.sessions.currentSession")}
              size="small"
              variant="outlined"
            />
          ) : (
            format.relativeTime(new Date(createdAt), now)
          )
        }
        slotProps={{ secondary: { component: "div", variant: "caption" } }}
      />
    </StyledListItem>
  );
};

export default SessionItem;
