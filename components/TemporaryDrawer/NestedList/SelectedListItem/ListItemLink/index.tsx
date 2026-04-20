// https://mui.com/material-ui/react-breadcrumbs/#RouterBreadcrumbs.tsx

import { Link } from "@/i18n/navigation";

import { ExpandMore } from "@mui/icons-material";
import {
  ListItem,
  ListItemButton,
  type ListItemButtonProps,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { styled } from "@mui/material/styles";

interface StyledListItemButtonProps extends ListItemButtonProps {
  level?: number;
}

export const StyledListItemButton = styled(ListItemButton, {
  shouldForwardProp: (prop) => prop !== "level",
})<StyledListItemButtonProps>(({ level = 0, theme }) => ({
  paddingLeft: theme.spacing(2 + level * 2),
  gap: theme.spacing(4),

  "&.Mui-selected": {
    backgroundColor: `rgba(${theme.vars.palette.primary.mainChannel} / calc(${theme.vars.palette.action.selectedOpacity} + ${level * 0.1}))`,

    "&:hover": {
      backgroundColor: `rgba(${theme.vars.palette.primary.mainChannel} / calc(${theme.vars.palette.action.selectedOpacity} + ${theme.vars.palette.action.hoverOpacity} + ${level * 0.1}))`,
    },
  },

  "& .MuiAvatar-root": {
    width: theme.spacing(3),
    height: theme.spacing(3),
  },

  "& .MuiListItemIcon-root": {
    minWidth: 0,
  },
}));

const StyledExpandMore = styled(ExpandMore, {
  shouldForwardProp: (prop) => prop !== "open",
})<{ open?: boolean }>(({ open, theme }) => ({
  transform: open ? "rotate(180deg)" : "rotate(0deg)",
  transition: theme.transitions.create("transform"),
}));

export interface ListItemLinkProps {
  disabled?: boolean;
  href?: string;
  icon?: React.ElementType;
  isExpandable?: boolean;
  label?: string;
  level?: number;
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  open?: boolean;
  selected: boolean;
}

const ListItemLink = ({
  disabled,
  href,
  icon: Icon,
  isExpandable,
  label,
  level,
  onClick,
  open,
  selected,
}: ListItemLinkProps) => (
  <ListItem disablePadding>
    <StyledListItemButton
      {...(href ? { component: Link, href } : {})}
      disabled={disabled}
      level={level}
      onClick={onClick}
      selected={selected}
    >
      {Icon && (
        <ListItemIcon>
          <Icon />
        </ListItemIcon>
      )}
      <ListItemText primary={label} />
      {isExpandable && <StyledExpandMore open={open} />}
    </StyledListItemButton>
  </ListItem>
);

export default ListItemLink;
