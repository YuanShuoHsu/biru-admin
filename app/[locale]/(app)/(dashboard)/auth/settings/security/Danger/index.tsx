"use client";

import { useTranslations } from "next-intl";

import FormCard, {
  StyledCardContent,
  StyledCardHeader,
} from "@/components/FormCard";

import { Button, ListItem, ListItemText, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledListItem = styled(ListItem)({
  "& .MuiListItemSecondaryAction-root": { right: 0 },
});

const Danger = () => {
  const tAuth = useTranslations("auth");

  return (
    <FormCard sx={{ borderColor: "error.main" }} variant="outlined">
      <StyledCardHeader
        title={
          <Typography color="error" fontWeight="bold" variant="h6">
            {tAuth("settings.danger.label")}
          </Typography>
        }
      />
      <StyledCardContent>
        <StyledListItem
          disablePadding
          secondaryAction={
            <Button color="error" disabled size="small" variant="contained">
              {tAuth("settings.danger.action")}
            </Button>
          }
        >
          <ListItemText
            primary={tAuth("settings.danger.title")}
            secondary={tAuth("settings.danger.subtitle")}
            slotProps={{ secondary: { variant: "caption" } }}
          />
        </StyledListItem>
      </StyledCardContent>
    </FormCard>
  );
};

export default Danger;
