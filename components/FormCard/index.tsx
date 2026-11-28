"use client";

import {
  Card,
  CardActions,
  CardContent,
  CardHeader,
  type CardProps,
  ListItem,
  ListItemText,
} from "@mui/material";
import { styled, type Theme } from "@mui/material/styles";

export const StyledCardHeader = styled(CardHeader)(({ theme }) => ({
  padding: theme.spacing(2),
  paddingBottom: 0,

  "& .MuiCardHeader-action": {
    margin: 0,
    alignSelf: "center",
  },
}));

export const StyledCardContent = styled(CardContent)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

const listItemStyles = (theme: Theme) => ({
  gap: theme.spacing(1),

  "& .MuiListItemSecondaryAction-root": {
    position: "relative",
    top: "auto",
    right: "auto",
    transform: "none",
    flexShrink: 0,
  },
});

export const StyledListItem = styled(ListItem)(({ theme }) =>
  listItemStyles(theme),
);

export const StyledStackedListItem = styled(ListItem)(({ theme }) => ({
  ...listItemStyles(theme),

  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
    alignItems: "stretch",

    "& .MuiListItemSecondaryAction-root .MuiButton-root": {
      width: "100%",
    },
  },
}));

export const StyledOutlinedListItem = styled(ListItem)(({ theme }) => ({
  ...listItemStyles(theme),
  padding: theme.spacing(1.5),
  border: `1px solid ${theme.vars.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
}));

export const StyledListItemText = styled(ListItemText)({
  "& .MuiListItemText-secondary": {
    wordBreak: "break-all",
  },
});

export const StyledCardActions = styled(CardActions)(({ theme }) => ({
  padding: theme.spacing(2),
  paddingTop: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
}));

// https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#attr-fs-novalidate
const FormCard = ({ ref, ...props }: CardProps<"form">) => (
  <Card ref={ref} component="form" noValidate variant="outlined" {...props} />
);

FormCard.displayName = "FormCard";

export default FormCard;
