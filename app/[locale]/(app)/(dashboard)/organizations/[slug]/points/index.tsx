"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useCallback, useState } from "react";

import UpdatePointsDialog from "./UpdatePointsDialog";

import { authClient } from "@/lib/auth-client";

import { Edit } from "@mui/icons-material";
import {
  Button,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { ActiveOrganization } from "@/types/organizations";

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

interface OrganizationsSlugPointsProps {
  activeOrganization: ActiveOrganization;
  canUpdatePoints: boolean;
}

const OrganizationsSlugPoints = ({
  activeOrganization: initialActiveOrganization,
  canUpdatePoints,
}: OrganizationsSlugPointsProps) => {
  const [organization, setOrganization] = useState(initialActiveOrganization);

  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const tOrganizations = useTranslations("organizations");

  const fetchOrganization = useCallback(async () => {
    const { data } = await authClient.organization.getFullOrganization({
      query: { organizationSlug: organization.slug },
    });

    if (data) setOrganization(data);
  }, [organization.slug]);

  const handleUpdatePoints = () => {
    setDialog({
      content: (
        <UpdatePointsDialog
          fetchOrganization={fetchOrganization}
          organization={organization}
        />
      ),
      formId: "update-points-form",
      open: true,
      title: tOrganizations("points.actions.updatePoints.title"),
    });
  };

  return (
    <>
      {canUpdatePoints && (
        <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1}>
          <Button
            onClick={handleUpdatePoints}
            size="small"
            startIcon={<Edit />}
            variant="contained"
          >
            {tOrganizations("points.actions.updatePoints.title")}
          </Button>
        </Stack>
      )}
      <StyledPaper variant="outlined">
        <List dense disablePadding>
          <ListItem disableGutters>
            <ListItemText
              primary={tOrganizations("points.amountPerPoint.label")}
              secondary={
                organization.amountPerPoint != null
                  ? format.number(Number(organization.amountPerPoint))
                  : tOrganizations("points.disabled")
              }
            />
          </ListItem>
          <ListItem disableGutters>
            <ListItemText
              primary={tOrganizations("points.pointsValidityYears.label")}
              secondary={
                organization.pointsValidityYears != null
                  ? tOrganizations("points.validityYears", {
                      years: organization.pointsValidityYears,
                    })
                  : tOrganizations("points.perpetual")
              }
            />
          </ListItem>
        </List>
      </StyledPaper>
    </>
  );
};

export default OrganizationsSlugPoints;
