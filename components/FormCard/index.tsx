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
import { styled } from "@mui/material/styles";

export const StyledCardHeader = styled(CardHeader)(({ theme }) => ({
  padding: theme.spacing(2),
  paddingBottom: 0,
}));

export const StyledCardContent = styled(CardContent)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
}));

export const StyledListItem = styled(ListItem)(({ theme }) => ({
  gap: theme.spacing(1),

  "& .MuiListItemSecondaryAction-root": {
    position: "relative",
    top: "auto",
    right: "auto",
    transform: "none",
    flexShrink: 0,
  },
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

const FormCard = ({ ref, ...props }: CardProps<"form">) => (
  <Card ref={ref} component="form" {...props} />
);

FormCard.displayName = "FormCard";

export default FormCard;
