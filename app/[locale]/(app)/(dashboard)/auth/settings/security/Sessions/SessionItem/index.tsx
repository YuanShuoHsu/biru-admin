import { useFormatter, useNow, useTranslations } from "next-intl";

import { Computer } from "@mui/icons-material";
import {
  Avatar,
  Chip,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import type { Session } from "@/stores/auth-store";

import { formatUserAgent } from "@/utils/auth";

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  backgroundColor: theme.vars.palette.action.hover,
  color: theme.vars.palette.text.secondary,
}));

const StyledListItem = styled(ListItem)({
  "& .MuiListItemSecondaryAction-root": { right: 0 },
});

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
      <ListItemText
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
        slotProps={{ secondary: { component: "div" } }}
      />
    </StyledListItem>
  );
};

export default SessionItem;
