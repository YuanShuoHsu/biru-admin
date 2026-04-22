import { Avatar, ListItem, ListItemIcon, ListItemText } from "@mui/material";
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
  user?: Session["user"] | null;
}

const SessionItem = ({ secondaryAction, user }: SessionItemProps) => {
  const displayName = getDisplayName(user);

  return (
    <ListItem disablePadding secondaryAction={secondaryAction}>
      <ListItemIcon>
        <StyledAvatar alt={displayName} src={user?.image || undefined}>
          {displayName[0]}
        </StyledAvatar>
      </ListItemIcon>
      <ListItemText
        primary={displayName}
        secondary={user?.email}
        slotProps={{ secondary: { variant: "caption" } }}
      />
    </ListItem>
  );
};

export default SessionItem;
