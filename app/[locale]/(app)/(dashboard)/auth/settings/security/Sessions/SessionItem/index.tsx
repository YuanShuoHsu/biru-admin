import { useTranslations } from "next-intl";

import {
  Avatar,
  Chip,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import type { Session } from "@/stores/auth-store";

import { getDisplayName } from "@/utils/auth";

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: 24,
  height: 24,
  backgroundColor: theme.vars.palette.background.paper,
  border: `1px solid ${theme.vars.palette.primary.main}`,
  color: theme.vars.palette.primary.main,
  fontSize: 12,

  [theme.getColorSchemeSelector("dark")]: {
    backgroundColor: theme.vars.palette.common.white,
    borderColor: theme.vars.palette.common.white,
    color: theme.vars.palette.primary.contrastText,
  },
}));

interface SessionItemProps {
  secondaryAction: React.ReactNode;
  showCurrentChip?: boolean;
  user?: Session["user"] | null;
}

const SessionItem = ({
  secondaryAction,
  showCurrentChip,
  user,
}: SessionItemProps) => {
  const displayName = getDisplayName(user);

  const tAuth = useTranslations("auth");

  return (
    <ListItem disablePadding secondaryAction={secondaryAction}>
      <ListItemIcon>
        <StyledAvatar alt={displayName} src={user?.image || undefined}>
          {displayName[0]}
        </StyledAvatar>
      </ListItemIcon>
      <ListItemText
        primary={
          <Stack alignItems="center" direction="row" gap={1}>
            <Typography fontWeight={500} variant="body2">
              {displayName}
            </Typography>
            {showCurrentChip && (
              <Chip
                color="primary"
                label={tAuth("settings.sessions.currentSession")}
                size="small"
                variant="outlined"
              />
            )}
          </Stack>
        }
        secondary={user?.email}
        slotProps={{ secondary: { variant: "caption" } }}
      />
    </ListItem>
  );
};

export default SessionItem;
